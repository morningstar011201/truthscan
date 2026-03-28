import { useState, useEffect } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabase";

const PACKS = [
  { id: "free", name: "FREE", price: 0, credits: "1/day", desc: "1 free scan daily, resets midnight", badge: null, color: "#8899aa", btnText: "CURRENT PLAN", disabled: true },
  { id: "starter", name: "STARTER", price: 10, credits: 7, desc: "7 scans, never expire", badge: null, color: "#00ffe0", btnText: "BUY ₹10" },
  { id: "popular", name: "POPULAR", price: 99, credits: 80, desc: "80 scans, never expire", badge: "🔥 MOST POPULAR", color: "#ffe600", btnText: "BUY ₹99" },
  { id: "power", name: "POWER", price: 199, credits: 200, desc: "200 scans, never expire", badge: "⭐ BEST VALUE", color: "#c060ff", btnText: "BUY ₹199" },
];

export default function Pricing() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from("profiles").select("*").eq("id", session.user.id).single().then(({ data }) => setProfile(data));
      }
    });
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    document.body.appendChild(script);
  }, []);

  async function buyPack(pack) {
    if (!user) { alert("Please sign in first!"); return; }
    setLoading(pack.id); setMsg("");
    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack: pack.id })
      });
      const order = await res.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "TruthScan AI",
        description: pack.desc,
        order_id: order.orderId,
        handler: async function(response) {
          const verify = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, pack: pack.id, userId: user.id })
          });
          const result = await verify.json();
          if (result.success) {
            setMsg("✅ " + pack.credits + " scans added! New balance: " + result.credits + " scans");
            const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
            setProfile(data);
          }
        },
        prefill: { email: user.email },
        theme: { color: "#00ffe0" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      setMsg("❌ Error: " + e.message);
    }
    setLoading(false);
  }

  const styles = {
    page: { minHeight: "100vh", background: "#080b10", color: "#dde2ea", fontFamily: "'Segoe UI', sans-serif", padding: "0 16px 60px" },
    nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", maxWidth: 900, margin: "0 auto" },
    logo: { fontSize: 20, fontWeight: 900, color: "#fff" },
    title: { textAlign: "center", padding: "40px 0 10px", fontSize: "clamp(24px,5vw,36px)", fontWeight: 900, color: "#fff", letterSpacing: 2 },
    sub: { textAlign: "center", color: "#8899aa", fontFamily: "monospace", fontSize: 11, letterSpacing: 3, marginBottom: 16 },
    wallet: { textAlign: "center", marginBottom: 36 },
    walletBadge: { display: "inline-block", padding: "12px 28px", background: "rgba(0,255,224,0.08)", border: "1px solid rgba(0,255,224,0.25)", borderRadius: 24, fontFamily: "monospace", fontSize: 16, color: "#00ffe0", fontWeight: 900 },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, maxWidth: 900, margin: "0 auto" },
    card: { background: "#0d1520", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "28px 20px", position: "relative", overflow: "hidden" },
  };

  return (
    <>
    <Head>
      <title>Buy Scan Credits — TruthScan AI</title>
      <meta name="description" content="Buy AI chat analysis credits. Decode hidden intent in any WhatsApp, Instagram or Telegram chat. Starting at just ₹10." />
      <meta property="og:title" content="Buy Scan Credits — TruthScan AI" />
      <meta property="og:url" content="https://truthscan.fun/pricing" />
      <link rel="canonical" href="https://truthscan.fun/pricing" />
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <meta name="theme-color" content="#00ffe0" />
    </Head>
    <div style={styles.page}>
      <div style={styles.nav}>
        <div style={styles.logo}>TRUTH<span style={{ color: "#00ffe0" }}>SCAN</span></div>
        <button onClick={() => window.location.href = "/"} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#8899aa", cursor: "pointer", fontSize: 13 }}>← BACK</button>
      </div>

      <div style={styles.title}>BUY SCAN CREDITS</div>
      <div style={styles.sub}>CREDITS NEVER EXPIRE · STACK UNLIMITED · BUY ANYTIME</div>

      <div style={styles.wallet}>
        <div style={styles.walletBadge}>
          ⚡ {profile?.scan_credits || 0} scans in wallet
        </div>
        <div style={{ marginTop: 8, fontFamily: "monospace", fontSize: 11, color: "#8899aa" }}>+ 1 free scan resets daily at midnight</div>
      </div>

      <div style={styles.grid}>
        {PACKS.map(pack => (
          <div key={pack.id} style={{ ...styles.card, border: pack.badge ? `1px solid ${pack.color}44` : "1px solid rgba(255,255,255,0.07)" }}>
            {pack.badge && (
              <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.4)", border: `1px solid ${pack.color}66`, borderRadius: 20, padding: "3px 10px", fontSize: 10, color: pack.color, fontWeight: 700 }}>
                {pack.badge}
              </div>
            )}
            <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: "#8899aa", marginBottom: 12 }}>{pack.name}</div>
            <div style={{ fontSize: 34, fontWeight: 900, color: pack.color, marginBottom: 4 }}>
              {pack.price === 0 ? "FREE" : "₹" + pack.price}
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 8 }}>
              {typeof pack.credits === "number" ? pack.credits + " scans" : pack.credits}
            </div>
            <div style={{ fontSize: 12, color: "#8899aa", marginBottom: 22, lineHeight: 1.6 }}>{pack.desc}</div>
            <button
              onClick={() => !pack.disabled && buyPack(pack)}
              disabled={pack.disabled || loading === pack.id}
              style={{ width: "100%", padding: "13px", borderRadius: 10, border: `2px solid ${pack.color}66`, background: pack.disabled ? "rgba(255,255,255,0.03)" : `rgba(0,0,0,0.3)`, color: pack.disabled ? "#8899aa" : pack.color, fontSize: 13, fontWeight: 900, cursor: pack.disabled ? "default" : "pointer", letterSpacing: 1, transition: "all 0.2s" }}>
              {loading === pack.id ? "⏳ Processing..." : pack.btnText}
            </button>
          </div>
        ))}
      </div>

      {msg && (
        <div style={{ textAlign: "center", marginTop: 24, padding: "14px 20px", background: "rgba(0,255,100,0.07)", border: "1px solid rgba(0,255,100,0.2)", borderRadius: 10, color: "#00e85a", fontFamily: "monospace", fontSize: 13, maxWidth: 500, margin: "24px auto 0" }}>
          {msg}
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 40, fontFamily: "monospace", fontSize: 10, color: "#2a3a4a", letterSpacing: 2 }}>
        🔒 SECURED BY RAZORPAY · UPI · CARDS · NETBANKING
      </div>
    </div>
  </>
    );
  }
