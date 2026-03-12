import { useState, useRef, useEffect } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabase";

const SCAN_STEPS = [
  { label: "Mapping emotional tone", pct: 34 },
  { label: "Detecting response inconsistency", pct: 62 },
  { label: "Building psychological profile", pct: 88 },
  { label: "Generating truth report", pct: 100 },
];

const FREE_LIMIT = 1;

function Bar({ pct, color }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), 400); return () => clearTimeout(t); }, [pct]);
  return (
    <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden", marginTop: 10 }}>
      <div style={{ height: "100%", width: `${w}%`, background: color, borderRadius: 4, transition: "width 1.5s cubic-bezier(.16,1,.3,1)", boxShadow: `0 0 10px ${color}88` }} />
    </div>
  );
}

function GlowBar({ pct }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), 900); return () => clearTimeout(t); }, [pct]);
  return (
    <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden", marginTop: 8 }}>
      <div style={{ height: "100%", width: `${w}%`, background: "linear-gradient(90deg,#00ffe0,#ffe600)", borderRadius: 4, transition: "width 2s cubic-bezier(.16,1,.3,1)", boxShadow: "0 0 14px #00ffe099" }} />
    </div>
  );
}

export default function TruthScan() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authErr, setAuthErr] = useState("");
  const [authMsg, setAuthMsg] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);

  const [chat, setChat] = useState("");
  const [stage, setStage] = useState("input");
  const [scanStep, setScanStep] = useState(0);
  const [scanPct, setScanPct] = useState(0);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [inputMode, setInputMode] = useState("text");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMime, setImageMime] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const fileRef = useRef();
  const shareCardRef = useRef();

  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    document.head.appendChild(s);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) setProfile(data);
  }

  async function fetchHistory() {
    if (!user) return;
    setHistoryLoading(true);
    const { data } = await supabase.from("scan_results").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    setHistory(data || []);
    setHistoryLoading(false);
  }

  async function signInWithGoogle() {
    setAuthBusy(true);
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  }

  async function signInWithEmail() {
    setAuthBusy(true); setAuthErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setAuthErr(error.message); setAuthBusy(false); }
    else { setShowAuth(false); setAuthBusy(false); }
  }

  async function signUpWithEmail() {
    setAuthBusy(true); setAuthErr("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) { setAuthErr(error.message); setAuthBusy(false); }
    else { setAuthMsg("✅ Check your email to confirm your account!"); setAuthBusy(false); }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setShowHistory(false);
  }

  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) { setErr("Please upload a valid image file."); return; }
    setErr(""); setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = (e) => { setImageBase64(e.target.result.split(",")[1]); setImagePreview(e.target.result); };
    reader.readAsDataURL(file);
  }

  function handleDrop(e) { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }

  async function analyze() {
    if (inputMode === "text" && chat.trim().length < 10) { setErr("Please paste a conversation first."); return; }
    if (inputMode === "image" && !imageBase64) { setErr("Please upload a screenshot first."); return; }

    // Force login before use
    if (!user) {
      setErr("❌ Please sign in to use TruthScan!");
      setShowAuth(true);
      return;
    }

    setErr(""); setStage("loading"); setScanStep(0); setScanPct(0);
    let i = 0;
    const iv = setInterval(() => { i = Math.min(i + 1, 3); setScanStep(i); setScanPct(SCAN_STEPS[i].pct); }, 950);

    const schema = `{"cinematicHeadline":"<5-7 word shocking emotional verdict with emoji — e.g. '⚠️ Emotional Trust Breakdown Detected' or '💔 Uneven Investment Slowly Breaking Bond' — dramatic, no asterisks>","confidenceScore":<integer 72-96>,"interestScore":<integer 0-100>,"interestDesc":"<one expressive confident sentence max 10 words>","lieScore":<integer 0-100>,"lieDesc":"<one expressive confident sentence max 10 words>","greenFlags":["<3-5 word phrase>","<3-5 word phrase>","<3-5 word phrase>"],"redFlags":["<3-5 word phrase>","<3-5 word phrase>","<3-5 word phrase>"],"emotionalIntent":"<2-3 sentences deep psychological insight — expressive, slightly dramatic, human>","emotionalImpact":"<2 sentences how this affects user emotionally — personal, empathetic>","futurePrediction":"<2 dramatic but believable sentences predicting what happens if pattern continues>","behavioralObservations":["<micro-pattern observation>","<micro-pattern observation>","<micro-pattern observation>","<micro-pattern observation>"],"trajectoryLabel":"<3-5 word outcome e.g. 'Emotional Drift Likely'>","verdict":"<one bold dramatic verdict — powerful, shareable, no asterisks>"}`;

    const prompt = inputMode === "image"
      ? `You are TruthScan AI. Extract all chat messages from this screenshot (supports Hindi/Hinglish/Urdu/English), analyze with deep emotional intelligence. Confident, expressive, slightly dramatic but human language. Never clinical. Reply ONLY raw JSON no markdown no asterisks:\n${schema}`
      : `You are TruthScan AI. Analyze this conversation (Hindi/Hinglish/Urdu/English) with deep emotional intelligence. Confident, expressive, slightly dramatic but human language. Never clinical. Reply ONLY raw JSON no markdown no asterisks:\n${schema}\n\nCONVERSATION:\n${chat}`;

    try {
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
      clearInterval(iv);
      if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || `Error ${res.status}`); }
      const data = await res.json();
      const raw = data.text || "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Could not parse response. Please try again.");
      const parsed = JSON.parse(match[0]);
      setResult(parsed);
      setStage("results");

      // Check daily limit
    const today = new Date().toISOString().split("T")[0];
    const isNewDay = profile?.last_scan_date !== today;
    const dailyUsed = isNewDay ? 0 : (profile?.daily_scans_used || 0);
    
    if (profile?.plan === "free" && dailyUsed >= FREE_LIMIT) {
      setErr("❌ Daily free analysis used! Come back tomorrow or upgrade.");
      setStage("input");
      return;
    }
      // Update usage count
      if (!user) {
        const localCount = parseInt(localStorage.getItem("ts_free_count") || "0");
        localStorage.setItem("ts_free_count", String(localCount + 1));
      } else {
        // Save to Supabase
        await supabase.from("scan_results").insert({
          user_id: user.id,
          cinematic_headline: parsed.cinematicHeadline,
          interest_score: parsed.interestScore,
          lie_score: parsed.lieScore,
          confidence_score: parsed.confidenceScore,
          interest_desc: parsed.interestDesc,
          lie_desc: parsed.lieDesc,
          green_flags: parsed.greenFlags,
          red_flags: parsed.redFlags,
          emotional_intent: parsed.emotionalIntent,
          emotional_impact: parsed.emotionalImpact,
          future_prediction: parsed.futurePrediction,
          behavioral_observations: parsed.behavioralObservations,
          trajectory_label: parsed.trajectoryLabel,
          verdict: parsed.verdict,
          chat_preview: chat.substring(0, 200)
        });

        // Update profile usage
        const today2 = new Date().toISOString().split("T")[0];
const isNewDay2 = profile?.last_scan_date !== today2;
await supabase.from("profiles").update({
  daily_scans_used: isNewDay2 ? 1 : (profile?.daily_scans_used || 0) + 1,
  last_scan_date: today2,
  total_scans: (profile?.total_scans || 0) + 1,
  updated_at: new Date().toISOString()
}).eq("id", user.id);

        fetchProfile(user.id);
      }
    } catch (e) { clearInterval(iv); setErr("❌ " + e.message); setStage("input"); }
  }

  function reset() { setStage("input"); setResult(null); setErr(""); setImagePreview(null); setImageBase64(null); setChat(""); setShared(false); }

  async function shareAsImage() {
    if (!shareCardRef.current || !window.html2canvas) return;
    setSharing(true);
    try {
      const canvas = await window.html2canvas(shareCardRef.current, { backgroundColor: "#060a12", scale: 2.5, useCORS: true, logging: false });
      const imageData = canvas.toDataURL("image/png");
      if (navigator.share && navigator.canShare) {
        const blob = await (await fetch(imageData)).blob();
        const file = new File([blob], "truthscan-result.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title: "TruthScan AI Result", text: `🎯 ${result.verdict}`, files: [file] });
          setSharing(false); setShared(true); return;
        }
      }
      const link = document.createElement("a");
      link.download = "truthscan-result.png";
      link.href = imageData;
      link.click();
      setShared(true);
    } catch (e) { console.error(e); }
    setSharing(false);
  }

  function viewHistoryResult(item) {
    setSelectedHistory({
      cinematicHeadline: item.cinematic_headline,
      confidenceScore: item.confidence_score,
      interestScore: item.interest_score,
      lieScore: item.lie_score,
      interestDesc: item.interest_desc,
      lieDesc: item.lie_desc,
      greenFlags: item.green_flags,
      redFlags: item.red_flags,
      emotionalIntent: item.emotional_intent,
      emotionalImpact: item.emotional_impact,
      futurePrediction: item.future_prediction,
      behavioralObservations: item.behavioral_observations,
      trajectoryLabel: item.trajectory_label,
      verdict: item.verdict,
      createdAt: item.created_at
    });
    setResult({
      cinematicHeadline: item.cinematic_headline,
      confidenceScore: item.confidence_score,
      interestScore: item.interest_score,
      lieScore: item.lie_score,
      interestDesc: item.interest_desc,
      lieDesc: item.lie_desc,
      greenFlags: item.green_flags,
      redFlags: item.red_flags,
      emotionalIntent: item.emotional_intent,
      emotionalImpact: item.emotional_impact,
      futurePrediction: item.future_prediction,
      behavioralObservations: item.behavioral_observations,
      trajectoryLabel: item.trajectory_label,
      verdict: item.verdict
    });
    setShowHistory(false);
    setStage("results");
  }

  const freeUsed = user ? (profile?.free_scans_used || 0) : parseInt(typeof window !== "undefined" ? localStorage.getItem("ts_free_count") || "0" : "0");
  const card = { background: "#0d1520", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 22px", marginBottom: 12 };
  const mono = { fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#445060", marginBottom: 10 };

  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: "#080b10", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "monospace", color: "#00ffe0", fontSize: 14, letterSpacing: 3 }}>LOADING...</div>
    </div>
  );

  return (
    <>
      <Head>
        <title>TruthScan AI — Chat Truth Analyzer</title>
        <meta name="description" content="AI-powered chat analyzer. Detect emotional intent, lie probability, manipulation patterns." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080b10; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes spinR { to{transform:rotate(-360deg)} }
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:1} }
        @keyframes glow { 0%,100%{text-shadow:0 0 20px #00ffe055} 50%{text-shadow:0 0 40px #00ffe0bb} }
        @keyframes overlayFade { from{opacity:0} to{opacity:1} }
        textarea:focus,input:focus { outline:none; border-color:rgba(0,255,224,0.45) !important; }
        button { font-family:inherit; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #080b10; }
        ::-webkit-scrollbar-thumb { background: #1a2535; border-radius: 2px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#080b10", color: "#dde2ea", fontFamily: "'Segoe UI', sans-serif" }}>

        {/* AUTH MODAL */}
        {showAuth && (
          <div onClick={() => setShowAuth(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", animation: "overlayFade 0.2s ease", padding: 16 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#0d1520", border: "1px solid rgba(0,255,224,0.15)", borderRadius: 20, padding: "32px 28px", width: "100%", maxWidth: 400, position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#ff3d6e,#00ffe0,#ffe600)", borderRadius: "20px 20px 0 0" }} />
              <button onClick={() => setShowAuth(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "#445060", fontSize: 20, cursor: "pointer" }}>✕</button>

              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>TRUTH<span style={{ color: "#00ffe0" }}>SCAN</span></div>
                <div style={{ fontSize: 13, color: "#445060", marginTop: 6 }}>{authMode === "login" ? "Sign in to continue" : "Create your account"}</div>
              </div>

              {authMsg && <div style={{ background: "rgba(0,255,100,0.07)", border: "1px solid rgba(0,255,100,0.2)", borderRadius: 8, padding: "10px 14px", color: "#00e85a", fontSize: 13, marginBottom: 16, textAlign: "center" }}>{authMsg}</div>}
              {authErr && <div style={{ background: "rgba(255,61,110,0.07)", border: "1px solid rgba(255,61,110,0.2)", borderRadius: 8, padding: "10px 14px", color: "#ff3d6e", fontSize: 13, marginBottom: 16 }}>{authErr}</div>}

              {/* Google Login */}
              <button onClick={signInWithGoogle} disabled={authBusy}
                style={{ width: "100%", padding: "13px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>G</span> Continue with Google
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                <div style={{ fontFamily: "monospace", fontSize: 10, color: "#445060" }}>OR</div>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
              </div>

              {/* Email Login */}
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"
                style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.3)", color: "#dde2ea", fontSize: 14, marginBottom: 10, transition: "border-color 0.2s" }} />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
                style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.3)", color: "#dde2ea", fontSize: 14, marginBottom: 16, transition: "border-color 0.2s" }} />

              <button onClick={authMode === "login" ? signInWithEmail : signUpWithEmail} disabled={authBusy}
                style={{ width: "100%", padding: "13px", borderRadius: 10, border: "2px solid rgba(0,255,224,0.4)", background: "linear-gradient(135deg,rgba(0,255,224,0.15),rgba(0,255,224,0.05))", color: "#00ffe0", fontSize: 14, fontWeight: 900, cursor: "pointer", letterSpacing: 2 }}>
                {authBusy ? "⏳ Please wait..." : authMode === "login" ? "⚡ SIGN IN" : "⚡ CREATE ACCOUNT"}
              </button>

              <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#445060" }}>
                {authMode === "login" ? "Don't have an account? " : "Already have an account? "}
                <span onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthErr(""); setAuthMsg(""); }} style={{ color: "#00ffe0", cursor: "pointer", fontWeight: 600 }}>
                  {authMode === "login" ? "Sign up" : "Sign in"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY PANEL */}
        {showHistory && (
          <div onClick={() => setShowHistory(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", animation: "overlayFade 0.2s ease" }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#0a0f1a", border: "1px solid rgba(0,255,224,0.1)", borderLeft: "1px solid rgba(0,255,224,0.15)", width: "100%", maxWidth: 420, height: "100vh", overflowY: "auto", padding: "24px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>📂 Past Results</div>
                  <div style={{ fontSize: 11, color: "#445060", marginTop: 4 }}>Your scan history</div>
                </div>
                <button onClick={() => setShowHistory(false)} style={{ background: "none", border: "none", color: "#445060", fontSize: 20, cursor: "pointer" }}>✕</button>
              </div>

              {historyLoading ? (
                <div style={{ textAlign: "center", color: "#445060", fontFamily: "monospace", fontSize: 12, padding: 40 }}>Loading...</div>
              ) : history.length === 0 ? (
                <div style={{ textAlign: "center", color: "#445060", fontFamily: "monospace", fontSize: 12, padding: 40 }}>No scans yet!</div>
              ) : (
                history.map((item, i) => (
                  <div key={i} onClick={() => viewHistoryResult(item)}
                    style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px", marginBottom: 10, cursor: "pointer", transition: "border-color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(0,255,224,0.2)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 8, lineHeight: 1.4 }}>{item.cinematic_headline}</div>
                    <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#00ffe0" }}>❤️ {item.interest_score}%</span>
                      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#ff3d6e" }}>🚩 {item.lie_score}%</span>
                      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#ffe600" }}>🎯 {item.confidence_score}%</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#2a3a4a", fontFamily: "monospace" }}>
                      {new Date(item.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 16px 80px" }}>

          {/* TOP NAV */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0 0" }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#2a3040", letterSpacing: 2 }}>TRUTHSCAN AI</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {user ? (
                <>
                  <button onClick={() => { setShowHistory(true); fetchHistory(); }}
                    style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(0,255,224,0.2)", background: "rgba(0,255,224,0.06)", color: "#00ffe0", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    📂 History
                  </button>
                      <button onClick={() => window.location.href = "/profile"}
             style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(0,255,224,0.2)", background: "rgba(0,255,224,0.06)", color: "#00ffe0", cursor: "pointer", fontSize: 11 }}>
                     👤 Profile
                  </button>
                  <button onClick={signOut}
                    style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#445060", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Sign Out
                  </button>
                </>
              ) : (
                <button onClick={() => setShowAuth(true)}
                  style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid rgba(0,255,224,0.3)", background: "rgba(0,255,224,0.08)", color: "#00ffe0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* HEADER */}
          <div style={{ textAlign: "center", padding: "32px 0 28px", animation: "fadeUp 0.5s ease both" }}>
            <div style={{ display: "inline-block", fontFamily: "monospace", fontSize: 10, letterSpacing: 4, color: "#00ffe0", background: "rgba(0,255,224,0.06)", border: "1px solid rgba(0,255,224,0.18)", padding: "5px 14px", borderRadius: 3, marginBottom: 16 }}>⚡ AI-POWERED ANALYSIS</div>
            <div style={{ fontSize: "clamp(50px,11vw,82px)", fontWeight: 900, lineHeight: 0.9, color: "#fff", letterSpacing: 1, animation: "glow 3s ease infinite" }}>TRUTH<span style={{ color: "#00ffe0" }}>SCAN</span></div>
            <div style={{ fontSize: 11, color: "#445060", marginTop: 10, letterSpacing: 3 }}>DECODE HIDDEN INTENT IN ANY CHAT</div>
            <div style={{ fontSize: 11, color: "#2a3040", marginTop: 5, letterSpacing: 1 }}>AI Pattern Analysis based on emotional response dynamics</div>

            {/* Usage indicator */}
            {!user && (
              <div style={{ marginTop: 14, display: "inline-block", padding: "6px 16px", background: freeUsed >= FREE_LIMIT ? "rgba(255,61,110,0.08)" : "rgba(0,255,224,0.06)", border: `1px solid ${freeUsed >= FREE_LIMIT ? "rgba(255,61,110,0.2)" : "rgba(0,255,224,0.15)"}`, borderRadius: 20, fontFamily: "monospace", fontSize: 11, color: freeUsed >= FREE_LIMIT ? "#ff3d6e" : "#00ffe0" }}>
                {freeUsed >= FREE_LIMIT ? "❌ Free analyses used up — Sign in to continue" : `⚡ ${FREE_LIMIT - freeUsed} free ${FREE_LIMIT - freeUsed === 1 ? "analysis" : "analyses"} remaining`}
              </div>
            )}
            {user && profile && (
  <div style={{ marginTop: 14, display: "inline-block", padding: "6px 16px", background: "rgba(0,255,224,0.06)", border: "1px solid rgba(0,255,224,0.15)", borderRadius: 20, fontFamily: "monospace", fontSize: 11, color: "#00ffe0" }}>
    {(() => {
      const today = new Date().toISOString().split("T")[0];
      const isNewDay = profile?.last_scan_date !== today;
      const dailyUsed = isNewDay ? 0 : (profile?.daily_scans_used || 0);
      return profile?.plan === "free"
        ? dailyUsed >= FREE_LIMIT
          ? "❌ Daily scan used — Upgrade or come back tomorrow"
          : `⚡ 1 free scan today remaining · ${profile.total_scans || 0} total`
        : `✅ ${profile.plan} plan · ${profile.total_scans || 0} total scans`;
    })()}
  </div>
)}
          </div>

          {/* INPUT */}
          {stage === "input" && (
            <div style={{ animation: "fadeUp 0.4s ease both" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 14, background: "#0d1520", padding: 6, borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)" }}>
                {[{ id: "text", icon: "💬", label: "Paste Text" }, { id: "image", icon: "📸", label: "Upload Screenshot" }].map(tab => (
                  <button key={tab.id} onClick={() => { setInputMode(tab.id); setErr(""); }}
                    style={{ flex: 1, padding: "11px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", background: inputMode === tab.id ? "rgba(0,255,224,0.12)" : "transparent", color: inputMode === tab.id ? "#00ffe0" : "#445060", border: inputMode === tab.id ? "1px solid rgba(0,255,224,0.3)" : "1px solid transparent" }}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {inputMode === "text" && (
                <div style={{ ...card, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#00ffe0,transparent)", opacity: 0.5 }} />
                  <div style={mono}>PASTE CHAT CONVERSATION</div>
                  <textarea value={chat} onChange={e => setChat(e.target.value)} rows={8}
                    placeholder={"Paste any WhatsApp / Instagram / Telegram / SMS chat here...\n\nExample:\nRiya: hey you free tonight?\nMe: yeah why?\nRiya: no reason just asking"}
                    style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 16px", color: "#dde2ea", fontFamily: "inherit", fontSize: 14, lineHeight: 1.8, resize: "vertical", transition: "border-color 0.2s" }} />
                  <div style={{ fontFamily: "monospace", fontSize: 10, color: "#445060", textAlign: "right", marginTop: 6 }}>{chat.length} chars</div>
                </div>
              )}

              {inputMode === "image" && (
                <div style={{ ...card, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#00ffe0,transparent)", opacity: 0.5 }} />
                  <div style={mono}>UPLOAD CHAT SCREENSHOT</div>
                  {!imagePreview ? (
                    <div onClick={() => fileRef.current.click()} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
                      style={{ border: `2px dashed ${dragOver ? "#00ffe0" : "rgba(0,255,224,0.2)"}`, borderRadius: 12, padding: "48px 24px", textAlign: "center", cursor: "pointer", transition: "all 0.25s", background: dragOver ? "rgba(0,255,224,0.04)" : "rgba(0,0,0,0.2)" }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>📸</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#00ffe0", marginBottom: 8 }}>Drop screenshot here</div>
                      <div style={{ fontSize: 12, color: "#445060", marginBottom: 18 }}>or click to browse files</div>
                      <div style={{ display: "inline-block", padding: "9px 22px", background: "rgba(0,255,224,0.08)", border: "1px solid rgba(0,255,224,0.25)", borderRadius: 8, fontSize: 13, color: "#00ffe0", fontWeight: 600 }}>Choose Image</div>
                      <div style={{ fontSize: 11, color: "#2a3a4a", marginTop: 16 }}>Works with WhatsApp, Instagram, Telegram, iMessage, SMS</div>
                    </div>
                  ) : (
                    <div>
                      <img src={imagePreview} alt="Preview" style={{ width: "100%", borderRadius: 10, border: "1px solid rgba(0,255,224,0.2)", maxHeight: 320, objectFit: "cover" }} />
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button onClick={() => fileRef.current.click()} style={{ flex: 1, padding: "10px", background: "rgba(0,255,224,0.08)", border: "1px solid rgba(0,255,224,0.2)", borderRadius: 8, color: "#00ffe0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>🔄 Change Image</button>
                        <button onClick={() => { setImagePreview(null); setImageBase64(null); }} style={{ padding: "10px 18px", background: "rgba(255,61,110,0.08)", border: "1px solid rgba(255,61,110,0.2)", borderRadius: 8, color: "#ff3d6e", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>✕ Remove</button>
                      </div>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
                </div>
              )}

              {err && <div style={{ background: "rgba(255,61,110,0.07)", border: "1px solid rgba(255,61,110,0.22)", borderRadius: 10, padding: "12px 16px", color: "#ff3d6e", fontSize: 13, marginBottom: 12, fontFamily: "monospace" }}>{err}</div>}

              <button onClick={analyze}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 40px rgba(0,255,224,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
                style={{ width: "100%", padding: 20, background: "linear-gradient(135deg,rgba(0,255,224,0.15),rgba(0,255,224,0.05))", border: "2px solid rgba(0,255,224,0.4)", borderRadius: 12, color: "#00ffe0", fontSize: 22, fontWeight: 900, letterSpacing: 4, cursor: "pointer", transition: "all 0.25s", display: "block", marginTop: 4 }}>
                ⚡ ANALYZE CONVERSATION
              </button>

              {!user && (
                <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "#2a3040" }}>
                  <span onClick={() => setShowAuth(true)} style={{ color: "#00ffe0", cursor: "pointer", textDecoration: "underline" }}>Sign in</span> to save results & view history
                </div>
              )}
            </div>
          )}

          {/* LOADING */}
          {stage === "loading" && (
            <div style={{ ...card, textAlign: "center", padding: "52px 24px", animation: "fadeUp 0.3s ease both" }}>
              <div style={{ position: "relative", width: 90, height: 90, margin: "0 auto 28px" }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.05)", borderTopColor: "#00ffe0", animation: "spin 1s linear infinite" }} />
                <div style={{ position: "absolute", inset: 10, borderRadius: "50%", border: "1px solid transparent", borderTopColor: "#ff3d6e", animation: "spinR 0.65s linear infinite" }} />
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontFamily: "monospace", fontSize: 15, fontWeight: 900, color: "#00ffe0" }}>{scanPct}%</div>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#00ffe0", letterSpacing: 3, marginBottom: 28 }}>SCANNING CONVERSATION...</div>
              <div style={{ fontFamily: "monospace", fontSize: 11, textAlign: "left", maxWidth: 300, margin: "0 auto" }}>
                {SCAN_STEPS.map((s, i) => (
                  <div key={i} style={{ marginBottom: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: i === scanStep ? "#00ffe0" : i < scanStep ? "rgba(0,255,224,0.35)" : "#333d4a", animation: i === scanStep ? "pulse 1s ease infinite" : "none", marginBottom: 6 }}>
                      <span>{i < scanStep ? "✓" : i === scanStep ? "▸" : "○"} {s.label}</span>
                      <span style={{ fontWeight: 700 }}>{i <= scanStep ? s.pct + "%" : ""}</span>
                    </div>
                    {i <= scanStep && (
                      <div style={{ height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: i < scanStep ? "100%" : "65%", background: "linear-gradient(90deg,#00ffe0,#00ffe066)", borderRadius: 2, transition: "width 0.9s ease" }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RESULTS */}
          {stage === "results" && result && (
            <div style={{ animation: "fadeUp 0.4s ease both" }}>

              {/* CINEMATIC HEADLINE */}
              <div style={{ textAlign: "center", marginBottom: 14, padding: "28px 20px", background: "linear-gradient(135deg,#0a0f1a,#0d1520)", border: "1px solid rgba(255,61,110,0.18)", borderRadius: 16, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#ff3d6e,#00ffe0,#ffe600)" }} />
                <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#445060", marginBottom: 12 }}>ANALYSIS COMPLETE · {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                <div style={{ fontSize: "clamp(17px,4.5vw,24px)", fontWeight: 900, color: "#fff", lineHeight: 1.35, marginBottom: 10 }}>{result.cinematicHeadline}</div>
                <div style={{ fontSize: 11, color: "#2a3040", letterSpacing: 1 }}>AI Pattern Analysis based on emotional response dynamics</div>
              </div>

              {/* CONFIDENCE */}
              <div style={{ ...card }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={mono}>PSYCHOLOGICAL CONFIDENCE</div>
                    <div style={{ fontSize: 12, color: "#2a3040" }}>Based on language patterns, emotional cues and behavioral signals</div>
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 900, color: "#ffe600", flexShrink: 0, marginLeft: 16 }}>{result.confidenceScore}%</div>
                </div>
                <GlowBar pct={result.confidenceScore} />
              </div>

              {/* SCORE CARDS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                {[{ label: "INTEREST LEVEL", score: result.interestScore, desc: result.interestDesc, color: "#00ffe0" }, { label: "LIE PROBABILITY", score: result.lieScore, desc: result.lieDesc, color: "#ff3d6e" }].map((c, i) => (
                  <div key={i} style={{ background: "#0d1520", border: `1px solid ${c.color}22`, borderRadius: 14, padding: "20px" }}>
                    <div style={{ fontFamily: "monospace", fontSize: 8, letterSpacing: 3, color: "#445060", marginBottom: 10 }}>{c.label}</div>
                    <div style={{ fontSize: 52, fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.score}%</div>
                    <Bar pct={c.score} color={c.color} />
                    <div style={{ fontSize: 12, color: "#556070", marginTop: 10, lineHeight: 1.6 }}>{c.desc}</div>
                  </div>
                ))}
              </div>

              {/* FLAGS */}
              <div style={card}>
                <div style={mono}>FLAG ANALYSIS</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {result.greenFlags?.map((f, i) => <span key={i} style={{ padding: "7px 13px", borderRadius: 6, fontSize: 13, fontWeight: 600, background: "rgba(0,255,100,0.07)", border: "1px solid rgba(0,255,100,0.18)", color: "#00e85a" }}>✅ {f}</span>)}
                  {result.redFlags?.map((f, i) => <span key={i} style={{ padding: "7px 13px", borderRadius: 6, fontSize: 13, fontWeight: 600, background: "rgba(255,61,110,0.07)", border: "1px solid rgba(255,61,110,0.18)", color: "#ff3d6e" }}>🚩 {f}</span>)}
                </div>
              </div>

              {/* EMOTIONAL INTENT */}
              <div style={card}>
                <div style={mono}>EMOTIONAL INTENT</div>
                <div style={{ fontSize: 14, lineHeight: 1.9, fontStyle: "italic", borderLeft: "2px solid #00ffe0", paddingLeft: 16, color: "#b0bac8" }}>{result.emotionalIntent}</div>
              </div>

              {/* EMOTIONAL IMPACT */}
              <div style={{ ...card, background: "linear-gradient(135deg,#0d1a1f,#0d1520)", border: "1px solid rgba(0,255,224,0.09)" }}>
                <div style={mono}>EMOTIONAL IMPACT ON YOU</div>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>🧠</div>
                  <div style={{ fontSize: 14, lineHeight: 1.85, color: "#b0bac8" }}>{result.emotionalImpact}</div>
                </div>
              </div>

              {/* BEHAVIORAL OBSERVATIONS */}
              <div style={card}>
                <div style={mono}>BEHAVIORAL OBSERVATIONS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {result.behavioralObservations?.map((obs, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 14px", background: "rgba(255,230,0,0.03)", border: "1px solid rgba(255,230,0,0.08)", borderRadius: 8 }}>
                      <div style={{ color: "#ffe600", fontSize: 14, marginTop: 2, flexShrink: 0 }}>◈</div>
                      <div style={{ fontSize: 13, color: "#c0cad8", lineHeight: 1.6 }}>{obs}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RELATIONSHIP TRAJECTORY */}
              <div style={{ ...card, background: "linear-gradient(135deg,#130d1c,#0d1520)", border: "1px solid rgba(160,0,255,0.12)" }}>
                <div style={mono}>🔮 RELATIONSHIP TRAJECTORY</div>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>🔮</div>
                  <div style={{ fontSize: 14, lineHeight: 1.85, color: "#b0bac8", fontStyle: "italic" }}>{result.futurePrediction}</div>
                </div>
                <div style={{ display: "inline-block", padding: "7px 16px", background: "rgba(160,0,255,0.08)", border: "1px solid rgba(160,0,255,0.2)", borderRadius: 20, fontSize: 12, fontWeight: 700, color: "#c060ff" }}>
                  📍 Trajectory: {result.trajectoryLabel}
                </div>
              </div>

              {/* SHAREABLE CARD */}
              <div ref={shareCardRef} style={{ background: "linear-gradient(160deg,#05080f,#080d18,#050a10)", padding: "32px 26px", borderRadius: 22, border: "1px solid rgba(0,255,224,0.08)", marginBottom: 14, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, background: "radial-gradient(circle,rgba(0,255,224,0.06),transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: -60, left: -60, width: 200, height: 200, background: "radial-gradient(circle,rgba(255,61,110,0.05),transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#ff3d6e,#00ffe0,#ffe600)" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>TRUTH<span style={{ color: "#00ffe0" }}>SCAN</span></div>
                    <div style={{ fontFamily: "monospace", fontSize: 8, color: "#1a2a3a", letterSpacing: 2, marginTop: 3 }}>AI PSYCHOLOGICAL ANALYSIS</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "monospace", fontSize: 10, color: "#ffe600", fontWeight: 900 }}>AI {result.confidenceScore}% CONFIDENCE</div>
                    <div style={{ fontFamily: "monospace", fontSize: 8, color: "#1a2a3a", marginTop: 3 }}>{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                  </div>
                </div>

                <div style={{ textAlign: "center", padding: "18px 16px", background: "rgba(255,20,60,0.07)", border: "1px solid rgba(255,61,110,0.15)", borderRadius: 14, marginBottom: 18 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", lineHeight: 1.35 }}>{result.cinematicHeadline}</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  <div style={{ background: "rgba(0,255,224,0.06)", border: "1px solid rgba(0,255,224,0.15)", borderRadius: 14, padding: "18px 14px", textAlign: "center" }}>
                    <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 2, color: "#1a3a3a", marginBottom: 6 }}>❤️ INTEREST</div>
                    <div style={{ fontSize: 44, fontWeight: 900, color: "#00ffe0", lineHeight: 1 }}>{result.interestScore}%</div>
                  </div>
                  <div style={{ background: "rgba(255,61,110,0.06)", border: "1px solid rgba(255,61,110,0.15)", borderRadius: 14, padding: "18px 14px", textAlign: "center" }}>
                    <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 2, color: "#3a1a1a", marginBottom: 6 }}>🚩 TRUST RISK</div>
                    <div style={{ fontSize: 44, fontWeight: 900, color: "#ff3d6e", lineHeight: 1 }}>{result.lieScore}%</div>
                  </div>
                </div>

                <div style={{ background: "rgba(160,0,255,0.07)", border: "1px solid rgba(160,0,255,0.15)", borderRadius: 12, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 22 }}>🔮</div>
                  <div>
                    <div style={{ fontFamily: "monospace", fontSize: 8, color: "#2a1a3a", letterSpacing: 2, marginBottom: 4 }}>OUTCOME PREDICTION</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#c060ff" }}>{result.trajectoryLabel}</div>
                  </div>
                </div>

                <div style={{ background: "rgba(0,255,224,0.04)", border: "1px solid rgba(0,255,224,0.12)", borderLeft: "3px solid #00ffe0", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 8, color: "#1a3a3a", letterSpacing: 2, marginBottom: 6 }}>🎯 VERDICT</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e0f0ef", lineHeight: 1.6 }}>{result.verdict}</div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 9, color: "#0d1e2e", letterSpacing: 2, fontWeight: 700 }}>truthscan.in</div>
                  <div style={{ fontFamily: "monospace", fontSize: 9, color: "#0d1e2e", letterSpacing: 1 }}>⚡ DECODE THE TRUTH</div>
                </div>
              </div>

              {/* SHARE BUTTON */}
              <button onClick={shareAsImage}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(0,255,224,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                style={{ width: "100%", padding: "18px", borderRadius: 12, border: "2px solid rgba(0,255,224,0.4)", background: "linear-gradient(135deg,rgba(0,255,224,0.15),rgba(0,255,224,0.05))", color: "#00ffe0", fontSize: 16, fontWeight: 900, cursor: "pointer", transition: "all 0.25s", letterSpacing: 2, marginBottom: 10 }}>
                {sharing ? "⏳ Generating Image..." : shared ? "✅ Saved! Now Share It Anywhere" : "📤 SAVE & SHARE RESULT IMAGE"}
              </button>

              {shared && (
                <div style={{ textAlign: "center", fontSize: 12, color: "#445060", fontFamily: "monospace", marginBottom: 14, padding: "10px 16px", background: "rgba(0,255,224,0.03)", borderRadius: 8, border: "1px solid rgba(0,255,224,0.07)" }}>
                  💡 Share on Instagram Stories, WhatsApp, Twitter — anywhere!
                </div>
              )}

              {/* ACTION BUTTONS */}
             <button onClick={reset}
  onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,255,224,0.06)"; e.currentTarget.style.color = "#00ffe0"; }}
  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "#445060"; }}
  style={{ width: "100%", padding: "13px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", color: "#445060", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", textAlign: "center" }}>
  ⚡ New Truth Scan
</button>

            </div>
          )}

          <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: 9, color: "#1a2030", letterSpacing: 2, paddingTop: 24 }}>TRUTHSCAN AI · truthscan.in</div>
        </div>
      </div>
    </>
  );
}
