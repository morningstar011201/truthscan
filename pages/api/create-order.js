import Razorpay from "razorpay";

const PACKS = {
  starter: { amount: 1000, credits: 7, name: "Starter Pack" },
  popular: { amount: 9900, credits: 80, name: "Popular Pack" },
  power: { amount: 19900, credits: 200, name: "Power Pack" },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { pack } = req.body;
  if (!PACKS[pack]) return res.status(400).json({ error: "Invalid pack" });

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const order = await razorpay.orders.create({
    amount: PACKS[pack].amount,
    currency: "INR",
    notes: { pack, credits: PACKS[pack].credits }
  });

  res.json({ orderId: order.id, amount: PACKS[pack].amount, pack, credits: PACKS[pack].credits });
}
