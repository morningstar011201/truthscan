import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Admin() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [creditEmail, setCreditEmail] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditMsg, setCreditMsg] = useState("");

  const ADMIN_EMAIL = "mr.morningstar011201@gmail.com";

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
    const res = await fetch("/api/admin-stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (data.error) { setError(data.error); setLoading(false); return; }
    setStats(data);
    setLoading(false);
  }

  async function addCredits() {
    if (!creditEmail || !creditAmount) return;
    const { data: profile } = await supabase.from("profiles").select("id, scan_credits").eq("email", creditEmail).single();
    if (!profile) { setCreditMsg("❌ User not found!"); return; }
    await supabase.from("profiles").update({ scan_credits: (profile.scan_credits || 0) + parseInt(creditAmount) }).eq("id", profile.id);
    setCreditMsg("✅ Added " + creditAmount + " credits to " + creditEmail);
    fetchStats(user.email);
  }

  const s = { 
    page: { minHeight: "100vh", background: "#080b10", color: "#dde2ea", fontFamily: "'Segoe UI', sans-serif", padding: "0 16px 60px" },
    nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", maxWidth: 1100, margin: "0 auto" },
    wrap: { maxWidth: 1100, margin: "0 auto" },
    title: { fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: 2 },
    grid4: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 16 },
    grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 16 },
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
  };

  if (loading) return <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ fontFamily: "monospace", color: "#00ffe0", fontSize: 14, letterSpacing: 3 }}>LOADING ADMIN...</div></div>;
  if (error) return <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: "#ff3d6e", fontSize: 18, fontWeight: 700 }}>{error}</div></div>;

  const tabs = ["overview", "payments", "users", "scans", "controls"];

  return (
    <div style={s.page}>
      <div style={s.nav}>
        <div style={s.title}>⚡ TRUTHSCAN <span style={{ color: "#00ffe0" }}>ADMIN</span></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => fetchStats(user.email)} style={s.btn}>🔄 Refresh</button>
          <button onClick={() => window.location.href = "/"} style={{ ...s.btn, color: "#8899aa", borderColor: "rgba(255,255,255,0.1)" }}>← Back</button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ ...s.wrap, display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {tabs.map(t => <button key={t} onClick={() => setActiveTab(t)} style={s.tab(activeTab === t)}>{t.toUpperCase()}</button>)}
      </div>

      <div style={s.wrap}>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <>
            {/* Revenue */}
            <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: "#8899aa", marginBottom: 10 }}>💰 REVENUE</div>
            <div style={s.grid4}>
              {[
                { label: "TOTAL REVENUE", value: "₹" + (stats.revenue.total || 0), sub: "All time" },
                { label: "TODAY", value: "₹" + (stats.revenue.today || 0), sub: "Today" },
                { label: "THIS MONTH", value: "₹" + (stats.revenue.month || 0), sub: "Last 30 days" },
                { label: "ARPPU", value: "₹" + (stats.revenue.arppu || 0), sub: "Avg revenue per paying user" },
              ].map((item, i) => (
                <div key={i} style={s.card}>
                  <div style={s.label}>{item.label}</div>
                  <div style={{ ...s.big, color: "#ffe600" }}>{item.value}</div>
                  <div style={s.sub}>{item.sub}</div>
                </div>
              ))}
            </div>

            {/* Users */}
            <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: "#8899aa", marginBottom: 10, marginTop: 8 }}>👥 USERS</div>
            <div style={s.grid4}>
              {[
                { label: "TOTAL USERS", value: stats.users.total, color: "#00ffe0" },
                { label: "NEW TODAY", value: stats.users.today, color: "#00ffe0" },
                { label: "NEW THIS WEEK", value: stats.users.week, color: "#00ffe0" },
                { label: "PAYING USERS", value: stats.users.paying, color: "#ffe600" },
              ].map((item, i) => (
                <div key={i} style={s.card}>
                  <div style={s.label}>{item.label}</div>
                  <div style={{ ...s.big, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Scans */}
            <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: "#8899aa", marginBottom: 10, marginTop: 8 }}>⚡ SCANS</div>
            <div style={s.grid4}>
              {[
                { label: "TOTAL SCANS", value: stats.scans.total, color: "#c060ff" },
                { label: "TODAY", value: stats.scans.today, color: "#c060ff" },
                { label: "YESTERDAY", value: stats.scans.yesterday, color: "#c060ff" },
                { label: "TOTAL PAYMENTS", value: stats.payments.total, color: "#00e85a" },
              ].map((item, i) => (
                <div key={i} style={s.card}>
                  <div style={s.label}>{item.label}</div>
                  <div style={{ ...s.big, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Pack Stats */}
            <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: "#8899aa", marginBottom: 10, marginTop: 8 }}>🛒 PACK SALES</div>
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

            {/* Credits */}
            <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: "#8899aa", marginBottom: 10, marginTop: 8 }}>💳 CREDIT ECONOMY</div>
            <div style={s.grid3}>
              {[
                { label: "TOTAL PURCHASED", value: stats.credits.purchased, color: "#00ffe0" },
                { label: "TOTAL USED", value: stats.credits.used, color: "#ff3d6e" },
                { label: "REMAINING (SYSTEM)", value: stats.credits.remaining, color: "#ffe600" },
              ].map((item, i) => (
                <div key={i} style={s.card}>
                  <div style={s.label}>{item.label}</div>
                  <div style={{ ...s.big, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Scans Per Day Graph */}
            <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: "#8899aa", marginBottom: 10, marginTop: 8 }}>📊 SCANS LAST 7 DAYS</div>
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

        {/* PAYMENTS TAB */}
        {activeTab === "payments" && (
          <div style={s.card}>
            <div style={s.label}>RECENT PAYMENTS</div>
            <table style={s.table}>
              <thead>
                <tr>
                  {["EMAIL", "PACK", "AMOUNT", "CREDITS", "PAYMENT ID", "TIME"].map(h => <th key={h} style={s.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {stats.payments.recent.map((p, i) => (
                  <tr key={i}>
                    <td style={s.td}>{p.email}</td>
                    <td style={{ ...s.td, color: "#00ffe0", fontFamily: "monospace" }}>{p.pack}</td>
                    <td style={{ ...s.td, color: "#ffe600", fontWeight: 700 }}>₹{p.amount}</td>
                    <td style={{ ...s.td, color: "#c060ff" }}>{p.credits}</td>
                    <td style={{ ...s.td, color: "#8899aa", fontSize: 10 }}>{p.payment_id?.slice(0, 16)}...</td>
                    <td style={{ ...s.td, color: "#8899aa", fontSize: 11 }}>{new Date(p.created_at).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div style={s.card}>
            <div style={s.label}>TOP USERS BY SCANS</div>
            <table style={s.table}>
              <thead>
                <tr>
                  {["EMAIL", "TOTAL SCANS", "CREDITS LEFT", "LAST SCAN"].map(h => <th key={h} style={s.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {stats.topUsers.map((u, i) => (
                  <tr key={i}>
                    <td style={s.td}>{u.email}</td>
                    <td style={{ ...s.td, color: "#c060ff", fontWeight: 700 }}>{u.total_scans}</td>
                    <td style={{ ...s.td, color: "#00ffe0" }}>{u.scan_credits}</td>
                    <td style={{ ...s.td, color: "#8899aa", fontSize: 11 }}>{u.last_scan_date || "Never"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SCANS TAB */}
        {activeTab === "scans" && (
          <>
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
          </>
        )}

        {/* CONTROLS TAB */}
        {activeTab === "controls" && (
          <div style={s.card}>
            <div style={s.label}>⚙️ ADMIN CONTROLS — ADD CREDITS TO USER</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
              <input style={s.input} placeholder="User email" value={creditEmail} onChange={e => setCreditEmail(e.target.value)} />
              <input style={s.input} placeholder="Credits to add" type="number" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} />
              <button onClick={addCredits} style={s.btn}>⚡ ADD CREDITS</button>
              {creditMsg && <div style={{ color: creditMsg.startsWith("✅") ? "#00e85a" : "#ff3d6e", fontFamily: "monospace", fontSize: 13 }}>{creditMsg}</div>}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
