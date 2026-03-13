import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "mr.morningstar011201@gmail.com";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, action, payload } = req.body;
  if (email !== ADMIN_EMAIL) return res.status(403).json({ error: "Unauthorized" });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  if (action === "add_credits") {
    const { targetEmail, credits } = payload;
    const { data: profile } = await supabase.from("profiles").select("id, scan_credits").eq("email", targetEmail).single();
    if (!profile) return res.status(404).json({ error: "User not found" });
    const newCredits = (profile.scan_credits || 0) + parseInt(credits);
    await supabase.from("profiles").update({ scan_credits: newCredits }).eq("id", profile.id);
    await supabase.from("credit_history").insert({ user_id: profile.id, email: targetEmail, action: "admin_added", credits: parseInt(credits), admin_email: email, note: "Admin added | Balance: " + newCredits });
    return res.json({ success: true });
  }

  if (action === "deduct_credits") {
    const { targetEmail, credits } = payload;
    const { data: profile } = await supabase.from("profiles").select("id, scan_credits").eq("email", targetEmail).single();
    if (!profile) return res.status(404).json({ error: "User not found" });
    const newCredits = Math.max(0, (profile.scan_credits || 0) - parseInt(credits));
    await supabase.from("profiles").update({ scan_credits: newCredits }).eq("id", profile.id);
    await supabase.from("credit_history").insert({ user_id: profile.id, email: targetEmail, action: "admin_deducted", credits: parseInt(credits), admin_email: email, note: "Admin deducted | Balance: " + newCredits });
    return res.json({ success: true });
  }

  if (action === "ban_user") {
    const { targetEmail } = payload;
    const { data: profile } = await supabase.from("profiles").select("id").eq("email", targetEmail).single();
    if (!profile) return res.status(404).json({ error: "User not found" });
    await supabase.from("profiles").update({ is_banned: true }).eq("id", profile.id);
    return res.json({ success: true });
  }

  if (action === "unban_user") {
    const { targetEmail } = payload;
    const { data: profile } = await supabase.from("profiles").select("id").eq("email", targetEmail).single();
    if (!profile) return res.status(404).json({ error: "User not found" });
    await supabase.from("profiles").update({ is_banned: false }).eq("id", profile.id);
    return res.json({ success: true });
  }

  if (action === "delete_user") {
    const { targetEmail } = payload;
    const { data: profile } = await supabase.from("profiles").select("id").eq("email", targetEmail).single();
    if (!profile) return res.status(404).json({ error: "User not found" });
    await supabase.from("scan_results").delete().eq("user_id", profile.id);
    await supabase.from("payments").delete().eq("user_id", profile.id);
    await supabase.from("credit_history").delete().eq("user_id", profile.id);
    await supabase.from("profiles").delete().eq("id", profile.id);
    return res.json({ success: true });
  }

  if (action === "get_user") {
    const { targetEmail } = payload;
    const { data: profile } = await supabase.from("profiles").select("*").eq("email", targetEmail).single();
    if (!profile) return res.status(404).json({ error: "User not found" });
    const { data: payments } = await supabase.from("payments").select("*").eq("user_id", profile.id).order("created_at", { ascending: false });
    const { data: creditHistory } = await supabase.from("credit_history").select("*").eq("user_id", profile.id).order("created_at", { ascending: false });
    const { data: scans } = await supabase.from("scan_results").select("id, created_at").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(30);
    return res.json({ profile, payments: payments || [], creditHistory: creditHistory || [], scans: scans || [] });
  }

  // FETCH ALL STATS
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: allUsers } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  const { data: payments } = await supabase.from("payments").select("*").order("created_at", { ascending: false });
  const { data: scans } = await supabase.from("scan_results").select("*").order("created_at", { ascending: false });

  const todayUsers = allUsers?.filter(u => u.created_at?.startsWith(today)) || [];
  const weekUsers = allUsers?.filter(u => new Date(u.created_at) > new Date(weekAgo)) || [];
  const todayScans = scans?.filter(s => s.created_at?.startsWith(today)) || [];
  const yesterdayScans = scans?.filter(s => { const y = new Date(Date.now() - 86400000).toISOString().split("T")[0]; return s.created_at?.startsWith(y); }) || [];
  const todayPayments = payments?.filter(p => p.created_at?.startsWith(today)) || [];
  const monthPayments = payments?.filter(p => new Date(p.created_at) > new Date(monthAgo)) || [];

  const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const todayRevenue = todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const monthRevenue = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const packStats = { starter: { count: 0, revenue: 0 }, popular: { count: 0, revenue: 0 }, power: { count: 0, revenue: 0 } };
  payments?.forEach(p => { if (packStats[p.pack]) { packStats[p.pack].count++; packStats[p.pack].revenue += p.amount || 0; } });

  const totalCreditsPurchased = payments?.reduce((sum, p) => sum + (p.credits || 0), 0) || 0;
  const totalCreditsRemaining = allUsers?.reduce((sum, u) => sum + (u.scan_credits || 0), 0) || 0;
  const payingUserIds = [...new Set(payments?.map(p => p.user_id))];
  const arppu = payingUserIds.length > 0 ? Math.round(totalRevenue / payingUserIds.length) : 0;

  const scansPerDay = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
    scansPerDay.push({ date: d, count: scans?.filter(s => s.created_at?.startsWith(d)).length || 0 });
  }

  const topUsers = [...(allUsers || [])].sort((a, b) => (b.total_scans || 0) - (a.total_scans || 0)).slice(0, 10);

  // Active users today (did at least 1 scan today)
  const activeToday = allUsers?.filter(u => u.last_scan_date === today).length || 0;

  // Avg scans per user
  const avgScansPerUser = allUsers?.length > 0 ? (scans?.length / allUsers.length).toFixed(1) : 0;

  // First scan conversion
  const usersWhoScanned = allUsers?.filter(u => (u.total_scans || 0) > 0).length || 0;
  const firstScanRate = allUsers?.length > 0 ? Math.round((usersWhoScanned / allUsers.length) * 100) : 0;
  const conversionRate = allUsers?.length > 0 ? Math.round((payingUserIds.length / allUsers.length) * 100) : 0;

  // Cost estimator (Groq is free but estimate)
  const costPerScan = 0.002; // estimated $0.002 per scan
  const todayCost = (todayScans.length * costPerScan).toFixed(4);
  const monthCost = (monthPayments.length > 0 ? scans?.filter(s => new Date(s.created_at) > new Date(monthAgo)).length : 0) * costPerScan;

  // Viral users (scanned 5+ times)
  const viralUsers = [...(allUsers || [])].filter(u => (u.total_scans || 0) >= 5).sort((a, b) => (b.total_scans || 0) - (a.total_scans || 0)).slice(0, 10);

  res.json({
    users: { total: allUsers?.length || 0, today: todayUsers.length, week: weekUsers.length, paying: payingUserIds.length, activeToday, all: allUsers || [] },
    revenue: { total: totalRevenue, today: todayRevenue, month: monthRevenue, arppu },
    scans: { total: scans?.length || 0, today: todayScans.length, yesterday: yesterdayScans.length, perDay: scansPerDay, avgPerUser: avgScansPerUser },
    payments: { total: payments?.length || 0, recent: payments?.slice(0, 50) || [] },
    packs: packStats,
    credits: { purchased: totalCreditsPurchased, used: totalCreditsPurchased - totalCreditsRemaining, remaining: totalCreditsRemaining },
    topUsers,
    viralUsers,
    conversion: { total: allUsers?.length || 0, scanned: usersWhoScanned, paid: payingUserIds.length, rate: conversionRate, firstScanRate },
    costs: { todayScans: todayScans.length, todayCost, monthCost: monthCost.toFixed(4), costPerScan },
  });
}
