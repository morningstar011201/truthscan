import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    planId,
    userId,
    planType,
  } = req.body;

  // Verify signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, error: "Invalid signature" });
  }

  // Calculate expiry
  const now = new Date();
  let expiresAt = null;
  if (planType === "daily") {
    expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +1 day
  } else {
    expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days
  }

  // Update user plan in Supabase
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      plan: planId,
      plan_expires_at: expiresAt.toISOString(),
      monthly_scans_used: 0,
      updated_at: now.toISOString(),
    })
    .eq("id", userId);

  if (error) return res.status(500).json({ success: false, error: error.message });

  return res.status(200).json({ success: true });
}
