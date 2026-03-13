import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "mr.morningstar011201@gmail.com";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { email } = req.body;
  if (email !== ADMIN_EMAIL) return res.status(403).json({ error: "Unauthorized" });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Users
  const { data: allUsers } = await supabase.from("profiles").select("*");
  const { data: payments } = await supabase.from("payments").select("*").order("created_at", { ascending: false });
  const { data: scans } = await supabase.from("scan_results").select("*").order("created_at", { ascending: false });

  const todayUsers = allUsers?.filter(u => u.created_at?.startsWith(today)) || [];
  const weekUsers = allUsers?.filter(u => new Date(u.created_at) > new Date(weekAgo)) || [];
  const todayScans = scans?.filter(s => s.created_at?.startsWith(today)) || [];
  const yesterdayScans = scans?.filter(s => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    return s.created_at?.startsWith(yesterday);
  }) || [];
  const todayPayments = payments?.filter(p => p.created_at?.startsWith(today)) || [];
  const monthPayments = payments?.filter(p => new Date(p.created_at) > new Date(monthAgo)) || [];

  // Revenue
  const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const todayRevenue = todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const monthRevenue = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Pack breakdown
  const packStats = { starter: { count: 0, revenue: 0 }, popular: { count: 0, revenue: 0 }, power: { count: 0, revenue: 0 } };
  payments?.forEach(p => {
    if (packStats[p.pack]) {
      packStats[p.pack].count++;
      packStats[p.pack].revenue += p.amount || 0;
    }
  });

  // Credits
  const totalCreditsPurchased = payments?.reduce((sum, p) => sum + (p.credits || 0), 0) || 0;
  const totalCreditsRemaining = allUsers?.reduce((sum, u) => sum + (u.scan_credits || 0), 0) || 0;
  const totalCreditsUsed = totalCreditsPurchased - totalCreditsRemaining;

  // Top users
  const topUsers = [...(allUsers || [])]
    .sort((a, b) => (b.total_scans || 0) - (a.total_scans || 0))
    .slice(0, 10)
    .map(u => ({ email: u.email, total_scans: u.total_scans || 0, scan_credits: u.scan_credits || 0, last_scan_date: u.last_scan_date }));

  // Scans per day last 7 days
  const scansPerDay = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
    scansPerDay.push({ date: d, count: scans?.filter(s => s.created_at?.startsWith(d)).length || 0 });
  }

  // Paying users
  const payingUserIds = [...new Set(payments?.map(p => p.user_id))];
  const arppu = payingUserIds.length > 0 ? Math.round(totalRevenue / payingUserIds.length) : 0;

  res.json({
    users: { total: allUsers?.length || 0, today: todayUsers.length, week: weekUsers.length, paying: payingUserIds.length },
    revenue: { total: totalRevenue, today: todayRevenue, month: monthRevenue, arppu },
    scans: { total: scans?.length || 0, today: todayScans.length, yesterday: yesterdayScans.length, perDay: scansPerDay },
    payments: { total: payments?.length || 0, recent: payments?.slice(0, 20) || [] },
    packs: packStats,
    credits: { purchased: totalCreditsPurchased, used: totalCreditsUsed > 0 ? totalCreditsUsed : 0, remaining: totalCreditsRemaining },
    topUsers,
  });
}
