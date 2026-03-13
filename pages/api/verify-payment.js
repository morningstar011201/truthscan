import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const PACKS = {
  starter: 7,
  popular: 80,
  power: 200,
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, pack, userId } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(sign).digest("hex");

  if (expected !== razorpay_signature) return res.status(400).json({ error: "Invalid signature" });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { data: profile } = await supabase.from("profiles").select("scan_credits").eq("id", userId).single();
  const currentCredits = profile?.scan_credits || 0;
  const addCredits = PACKS[pack] || 0;

  await supabase.from("profiles").update({
    scan_credits: currentCredits + addCredits,
    updated_at: new Date().toISOString()
  }).eq("id", userId);

  res.json({ success: true, credits: currentCredits + addCredits });
}
