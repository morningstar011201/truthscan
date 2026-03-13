import Razorpay from "razorpay";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { amount, planId } = req.body;
  if (!amount || !planId) return res.status(400).json({ error: "Missing amount or planId" });

  try {
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_${planId}_${Date.now()}`,
      notes: { planId },
    });

    return res.status(200).json(order);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
