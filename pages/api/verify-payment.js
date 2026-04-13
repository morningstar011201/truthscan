import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const PACKS = {
  starter: { credits: 7, amount: 10 },
  popular: { credits: 80, amount: 99 },
  power: { credits: 200, amount: 199 },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, pack, userId, promoCode } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(sign).digest("hex");
  if (expected !== razorpay_signature) return res.status(400).json({ error: "Invalid signature" });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { data: profile } = await supabase.from("profiles").select("scan_credits, email").eq("id", userId).single();
  const currentCredits = profile?.scan_credits || 0;
  const baseCredits = PACKS[pack]?.credits || 0;
  const amount = PACKS[pack]?.amount || 0;

  // Apply promo bonus if valid
  let bonusPercent = 0;
  let promoData = null;
  if (promoCode) {
    const { data: promo } = await supabase.from("promo_codes").select("*").eq("code", promoCode.toUpperCase()).eq("is_active", true).single();
    if (promo) {
      bonusPercent = promo.bonus_percent || 0;
      promoData = promo;
    }
  }

  const bonusCredits = Math.floor(baseCredits * bonusPercent / 100);
  const totalCredits = baseCredits + bonusCredits;
  const newBalance = currentCredits + totalCredits;

  // Update credits
  await supabase.from("profiles").update({
    scan_credits: newBalance,
    updated_at: new Date().toISOString()
  }).eq("id", userId);

  // Log payment
  await supabase.from("payments").insert({
    user_id: userId,
    email: profile?.email,
    pack,
    amount,
    credits: totalCredits,
    payment_id: razorpay_payment_id,
    order_id: razorpay_order_id,
    status: "success",
    promo_code: promoData ? promoData.code : null
  });

  // Update promo code usage count
  if (promoData) {
    await supabase.from("promo_codes").update({
      total_uses: (promoData.total_uses || 0) + 1
    }).eq("id", promoData.id);
  }

  res.json({ success: true, credits: newBalance, credits_added: totalCredits, bonus_credits: bonusCredits });
}
