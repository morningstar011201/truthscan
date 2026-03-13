import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const ADMIN_EMAIL = "mr.morningstar011201@gmail.com";

export default function Admin() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [confirmPopup, setConfirmPopup] = useState(null);
  const [creditEmail, setCreditEmail] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [deductEmail, setDeductEmail] = useState("");
  const [deductAmount, setDeductAmount] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user;
      setUser(u);
      if (!u) { setError("Please sign in!"); setLoading(false); return; }
      if (u.email !== ADMIN_EMAIL) { setError("Access denied!"); setLoading(false); return; }
      fetchStats(u.email);
    });
  }, []);

  async function fetchStats(email) {
    setLoading(true);
    const res = await fetch("/api/admin-stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const data = await res.json();
    if (data.error) { setError(data.error); setLoading(false); return; }
    setStats(data);
    setLoading(false);
  }

  async function adminAction(action, payload) {
    const res = await fetch("/api/admin-stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email, action, payload }) });
    const data = await res.json();
    if (data.error) { setActionMsg("❌ " + data.error); return; }
    setActionMsg("✅ Done!");
    if (action === "delete_user") { setSelectedUser(null); setUserDetail(null); }
    fetchStats(user.email);
    setTimeout(() => setActionMsg(""), 3000);
  }

  async function openUserDetail(email) {
    setUserDetailLoading(true);
    setSelectedUser(email);
    const res = await fetch("/api/admin-stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email, action: "get_user", payload: { targetEmail: email } }) });
    const data = await res.json();
    setUserDetail(data);
    setUserDetailLoading(false);
  }

  function exportCSV() {
    const rows = [["Email", "Full Name", "Total Scans", "Credits", "Signup Date", "Status"]];
    stats.users.all.forEach(u => {
      rows.push([u.email, u.full_name || "", u.total_scans || 0, u.scan_credits || 0, new Date(u.created_at).toLocaleDateString("en-IN"), u.is_banned ? "Banned" : "Active"]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "truthscan_users.csv"; a.click();
  }

  const s = {
    page: { minHeight: "100vh", background: "#080b10", color: "#dde2ea", fontFamily: "'Segoe UI', sans-serif", padding: "0 16px 60px" },
    nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", maxWidth: 1200, margin: "0 auto" },
    wrap: { maxWidth: 1200, margin: "0 auto" },
    grid4: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 16 },
    grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: 16 },
    card: { background: "#0d1520", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px" },
    label: { fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#8899aa", marginBottom: 8 },
    big: { fontSize: 32, fontWeight: 900, color: "#00ffe0" },
    sub: { fontSize: 12, color: "#8899aa", marginTop: 4 },
    tab: (active) => ({ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(0,255,224,0.2)", background: active ? "rgba(0,255,224,0.12)" : "transparent", color: active ? "#00ffe0" : "#8899aa", cursor: "pointer", fontSize: 12, fontWeight: 600 }),
    table: { width: "100%", borderCollapse: "collapse" },
    th: { fontFamily: "monospace", fontSize: 9, letterSpacing: 2, color: "#8899aa", padding: "8px 12px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.05)" },
    td: { fontSize: 12, color: "#dde2ea", padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.03)" },
    input: { background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 14px", color: "#dde2ea", fontSize: 13, width: "100%" },
    btn: { padding: "10px 20px", borderRadius: 8, border: "2px solid rgba(0,255,224,0.4)", background: "rgba(0,255,224,0.08)", color: "#00ffe0", fontSize: 13, fontWeight: 700, cursor: "pointer" },
    btnRed: { padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,61,110,0.4)", background: "rgba(255,61,110,0.08)", color: "#ff3d6e", fontSize: 12, fontWeight: 700, cursor: "pointer" },
    btnGreen: { padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(0,232,90,0.4)", background: "rgba(0,232,90,0.08)", color: "#00e85a", fontSize: 12, fontWeight: 700, cursor: "pointer" },
    btnYellow: { padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,230,0,0.4)", background: "rgba(255,230,0,0.08)", color: "#ffe600", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  };

  if (loading) return <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ fontFamily: "monospace", color: "#00ffe0", fontSize: 14, letterSpacing: 3 }}>LOADING ADMIN...</div></div>;
  if (error) return <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: "#ff3d6e", fontSize: 18, fontWeight: 700 }}>{error}</div></div>;

  const filteredUsers = stats?.users?.all?.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div style={s.page}>

      {/* CONFIRM POPUP */}
      {confirmPopup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#0d1520", border: "1px solid rgba(255,61,110,0.3)", borderRadius: 16, padding: 32, maxWidth: 400, width: "90%" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 12 }}>{confirmPopup.title}</div>
            <div style={{ fontSize: 13, color: "#8899aa", marginBottom: 24 }}>{confirmPopup.message}</div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => { confirmPopup.onConfirm(); setConfirmPopup(null); }} style={s.btnRed}>Confirm</button>
              <button onClick={() => setConfirmPopup(null)} style={s.btn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* USER DETAIL MODAL */}
      {selectedUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 999, overflowY: "auto", padding: 16 }}>
          <div style={{ maxWidth: 820, margin: "20px auto", background: "#0a0f1a", border: "1px solid rgba(0,255,224,0.15)", borderRadius: 20, padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>👤 User Detail</div>
              <button onClick={() => { setSelectedUser(null); setUserDetail(null); }} style={{ background: "none", border: "none", color: "#8899aa", fontSize: 22, cursor: "pointer" }}>✕</button>
            </div>

            {userDetailLoading ? (
              <div style={{ textAlign: "center", color: "#00ffe0", fontFamily: "monospace", padding: 40 }}>Loading...</div>
            ) : userDetail?.profile ? (
              <>
                {/* Profile Info */}
                <div style={{ ...s.card, marginBottom: 16 }}>
                  <div style={s.label}>PROFILE INFO</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    {[
                      { label: "Email", value: userDetail.profile.email },
                      { label: "Full Name", value: userDetail.profile.full_name || "—" },
                      { label: "Username", value: userDetail.profile.username || "—" },
                      { label: "Date of Birth", value: userDetail.profile.dob || "—" },
                      { label: "Phone", value: userDetail.profile.phone || "—" },
                      { label: "Signup Date", value: new Date(userDetail.profile.created_at).toLocaleDateString("en-IN") },
                      { label: "Total Scans", value: userDetail.profile.total_scans || 0 },
                      { label: "Credits Left", value: userDetail.profile.scan_credits || 0 },
                      { label: "Status", value: userDetail.profile.is_banned ? "🚫 BANNED" : "✅ Active" },
                      { label: "Last Scan", value: userDetail.profile.last_scan_date || "Never" },
                    ].map((item, i) => (
                      <div key={i}>
                        <div style={{ fontSize: 10, color: "#8899aa", fontFamily: "monospace", letterSpacing: 2 }}>{item.label}</div>
                        <div style={{ fontSize: 14, color: "#dde2ea", fontWeight: 600, marginTop: 2 }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Purchase History */}
                <div style={{ ...s.card, marginBottom: 16 }}>
                  <div style={s.label}>PURCHASE HISTORY ({userDetail.payments?.length || 0} payments)</div>
                  {userDetail.payments?.length === 0 ? (
                    <div style={{ color: "#8899aa", fontSize: 13 }}>No purchases yet</div>
                  ) : (
                    <table style={s.table}>
                      <thead><tr>{["PACK", "AMOUNT", "CREDITS", "STATUS", "DATE"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {userDetail.payments?.map((p, i) => (
                          <tr key={i}>
                            <td style={{ ...s.td, color: "#00ffe0" }}>{p.pack}</td>
                            <td style={{ ...s.td, color: "#ffe600" }}>₹{p.amount}</td>
                            <td style={{ ...s.td, color: "#c060ff" }}>{p.credits}</td>
                            <td style={{ ...s.td, color: p.status === "success" ? "#00e85a" : "#ff3d6e" }}>{p.status || "success"}</td>
                            <td style={{ ...s.td, color: "#8899aa" }}>{new Date(p.created_at).toLocaleDateString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Credit History Ledger */}
                <div style={{ ...s.card, marginBottom: 16 }}>
                  <div style={s.label}>CREDIT LEDGER — FULL TRANSACTION HISTORY</div>
                  {userDetail.creditHistory?.length === 0 ? (
                    <div style={{ color: "#8899aa", fontSize: 13 }}>No credit history yet</div>
                  ) : (
                    <table style={s.table}>
                      <thead><tr>{["ACTION", "CREDITS", "BALANCE AFTER", "NOTE", "DATE"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {userDetail.creditHistory?.map((c, i) => {
                          const isAdd = c.action.includes("add") || c.action.includes("purchase");
                          const balanceMatch = c.note?.match(/Balance: (\d+)/);
                          const balance = balanceMatch ? balanceMatch[1] : "—";
                          return (
                            <tr key={i}>
                              <td style={{ ...s.td, color: isAdd ? "#00e85a" : "#ff3d6e", fontWeight: 700 }}>
                                {isAdd ? "+" : "−"} {c.action.replace("_", " ").toUpperCase()}
                              </td>
                              <td style={{ ...s.td, color: isAdd ? "#00e85a" : "#ff3d6e", fontWeight: 900 }}>
                                {isAdd ? "+" : "−"}{c.credits}
                              </td>
                              <td style={{ ...s.td, color: "#ffe600", fontFamily: "monospace" }}>{balance}</td>
                              <td style={{ ...s.td, color: "#8899aa", fontSize: 11 }}>{c.note?.replace(/\s*\| Balance: \d+/, "") || "—"}</td>
                              <td style={{ ...s.td, color: "#8899aa", fontSize: 11 }}>{new Date(c.created_at).toLocaleString("en-IN")}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Admin Actions */}
                <div style={s.card}>
                  <div style={s.label}>ADMIN ACTIONS</div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <button onClick={() => setConfirmPopup({
                      title: userDetail.profile.is_banned ? "Unban User?" : "Ban User?",
                      message: `This will ${userDetail.profile.is_banned ? "restore access for" : "block"} ${userDetail.profile.email}`,
                      onConfirm: () => adminAction(userDetail.profile.is_banned ? "unban_user" : "ban_user", { targetEmail: userDetail.profile.email })
                    })} style={userDetail.profile.is_banned ? s.btnGreen : s.btnRed}>
                      {userDetail.profile.is_banned ? "✅ Unban User" : "🚫 Ban User"}
                    </button>
                    <button onClick={() => setConfirmPopup({
                      title: "🔥 Permanently Delete User?",
                      message: `This will PERMANENTLY delete ${userDetail.profile.email} and ALL their data — scans, payments, credits. THIS CANNOT BE UNDONE.`,
                      onConfirm: () => adminAction("delete_user", { targetEmail: userDetail.profile.email })
                    })} style={{ ...s.btnRed, border: "2px solid rgba(255,61,110,0.6)", fontWeight: 900 }}>
                      🔥 Delete User Permanently
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ color: "#ff3d6e" }}>User not found</div>
            )}
          </div>
        </div>
      )}

      {/* NAV */}
      <div style={s.nav}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>⚡ TRUTHSCAN <span style={{ color: "#00ffe0" }}>ADMIN</span></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => fetchStats(user.email)} style={s.btn}>🔄 Refresh</button>
          <button onClick={() => window.location.href = "/"} style={{ ...s.btn, color: "#8899aa", borderColor: "rgba(255,255,255,0.1)" }}>← Back</button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ ...s.wrap, display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {["overview", "payments", "users", "scans", "controls"].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={s.tab(activeTab === t)}>{t.toUpperCase()}</button>
        ))}
      </div>

      <div style={s.wrap}>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <>
            <div style={s.label}>💰 REVENUE</div>
            <div style={s.grid4}>
              {[
                { label: "TOTAL REVENUE", value: "₹" + stats.revenue.total, sub: "All time", color: "#ffe600" },
                { label: "TODAY", value: "₹" + stats.revenue.today, sub: "Today only", color: "#ffe600" },
                { label: "THIS MONTH", value: "₹" + stats.revenue.month, sub: "Last 30 days", color: "#ffe600" },
                { label: "ARPPU", value: "₹" + stats.revenue.arppu, sub: "Avg per paying user", color: "#ffe600" },
              ].map((item, i) => (
                <div key={i} style={s.card}><div style={s.label}>{item.label}</div><div style={{ ...s.big, color: item.color }}>{item.value}</div><div style={s.sub}>{item.sub}</div></div>
              ))}
            </div>

            <div style={{ ...s.label, marginTop: 8 }}>👥 USERS</div>
            <div style={s.grid4}>
              {[
                { label: "TOTAL USERS", value: stats.users.total, color: "#00ffe0" },
                { label: "NEW TODAY", value: stats.users.today, color: "#00ffe0" },
                { label: "NEW THIS WEEK", value: stats.users.week, color: "#00ffe0" },
                { label: "🟢 ACTIVE TODAY", value: stats.users.activeToday, color: "#00e85a", sub: "Users who scanned today" },
              ].map((item, i) => (
                <div key={i} style={s.card}><div style={s.label}>{item.label}</div><div style={{ ...s.big, color: item.color }}>{item.value}</div>{item.sub && <div style={s.sub}>{item.sub}</div>}</div>
              ))}
            </div>

            <div style={{ ...s.label, marginTop: 8 }}>⚡ SCANS</div>
            <div style={s.grid4}>
              {[
                { label: "TOTAL SCANS", value: stats.scans.total, color: "#c060ff" },
                { label: "TODAY", value: stats.scans.today, color: "#c060ff" },
                { label: "YESTERDAY", value: stats.scans.yesterday, color: "#c060ff" },
                { label: "AVG SCANS / USER", value: stats.scans.avgPerUser, color: "#c060ff", sub: "Higher = more addictive" },
              ].map((item, i) => (
                <div key={i} style={s.card}><div style={s.label}>{item.label}</div><div style={{ ...s.big, color: item.color }}>{item.value}</div>{item.sub && <div style={s.sub}>{item.sub}</div>}</div>
              ))}
            </div>

            <div style={{ ...s.label, marginTop: 8 }}>📊 CONVERSION FUNNEL</div>
            <div style={s.grid3}>
              {[
                { label: "TOTAL SIGNUPS", value: stats.conversion.total, color: "#00ffe0", sub: "100%" },
                { label: "DID FIRST SCAN", value: stats.conversion.scanned, color: "#c060ff", sub: stats.conversion.firstScanRate + "% of signups" },
                { label: "BOUGHT CREDITS", value: stats.conversion.paid, color: "#ffe600", sub: stats.conversion.rate + "% of signups" },
              ].map((item, i) => (
                <div key={i} style={s.card}><div style={s.label}>{item.label}</div><div style={{ ...s.big, color: item.color }}>{item.value}</div><div style={s.sub}>{item.sub}</div></div>
              ))}
            </div>

            <div style={{ ...s.label, marginTop: 8 }}>🛒 PACK SALES</div>
            <div style={s.grid3}>
              {[
                { name: "STARTER ₹10", pack: "starter", color: "#00ffe0" },
                { name: "POPULAR ₹99 🔥", pack: "popular", color: "#ffe600" },
                { name: "POWER ₹199 ⭐", pack: "power", color: "#c060ff" },
              ].map((item, i) => (
                <div key={i} style={{ ...s.card, border: `1px solid ${item.color}22` }}>
                  <div style={s.label}>{item.name}</div>
                  <div style={{ ...s.big, color: item.color }}>{stats.packs[item.pack]?.count || 0} sales</div>
                  <div style={s.sub}>₹{stats.packs[item.pack]?.revenue || 0} revenue</div>
                </div>
              ))}
            </div>

            <div style={{ ...s.label, marginTop: 8 }}>💳 CREDIT ECONOMY</div>
            <div style={s.grid3}>
              {[
                { label: "TOTAL PURCHASED", value: stats.credits.purchased, color: "#00ffe0" },
                { label: "TOTAL USED", value: stats.credits.used, color: "#ff3d6e" },
                { label: "REMAINING (SYSTEM)", value: stats.credits.remaining, color: "#ffe600" },
              ].map((item, i) => (
                <div key={i} style={s.card}><div style={s.label}>{item.label}</div><div style={{ ...s.big, color: item.color }}>{item.value}</div></div>
              ))}
            </div>

            <div style={{ ...s.label, marginTop: 8 }}>🤖 ESTIMATED AI COSTS</div>
            <div style={s.grid4}>
              {[
                { label: "SCANS TODAY", value: stats.costs.todayScans, color: "#8899aa" },
                { label: "EST. COST TODAY", value: "$" + stats.costs.todayCost, color: "#ff3d6e" },
                { label: "EST. COST THIS MONTH", value: "$" + stats.costs.monthCost, color: "#ff3d6e" },
                { label: "COST PER SCAN", value: "$" + stats.costs.costPerScan, color: "#8899aa" },
              ].map((item, i) => (
                <div key={i} style={s.card}><div style={s.label}>{item.label}</div><div style={{ ...s.big, fontSize: 24, color: item.color }}>{item.value}</div></div>
              ))}
            </div>

            <div style={{ ...s.label, marginTop: 8 }}>🔥 TOP VIRAL USERS (5+ scans)</div>
            <div style={s.card}>
              {stats.viralUsers?.length === 0 ? (
                <div style={{ color: "#8899aa", fontSize: 13 }}>No viral users yet — keep growing!</div>
              ) : (
                <table style={s.table}>
                  <thead><tr>{["EMAIL", "TOTAL SCANS", "CREDITS LEFT", "LAST SCAN"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {stats.viralUsers?.map((u, i) => (
                      <tr key={i} onClick={() => openUserDetail(u.email)} style={{ cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,230,0,0.03)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ ...s.td, color: "#ffe600" }}>{u.email}</td>
                        <td style={{ ...s.td, color: "#ff3d6e", fontWeight: 900, fontSize: 16 }}>{u.total_scans}</td>
                        <td style={{ ...s.td, color: "#00ffe0" }}>{u.scan_credits || 0}</td>
                        <td style={{ ...s.td, color: "#8899aa" }}>{u.last_scan_date || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ ...s.label, marginTop: 8 }}>📊 SCANS LAST 7 DAYS</div>
            <div style={s.card}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120, padding: "10px 0" }}>
                {stats.scans.perDay.map((d, i) => {
                  const max = Math.max(...stats.scans.perDay.map(x => x.count), 1);
                  const h = Math.max((d.count / max) * 100, 4);
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ fontSize: 10, color: "#00ffe0", fontFamily: "monospace" }}>{d.count}</div>
                      <div style={{ width: "100%", height: h + "%", background: "linear-gradient(180deg,#00ffe0,#00ffe044)", borderRadius: "4px 4px 0 0", minHeight: 4 }} />
                      <div style={{ fontSize: 9, color: "#8899aa", fontFamily: "monospace" }}>{d.date.slice(5)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* PAYMENTS */}
        {activeTab === "payments" && (
          <div style={s.card}>
            <div style={s.label}>RECENT PAYMENTS ({stats.payments.total} total)</div>
            <table style={s.table}>
              <thead><tr>{["EMAIL", "PACK", "AMOUNT", "CREDITS", "STATUS", "ORDER ID", "TIME"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {stats.payments.recent.map((p, i) => (
                  <tr key={i} onClick={() => openUserDetail(p.email)} style={{ cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(0,255,224,0.03)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ ...s.td, color: "#00ffe0" }}>{p.email}</td>
                    <td style={{ ...s.td, fontFamily: "monospace" }}>{p.pack}</td>
                    <td style={{ ...s.td, color: "#ffe600", fontWeight: 700 }}>₹{p.amount}</td>
                    <td style={{ ...s.td, color: "#c060ff" }}>{p.credits}</td>
                    <td style={{ ...s.td, color: p.status === "success" ? "#00e85a" : "#ff3d6e", fontWeight: 700 }}>{p.status || "success"}</td>
                    <td style={{ ...s.td, color: "#8899aa", fontSize: 10 }}>{p.order_id?.slice(0, 18)}...</td>
                    <td style={{ ...s.td, color: "#8899aa", fontSize: 11 }}>{new Date(p.created_at).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* USERS */}
        {activeTab === "users" && (
          <>
            <div style={{ marginBottom: 12, display: "flex", gap: 10 }}>
              <input style={{ ...s.input, flex: 1 }} placeholder="🔍 Search by email or name..." value={search} onChange={e => setSearch(e.target.value)} />
              <button onClick={exportCSV} style={s.btnYellow}>📥 Export CSV</button>
            </div>
            <div style={s.card}>
              <div style={s.label}>ALL USERS ({filteredUsers.length})</div>
              <table style={s.table}>
                <thead><tr>{["NAME", "EMAIL", "TOTAL SCANS", "CREDITS", "PAYING", "SIGNUP DATE", "STATUS", ""].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {filteredUsers.map((u, i) => (
                    <tr key={i} onMouseEnter={e => e.currentTarget.style.background = "rgba(0,255,224,0.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={s.td}>{u.full_name || "—"}</td>
                      <td style={{ ...s.td, color: "#00ffe0" }}>{u.email}</td>
                      <td style={{ ...s.td, color: "#c060ff", fontWeight: 700 }}>{u.total_scans || 0}</td>
                      <td style={{ ...s.td, color: "#ffe600" }}>{u.scan_credits || 0}</td>
                      <td style={{ ...s.td, color: stats.payments.recent.some(p => p.email === u.email) ? "#00e85a" : "#8899aa" }}>
                        {stats.payments.recent.some(p => p.email === u.email) ? "💳 Yes" : "Free"}
                      </td>
                      <td style={{ ...s.td, color: "#8899aa", fontSize: 11 }}>{new Date(u.created_at).toLocaleDateString("en-IN")}</td>
                      <td style={{ ...s.td, color: u.is_banned ? "#ff3d6e" : "#00e85a" }}>{u.is_banned ? "🚫 Banned" : "✅ Active"}</td>
                      <td style={s.td}><button onClick={() => openUserDetail(u.email)} style={{ ...s.btn, padding: "5px 12px", fontSize: 11 }}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* SCANS */}
        {activeTab === "scans" && (
          <div style={s.card}>
            <div style={s.label}>SCANS PER DAY — LAST 7 DAYS</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 160, padding: "10px 0" }}>
              {stats.scans.perDay.map((d, i) => {
                const max = Math.max(...stats.scans.perDay.map(x => x.count), 1);
                const h = Math.max((d.count / max) * 100, 4);
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ fontSize: 12, color: "#00ffe0", fontFamily: "monospace", fontWeight: 700 }}>{d.count}</div>
                    <div style={{ width: "100%", height: h + "%", background: "linear-gradient(180deg,#00ffe0,#00ffe044)", borderRadius: "4px 4px 0 0", minHeight: 4 }} />
                    <div style={{ fontSize: 10, color: "#8899aa", fontFamily: "monospace" }}>{d.date.slice(5)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CONTROLS */}
        {activeTab === "controls" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {actionMsg && <div style={{ padding: "12px 16px", background: actionMsg.startsWith("✅") ? "rgba(0,232,90,0.07)" : "rgba(255,61,110,0.07)", border: `1px solid ${actionMsg.startsWith("✅") ? "rgba(0,232,90,0.2)" : "rgba(255,61,110,0.2)"}`, borderRadius: 10, color: actionMsg.startsWith("✅") ? "#00e85a" : "#ff3d6e", fontFamily: "monospace", fontSize: 13 }}>{actionMsg}</div>}

            <div style={s.card}>
              <div style={s.label}>⚡ ADD CREDITS TO USER</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 400 }}>
                <input style={s.input} placeholder="User email" value={creditEmail} onChange={e => setCreditEmail(e.target.value)} />
                <input style={s.input} placeholder="Credits to add" type="number" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} />
                <button onClick={() => setConfirmPopup({ title: "Add Credits?", message: `Add ${creditAmount} credits to ${creditEmail}?`, onConfirm: () => adminAction("add_credits", { targetEmail: creditEmail, credits: creditAmount }) })} style={s.btn}>⚡ ADD CREDITS</button>
              </div>
            </div>

            <div style={s.card}>
              <div style={s.label}>➖ DEDUCT CREDITS FROM USER</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 400 }}>
                <input style={s.input} placeholder="User email" value={deductEmail} onChange={e => setDeductEmail(e.target.value)} />
                <input style={s.input} placeholder="Credits to deduct" type="number" value={deductAmount} onChange={e => setDeductAmount(e.target.value)} />
                <button onClick={() => setConfirmPopup({ title: "Deduct Credits?", message: `Deduct ${deductAmount} credits from ${deductEmail}? This cannot be undone.`, onConfirm: () => adminAction("deduct_credits", { targetEmail: deductEmail, credits: deductAmount }) })} style={s.btnRed}>➖ DEDUCT CREDITS</button>
              </div>
            </div>

            <div style={s.card}>
              <div style={s.label}>🚫 BAN / UNBAN USER</div>
              <div style={{ display: "flex", gap: 10, maxWidth: 500, flexWrap: "wrap" }}>
                <input style={{ ...s.input, flex: 1 }} placeholder="User email" id="banEmail" />
                <button onClick={() => { const e = document.getElementById("banEmail").value; setConfirmPopup({ title: "Ban User?", message: `Ban ${e}? They will lose access immediately.`, onConfirm: () => adminAction("ban_user", { targetEmail: e }) }); }} style={s.btnRed}>🚫 BAN</button>
                <button onClick={() => { const e = document.getElementById("banEmail").value; adminAction("unban_user", { targetEmail: e }); }} style={s.btnGreen}>✅ UNBAN</button>
              </div>
            </div>

            <div style={s.card}>
              <div style={s.label}>🔥 DELETE USER PERMANENTLY</div>
              <div style={{ fontSize: 12, color: "#ff3d6e", marginBottom: 12 }}>⚠️ This removes ALL user data — scans, payments, credits. Cannot be undone.</div>
              <div style={{ display: "flex", gap: 10, maxWidth: 500, flexWrap: "wrap" }}>
                <input style={{ ...s.input, flex: 1, borderColor: "rgba(255,61,110,0.3)" }} placeholder="User email" id="deleteEmail" />
                <button onClick={() => { const e = document.getElementById("deleteEmail").value; setConfirmPopup({ title: "🔥 Permanently Delete User?", message: `DELETE ALL DATA for ${e}? This cannot be undone.`, onConfirm: () => adminAction("delete_user", { targetEmail: e }) }); }} style={{ ...s.btnRed, border: "2px solid rgba(255,61,110,0.6)", fontWeight: 900 }}>🔥 DELETE</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
