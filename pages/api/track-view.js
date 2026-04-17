import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { page } = req.body;
  if (!page) return res.status(400).end();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  await supabase.from("page_views").insert({ page });
  res.json({ success: true });
}
