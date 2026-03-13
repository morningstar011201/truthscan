import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const PLANS = [
  {
    id: "free",
    name: "FREE",
    price: 0,
    label: "₹0",
    period: "forever",
    analyses: "1 analysis/day",
    color: "#445060",
    features: ["1 free scan daily", "Basic analysis", "Sign in required"],
    cta: "Current Plan",
    popular: false,
  },
  {
    id: "daily",
    name: "DAILY",
    price: 10,
    label: "₹10",
    period: "per day",
    analyses: "10 analyses/day",
    color: "#00ffe0",
    features: ["10 scans per day", "Full AI analysis", "Scan history", "Screenshot upload"],
    cta: "Buy Daily Pass",
    popular: false,
  },
  {
    id: "basic",
    name: "BASIC",
    price: 99,
    label: "₹99",
    period: "per month",
    analyses: "100 analyses/month",
    color: "#00ffe0",
    features: ["100 scans/month", "Full AI analysis", "Scan history", "Screenshot upload"],
    cta: "Get Basic",
    popular: false,
  },
  {
    id: "standard",
    name: "STANDARD",
    price: 199,
    label: "₹199",
    period: "per month",
    analyses: "250 analyses/month",
    color: "#a78bfa",
    features: ["250 scans/month", "Full AI analysis", "Scan history", "Screenshot upload"],
    cta: "Get Standard",
    popular: true,
  },
  {
    id: "pro",
    name: "PRO",
    price: 499,
    label: "₹499",
    period: "per month",
    analyses: "750 analyses/month",
    color: "#fbbf24",
    features: ["750 scans/month", "Full AI analysis", "Scan history", "Screenshot upload"],
    cta: "Go Pro",
    popular: false,
  },
];

export default function PricingPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  async function fetchProfile(uid) {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (data) setProfile(data);
    setLoading(false);
  }

  async function handleBuy(plan) {
    if (!user) { setMsg("❌ Please sign in first!"); setMsgType("error"); return; }
    if (plan.id === "free") return;
    if (profile?.plan === plan.id) { setMsg("✅ You already have this plan!"); setMsgType("success"); return; }

    setPaying(plan.id);
    setMsg("");

    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: plan.price, planId: plan.id }),
      });
      const order = await res.json();
      if (!order.id) throw new Error("Order creation failed");

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "TruthScan AI",
        description: `${plan.name} Plan - ${plan.analyses}`,
        order_id: order.id,
        prefill: { email: user.email },
        theme: { color: "#00ffe0" },
        handler: async function (response) {
          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan.id,
              userId: user.id,
              planType: plan.id === "daily" ? "daily" : "monthly",
            }),
          });
          const result = await verifyRes.json();
          if (result.success) {
            setMsg("🎉 Payment successful! Plan activated!");
            setMsgType("success");
            fetchProfile(user.id);
          } else {
            setMsg("❌ Payment verification failed. Contact support.");
            setMsgType("error");
          }
        },
        modal: { ondismiss: () => setPaying(null) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setMsg("❌ " + err.message);
      setMsgType("error");
    }
    setPaying(null);
  }

  const s = {
    page: { minHeight: "100vh", background: "#060a12", color: "#e0e8f0", fontFamily: "'Courier New', monospace", paddingBottom: 60 },
    header: { background: "rgba(0,255,224,0.03)", borderBottom: "1px solid rgba(0,255,224,0.1)", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" },
    logo: { fontSize: 18, fontWeight: 900, letterSpacing: 3, color: "#fff", cursor: "pointer" },
    logoSpan: { color: "#00ffe0" },
    backBtn: { background: "transparent", border: "1px solid rgba(0,255,224,0.2)", color: "#00ffe0", padding: "7px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, letterSpacing: 1 },
    container: { maxWidth: 960, margin: "0 auto", padding: "40px 20px" },
    title: { textAlign: "center", fontSize: "clamp(22px,4vw,32px)", fontWeight: 900, letterSpacing: 3, color: "#fff", marginBottom: 8 },
    subtitle: { textAlign: "center", fontSize: 12, color: "#8899aa", letterSpacing: 2, marginBottom: 40 },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 },
    popularBadge: { position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "#a78bfa", color: "#fff", fontSize: 9, fontWeight: 900, letterSpacing: 2, padding: "3px 12px", borderRadius: 20, whiteSpace: "nowrap" },
    price: { fontSize: "clamp(24px,4vw,32px)", fontWeight: 900, color: "#fff", lineHeight: 1 },
    featureList: { listStyle: "none", padding: 0, margin: "0 0 20px 0" },
    msg: { textAlign: "center", padding: "12px 20px", borderRadius: 10, fontSize: 13, marginTop: 24 },
    msgSuccess: { background: "rgba(0,255,100,0.08)", border: "1px solid rgba(0,255,100,0.2)", color: "#00ff88" },
    msgError: { background: "rgba(255,61,110,0.08)", border: "1px solid rgba(255,61,110,0.2)", color: "#ff3d6e" },
  };

  if (loading) return (
    <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#00ffe0", letterSpacing: 3, fontSize: 13 }}>LOADING...</div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.logo} onClick={() => window.location.href = "/"}>TRUTH<span style={s.logoSpan}>SCAN</span></div>
        <button style={s.backBtn} onClick={() => window.location.href = "/"}>← BACK</button>
      </div>

      <div style={s.container}>
        <div style={s.title}>CHOOSE YOUR PLAN</div>
        <div style={s.subtitle}>UNLOCK FULL AI ANALYSIS POWER</div>

        <div style={s.grid}>
          {PLANS.map((plan) => {
            const isCurrent = profile?.plan === plan.id;
            const isBuying = paying === plan.id;
            return (
              <div key={plan.id} style={{
                background: isCurrent ? "rgba(0,255,224,0.06)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${isCurrent ? "rgba(0,255,224,0.3)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 16, padding: "24px 18px", position: "relative",
              }}>
                {plan.popular && <div style={s.popularBadge}>POPULAR</div>}
                <div style={{ fontSize: 11, letterSpacing: 3, color: plan.color, fontWeight: 900, marginBottom: 12 }}>{plan.name}</div>
                <div style={s.price}>{plan.label}</div>
                <div style={{ fontSize: 10, color: "#8899aa", letterSpacing: 1, marginBottom: 4 }}>{plan.period}</div>
                <div style={{ fontSize: 11, color: "#00ffe0", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{plan.analyses}</div>
                <ul style={s.featureList}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={{ fontSize: 11, color: "#778090", marginBottom: 6, paddingLeft: 14, position: "relative" }}>
                      <span style={{ position: "absolute", left: 0, color: "#00ffe0" }}>›</span>{f}
                    </li>
                  ))}
                </ul>
                <button
                  style={{
                    width: "100%", padding: "11px 8px", borderRadius: 10, border: "none",
                    background: (isCurrent || plan.id === "free" || isBuying) ? "rgba(255,255,255,0.04)" : `linear-gradient(135deg, ${plan.color}, ${plan.color}aa)`,
                    color: (isCurrent || plan.id === "free" || isBuying) ? "#445060" : "#060a12",
                    fontSize: 11, fontWeight: 900, letterSpacing: 1, cursor: (isCurrent || plan.id === "free") ? "default" : "pointer",
                    fontFamily: "'Courier New', monospace",
                  }}
                  onClick={() => handleBuy(plan)}
                  disabled={isCurrent || plan.id === "free" || isBuying}
                >
                  {isBuying ? "PROCESSING..." : isCurrent ? "✅ CURRENT" : plan.cta.toUpperCase()}
                </button>
              </div>
            );
          })}
        </div>

        {msg && <div style={{ ...s.msg, ...(msgType === "success" ? s.msgSuccess : s.msgError) }}>{msg}</div>}

        {!user && (
          <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#445060" }}>
            👤 <span style={{ color: "#00ffe0", cursor: "pointer" }} onClick={() => window.location.href = "/"}>Sign in</span> to purchase a plan
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 32, fontSize: 10, color: "#667788", letterSpacing: 1 }}>
          🔒 SECURED BY RAZORPAY · UPI · CARDS · NETBANKING
        </div>
      </div>
    </div>
  );
}
