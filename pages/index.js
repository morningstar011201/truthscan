import { useState, useRef, useEffect } from "react";
import Head from "next/head";

const SCAN_STEPS = [
  { label: "Mapping emotional tone", pct: 34 },
  { label: "Detecting response inconsistency", pct: 62 },
  { label: "Building psychological profile", pct: 88 },
  { label: "Generating truth report", pct: 100 },
];

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
  }, []);

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
    setErr(""); setStage("loading"); setScanStep(0); setScanPct(0);
    let i = 0;
    const iv = setInterval(() => { i = Math.min(i + 1, 3); setScanStep(i); setScanPct(SCAN_STEPS[i].pct); }, 950);

    const schema = `{"cinematicHeadline":"<5-7 word shocking emotional verdict with emoji — e.g. '⚠️ Emotional Trust Breakdown Detected' or '💔 Uneven Investment Slowly Breaking Bond' or '🚩 Avoidance Pattern Actively Present' — dramatic, screenshot-worthy, no asterisks>","confidenceScore":<integer 72-96>,"interestScore":<integer 0-100>,"interestDesc":"<one expressive confident sentence, max 10 words, not clinical>","lieScore":<integer 0-100>,"lieDesc":"<one expressive confident sentence, max 10 words, not clinical>","greenFlags":["<3-5 word phrase>","<3-5 word phrase>","<3-5 word phrase>"],"redFlags":["<3-5 word phrase>","<3-5 word phrase>","<3-5 word phrase>"],"emotionalIntent":"<2-3 sentences of deep psychological insight — expressive, slightly dramatic, human-sounding, never robotic>","emotionalImpact":"<2 sentences explaining how this conversation emotionally affects the user personally — empathetic, direct, makes them feel deeply understood>","futurePrediction":"<2 dramatic but believable sentences predicting what will happen if this pattern continues — psychologically grounded>","behavioralObservations":["<one micro-pattern observation>","<one micro-pattern observation>","<one micro-pattern observation>","<one micro-pattern observation>"],"trajectoryLabel":"<3-5 word outcome label e.g. 'Emotional Drift Likely' or 'Trust Collapse Imminent' or 'Reconnection Still Possible'>","verdict":"<one bold dramatic verdict sentence — emotionally powerful, shareable, no asterisks>"}`;

    const prompt = inputMode === "image"
      ? `You are TruthScan AI — a psychologically intelligent conversation analyzer. Extract all chat messages from this screenshot (supports Hindi/Hinglish/Urdu/English), analyze with deep emotional intelligence. Use confident, expressive, slightly dramatic but human language. Never be clinical or robotic. Reply ONLY raw JSON no markdown no asterisks:\n${schema}`
      : `You are TruthScan AI — a psychologically intelligent conversation analyzer. Analyze this conversation (Hindi/Hinglish/Urdu/English) with deep emotional intelligence. Use confident, expressive, slightly dramatic but human language. Never be clinical or robotic. Reply ONLY raw JSON no markdown no asterisks:\n${schema}\n\nCONVERSATION:\n${chat}`;

    try {
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
      clearInterval(iv);
      if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || `Error ${res.status}`); }
      const data = await res.json();
      const raw = data.text || "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Could not parse response. Please try again.");
      setResult(JSON.parse(match[0]));
      setStage("results");
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

  const card = { background: "#0d1520", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 22px", marginBottom: 12 };
  const mono = { fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#445060", marginBottom: 10 };

  return (
    <>
      <Head>
        <title>TruthScan AI — Chat Truth Analyzer</title>
        <meta name="description" content="AI-powered chat analyzer. Detect emotional intent, lie probability, manipulation patterns in any conversation." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="TruthScan AI — Is Someone Lying to You?" />
        <meta property="og:description" content="Paste any chat and AI reveals the hidden truth. Interest level, lie probability, manipulation patterns and more." />
      </Head>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080b10; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes spinR { to{transform:rotate(-360deg)} }
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:1} }
        @keyframes glow { 0%,100%{text-shadow:0 0 20px #00ffe055} 50%{text-shadow:0 0 40px #00ffe0bb} }
        textarea:focus { outline:none; border-color:rgba(0,255,224,0.45) !important; }
        button { font-family:inherit; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#080b10", color: "#dde2ea", fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 16px 80px" }}>

          {/* HEADER */}
          <div style={{ textAlign: "center", padding: "44px 0 30px", animation: "fadeUp 0.5s ease both" }}>
            <div style={{ display: "inline-block", fontFamily: "monospace", fontSize: 10, letterSpacing: 4, color: "#00ffe0", background: "rgba(0,255,224,0.06)", border: "1px solid rgba(0,255,224,0.18)", padding: "5px 14px", borderRadius: 3, marginBottom: 16 }}>⚡ AI-POWERED ANALYSIS</div>
            <div style={{ fontSize: "clamp(50px,11vw,82px)", fontWeight: 900, lineHeight: 0.9, color: "#fff", letterSpacing: 1, animation: "glow 3s ease infinite" }}>TRUTH<span style={{ color: "#00ffe0" }}>SCAN</span></div>
            <div style={{ fontSize: 11, color: "#445060", marginTop: 10, letterSpacing: 3 }}>DECODE HIDDEN INTENT IN ANY CHAT</div>
            <div style={{ fontSize: 11, color: "#2a3040", marginTop: 5, letterSpacing: 1 }}>AI Pattern Analysis based on emotional response dynamics</div>
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

              {/* 1. CINEMATIC HEADLINE */}
              <div style={{ textAlign: "center", marginBottom: 14, padding: "28px 20px", background: "linear-gradient(135deg,#0a0f1a,#0d1520)", border: "1px solid rgba(255,61,110,0.18)", borderRadius: 16, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#ff3d6e,#00ffe0,#ffe600)" }} />
                <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#445060", marginBottom: 12 }}>ANALYSIS COMPLETE · {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                <div style={{ fontSize: "clamp(17px,4.5vw,24px)", fontWeight: 900, color: "#fff", lineHeight: 1.35, marginBottom: 10 }}>{result.cinematicHeadline}</div>
                <div style={{ fontSize: 11, color: "#2a3040", letterSpacing: 1 }}>AI Pattern Analysis based on emotional response dynamics</div>
              </div>

              {/* 2. CONFIDENCE METER */}
              <div style={{ ...card }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={mono}>PSYCHOLOGICAL CONFIDENCE</div>
                    <div style={{ fontSize: 12, color: "#445060" }}>Based on language patterns, emotional cues and behavioral signals</div>
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 900, color: "#ffe600", flexShrink: 0, marginLeft: 16 }}>{result.confidenceScore}%</div>
                </div>
                <GlowBar pct={result.confidenceScore} />
              </div>

              {/* 3. SCORE CARDS */}
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

              {/* 4. FLAGS */}
              <div style={card}>
                <div style={mono}>FLAG ANALYSIS</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {result.greenFlags?.map((f, i) => <span key={i} style={{ padding: "7px 13px", borderRadius: 6, fontSize: 13, fontWeight: 600, background: "rgba(0,255,100,0.07)", border: "1px solid rgba(0,255,100,0.18)", color: "#00e85a" }}>✅ {f}</span>)}
                  {result.redFlags?.map((f, i) => <span key={i} style={{ padding: "7px 13px", borderRadius: 6, fontSize: 13, fontWeight: 600, background: "rgba(255,61,110,0.07)", border: "1px solid rgba(255,61,110,0.18)", color: "#ff3d6e" }}>🚩 {f}</span>)}
                </div>
              </div>

              {/* 5. EMOTIONAL INTENT */}
              <div style={card}>
                <div style={mono}>EMOTIONAL INTENT</div>
                <div style={{ fontSize: 14, lineHeight: 1.9, fontStyle: "italic", borderLeft: "2px solid #00ffe0", paddingLeft: 16, color: "#b0bac8" }}>{result.emotionalIntent}</div>
              </div>

              {/* 6. EMOTIONAL IMPACT */}
              <div style={{ ...card, background: "linear-gradient(135deg,#0d1a1f,#0d1520)", border: "1px solid rgba(0,255,224,0.09)" }}>
                <div style={mono}>EMOTIONAL IMPACT ON YOU</div>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>🧠</div>
                  <div style={{ fontSize: 14, lineHeight: 1.85, color: "#b0bac8" }}>{result.emotionalImpact}</div>
                </div>
              </div>

              {/* 7. BEHAVIORAL OBSERVATIONS */}
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

              {/* 8. FUTURE PREDICTION */}
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

              {/* 9. VIRAL SHARE CARD — captured as image */}
              <div ref={shareCardRef} style={{ background: "linear-gradient(160deg,#05080f,#080d18,#050a10)", padding: "32px 26px", borderRadius: 22, border: "1px solid rgba(0,255,224,0.08)", marginBottom: 14, position: "relative", overflow: "hidden" }}>

                {/* background glow effects */}
                <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, background: "radial-gradient(circle,rgba(0,255,224,0.06),transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: -60, left: -60, width: 200, height: 200, background: "radial-gradient(circle,rgba(255,61,110,0.05),transparent 70%)", pointerEvents: "none" }} />

                {/* Top bar */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#ff3d6e,#00ffe0,#ffe600)" }} />

                {/* Header */}
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

                {/* Cinematic headline */}
                <div style={{ textAlign: "center", padding: "18px 16px", background: "rgba(255,20,60,0.07)", border: "1px solid rgba(255,61,110,0.15)", borderRadius: 14, marginBottom: 18 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", lineHeight: 1.35 }}>{result.cinematicHeadline}</div>
                </div>

                {/* Big score pills */}
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

                {/* Outcome row */}
                <div style={{ background: "rgba(160,0,255,0.07)", border: "1px solid rgba(160,0,255,0.15)", borderRadius: 12, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 22 }}>🔮</div>
                  <div>
                    <div style={{ fontFamily: "monospace", fontSize: 8, color: "#2a1a3a", letterSpacing: 2, marginBottom: 4 }}>OUTCOME PREDICTION</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#c060ff" }}>{result.trajectoryLabel}</div>
                  </div>
                </div>

                {/* Verdict */}
                <div style={{ background: "rgba(0,255,224,0.04)", border: "1px solid rgba(0,255,224,0.12)", borderLeft: "3px solid #00ffe0", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 8, color: "#1a3a3a", letterSpacing: 2, marginBottom: 6 }}>🎯 VERDICT</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e0f0ef", lineHeight: 1.6 }}>{result.verdict}</div>
                </div>

                {/* Bottom watermark */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 9, color: "#0d1e2e", letterSpacing: 2, fontWeight: 700 }}>truthscan.in</div>
                  <div style={{ fontFamily: "monospace", fontSize: 9, color: "#0d1e2e", letterSpacing: 1 }}>⚡ DECODE THE TRUTH</div>
                </div>
              </div>

              {/* SHARE BUTTON — only 1 */}
              <button onClick={shareAsImage}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(0,255,224,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                style={{ width: "100%", padding: "18px", borderRadius: 12, border: "2px solid rgba(0,255,224,0.4)", background: "linear-gradient(135deg,rgba(0,255,224,0.15),rgba(0,255,224,0.05))", color: "#00ffe0", fontSize: 16, fontWeight: 900, cursor: "pointer", transition: "all 0.25s", letterSpacing: 2, marginBottom: 10 }}>
                {sharing ? "⏳ Generating Image..." : shared ? "✅ Saved! Now Share It Anywhere" : "📤 SAVE & SHARE RESULT IMAGE"}
              </button>

              {shared && (
                <div style={{ textAlign: "center", fontSize: 12, color: "#445060", fontFamily: "monospace", marginBottom: 14, padding: "10px 16px", background: "rgba(0,255,224,0.03)", borderRadius: 8, border: "1px solid rgba(0,255,224,0.07)" }}>
                  💡 Share the saved image on Instagram Stories, WhatsApp, Twitter — anywhere!
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {["🔄 Analyze Another", "🕵️ Test Someone Else", "⚡ New Truth Scan"].map((label, i) => (
                  <button key={i} onClick={reset}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,255,224,0.06)"; e.currentTarget.style.color = "#00ffe0"; e.currentTarget.style.borderColor = "rgba(0,255,224,0.2)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "#445060"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
                    style={{ padding: "13px 8px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", color: "#445060", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", textAlign: "center" }}>
                    {label}
                  </button>
                ))}
              </div>

            </div>
          )}

          <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: 9, color: "#1a2030", letterSpacing: 2, paddingTop: 24 }}>TRUTHSCAN AI · truthscan.in</div>
        </div>
      </div>
    </>
  );
}
