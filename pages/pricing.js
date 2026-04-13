import { useState, useEffect } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabase";

const PACKS = [
  { id: "free", name: "FREE", price: 0, credits: "1/day", desc: "1 free scan daily, resets midnight", badge: null, color: "#8899aa", btnText: "CURRENT PLAN", disabled: true },
  { id: "starter", name: "STARTER", price: 19, credits: 10, desc: "10 scans, never expire", badge: null, color: "#00ffe0", btnText: "BUY ₹19" },
  { id: "popular", name: "POPULAR", price: 129, credits: 100, desc: "100 scans, never expire", badge: "🔥 MOST POPULAR", color: "#ffe600", btnText: "BUY ₹129" },
  { id: "power", name: "POWER", price: 299, credits: 300, desc: "300 scans, never expire", badge: "⭐ BEST VALUE", color: "#c060ff", btnText: "BUY ₹299" },
];

export default function Pricing() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState(null);
  const [promoBonus, setPromoBonus] = useState(0);
  const [promoLoading, setPromoLoading] = useState(false);

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

  async function validatePromo() {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const res = await fetch("/api/validate-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim() })
      });
      const data = await res.json();
      if (data.valid) {
        setPromoStatus("valid");
        setPromoBonus(data.bonus_percent);
      } else {
        setPromoStatus("invalid");
        setPromoBonus(0);
      }
    } catch (e) {
      setPromoStatus("invalid");
      setPromoBonus(0);
    }
    setPromoLoading(false);
  }

  async function buyPack(pack) {
    if (!user) { alert("Please sign in first!"); return; }
    setLoading(pack.id); setMsg("");
    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack: pack.id, promoCode: promoStatus === "valid" ? promoCode.trim() : null })
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
            body: JSON.stringify({ ...response, pack: pack.id, userId: user.id, promoCode: promoStatus === "valid" ? promoCode.trim() : null })
          });
          const result = await verify.json();
          if (result.success) {
            setMsg("✅ " + result.credits_added + " scans added! New balance: " + result.credits + " scans" + (promoStatus === "valid" ? ` (includes ${promoBonus}% promo bonus! 🎉)` : ""));
            const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
            setProfile(data);
            setPromoCode("");
            setPromoStatus(null);
            setPromoBonus(0);
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
    wallet: { textAlign: "center", marginBottom: 24 },
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

          {/* PROMO CODE */}
          <div style={{ maxWidth: 400, margin: "20px auto 0" }}>
            <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: "#8899aa", marginBottom: 8 }}>🎟️ HAVE A PROMO CODE?</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={promoCode}
                onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoStatus(null); setPromoBonus(0); }}
                onKeyDown={e => e.key === "Enter" && validatePromo()}
                placeholder="Enter promo code"
                style={{
                  flex: 1,
                  background: "rgba(0,0,0,0.3)",
                  border: `1px solid ${promoStatus === "valid" ? "rgba(0,232,90,0.4)" : promoStatus === "invalid" ? "rgba(255,61,110,0.4)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 8, padding: "10px 14px", color: "#dde2ea", fontSize: 13,
                  fontFamily: "monospace", outline: "none", letterSpacing: 2
                }}
              />
              <button
                onClick={validatePromo}
                disabled={promoLoading || !promoCode.trim()}
                style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid rgba(0,255,224,0.3)", background: "rgba(0,255,224,0.08)", color: "#00ffe0", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                {promoLoading ? "..." : "APPLY"}
              </button>
            </div>
            {promoStatus === "valid" && (
              <div style={{ color: "#00e85a", fontFamily: "monospace", fontSize: 11, marginTop: 8, padding: "8px 12px", background: "rgba(0,232,90,0.07)", border: "1px solid rgba(0,232,90,0.2)", borderRadius: 8 }}>
                🎉 Code applied! You get +{promoBonus}% bonus credits on your purchase!
              </div>
            )}
            {promoStatus === "invalid" && (
              <div style={{ color: "#ff3d6e", fontFamily: "monospace", fontSize: 11, marginTop: 8 }}>
                ❌ Invalid or expired promo code
              </div>
            )}
          </div>
        </div>

        <div style={styles.grid}>
          {PACKS.map(pack => {
            const bonusCredits = promoStatus === "valid" && typeof pack.credits === "number"
              ? Math.floor(pack.credits * (1 + promoBonus / 100))
              : null;
            return (
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
                <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
                  {bonusCredits ? (
                    <span>
                      <span style={{ textDecoration: "line-through", color: "#445060", fontSize: 14 }}>{pack.credits} scans</span>
                      {" "}
                      <span style={{ color: "#00e85a" }}>{bonusCredits} scans</span>
                    </span>
                  ) : (
                    typeof pack.credits === "number" ? pack.credits + " scans" : pack.credits
                  )}
                </div>
                {bonusCredits && (
                  <div style={{ fontFamily: "monospace", fontSize: 10, color: "#00e85a", marginBottom: 6 }}>+{promoBonus}% promo bonus! 🎉</div>
                )}
                <div style={{ fontSize: 12, color: "#8899aa", marginBottom: 22, lineHeight: 1.6 }}>{pack.desc}</div>
                <button
                  onClick={() => !pack.disabled && buyPack(pack)}
                  disabled={pack.disabled || loading === pack.id}
                  style={{ width: "100%", padding: "13px", borderRadius: 10, border: `2px solid ${pack.color}66`, background: pack.disabled ? "rgba(255,255,255,0.03)" : `rgba(0,0,0,0.3)`, color: pack.disabled ? "#8899aa" : pack.color, fontSize: 13, fontWeight: 900, cursor: pack.disabled ? "default" : "pointer", letterSpacing: 1, transition: "all 0.2s" }}>
                  {loading === pack.id ? "⏳ Processing..." : pack.btnText}
                </button>
              </div>
            );
          })}
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
