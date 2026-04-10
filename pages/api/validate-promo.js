import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { code } = req.body;
  if (!code) return res.status(400).json({ valid: false });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data } = await supabase.from("promo_codes").select("*").eq("code", code.toUpperCase()).eq("is_active", true).single();

  if (!data) return res.json({ valid: false });
  return res.json({ valid: true, bonus_percent: data.bonus_percent, influencer: data.influencer_name });
}
