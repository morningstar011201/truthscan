import { useState, useRef, useEffect } from "react";
import Head from "next/head";

const SCAN_STEPS = [
  { label: "Mapping emotional tone", pct: 34 },
  { label: "Detecting response inconsistency", pct: 62 },
  { label: "Building psychological profile", pct: 88 },
  { label: "Generating truth report", pct: 100 },
];

function Bar({ pct, color, height = 6 }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), 400);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div style={{ height, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden", marginTop: 10 }}>
      <div style={{ height: "100%", width: `${w}%`, background: color, borderRadius: 4, transition: "width 1.5s cubic-bezier(.16,1,.3,1)", boxShadow: `0 0 10px ${color}88` }} />
    </div>
  );
}

function ConfidenceBar({ pct }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), 800);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", marginTop: 8 }}>
      <div style={{ height: "100%", width: `${w}%`, background: "linear-gradient(90deg,#00ffe0,#ffe600)", borderRadius: 4, transition: "width 2s cubic-bezier(.16,1,.3,1)", boxShadow: "0 0 12px #00ffe088" }} />
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
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    document.head.appendChild(script);
  }, []);

  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) { setErr("Please upload a valid image file."); return; }
    setErr("");
    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageBase64(e.target.result.split(",")[1]);
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  async function analyze() {
    if (inputMode === "text" && chat.trim().length < 10) { setErr("Please paste a conversation first."); return; }
    if (inputMode === "image" && !imageBase64) { setErr("Please upload a screenshot first."); return; }
    setErr(""); setStage("loading"); setScanStep(0); setScanPct(0);

    let i = 0;
    const iv = setInterval(() => {
      i = Math.min(i + 1, 3);
      setScanStep(i);
      setScanPct(SCAN_STEPS[i].pct);
    }, 950);

    const schema = `{
  "cinematicHeadline": "<shocking 4-7 word emotional verdict headline with emoji like '💔 Uneven Emotional Investment Detected' or '⚠️ Emotional Trust Breakdown Identified' or '🚩 Avoidance Pattern Actively Present' — make it dramatic and screenshot-worthy, no asterisks>",
  "confidenceScore": <integer between 70-97>,
  "interestScore": <integer 0-100>,
  "interestDesc": "<one confident expressive sentence about emotional interest — not clinical, human and slightly dramatic, max 12 words>",
  "lieScore": <integer 0-100>,
  "lieDesc": "<one confident expressive sentence about honesty level — expressive and psychologically aware, max 12 words>",
  "greenFlags": ["<3-5 word phrase>","<3-5 word phrase>","<3-5 word phrase>"],
  "redFlags": ["<3-5 word phrase>","<3-5 word phrase>","<3-5 word phrase>"],
  "emotionalIntent": "<2-3 sentences of deep psychological insight — confident, expressive, slightly dramatic, human-sounding, never clinical or robotic>",
  "emotionalImpact": "<2 sentences explaining exactly how this conversation is emotionally affecting the user — personal, empathetic, direct, makes them feel understood>",
  "futurePrediction": "<2 sentences predicting what will likely happen if this pattern continues — slightly dramatic, believable, psychologically grounded>",
  "behavioralObservations": ["<one subtle micro-pattern observation sentence>","<one subtle micro-pattern observation sentence>","<one subtle micro-pattern observation sentence>","<one subtle micro-pattern observation sentence>"],
  "verdict": "<one bold dramatic verdict sentence — emotionally powerful, shareable, no asterisks>"
}`;

    const prompt = inputMode === "image"
      ? `You are TruthScan AI — a psychologically intelligent conversation analyzer. Extract all chat messages from this screenshot (supports Hindi/Hinglish/Urdu/English), then analyze with deep emotional and psychological intelligence. Use confident, expressive, slightly dramatic but human language. Never sound clinical or robotic. Reply ONLY with raw JSON, no markdown, no asterisks:\n${schema}`
      : `You are TruthScan AI — a psychologically intelligent conversation analyzer. Analyze this conversation (Hindi/Hinglish/Urdu/English) with deep emotional and psychological intelligence. Use confident, expressive, slightly dramatic but human language. Never sound clinical or robotic. Reply ONLY with raw JSON, no markdown, no asterisks:\n${schema}\n\nCONVERSATION:\n${chat}`;

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      clearInterval(iv);
      if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || `Error ${res.status}`); }
      const data = await res.json();
      const raw = data.text || "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Could not parse response. Please try again.");
      setResult(JSON.parse(match[0]));
      setStage("results");
    } catch (e) {
      clearInterval(iv);
      setErr("❌ " + e.message);
      setStage("input");
    }
  }

  function reset() {
    setStage("input"); setResult(null); setErr("");
    setImagePreview(null); setImageBase64(null); setChat("");
    setShared(false);
  }

  async function shareAsImage() {
    if (!shareCardRef.current || !window.html2canvas) return;
    setSharing(true);
    try {
      const canvas = await window.html2canvas(shareCardRef.current, {
        backgroundColor: "#060a12",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imageData = canvas.toDataURL("image/png");

      if (navigator.share && navigator.canShare) {
        const blob = await (await fetch(imageData)).blob();
        const file = new File([blob], "truthscan-result.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title: "TruthScan AI Result", text: `🎯 ${result.verdict}`, files: [file] });
          setSharing(false);
          setShared(true);
          return;
        }
      }

      const link = document.createElement("a");
      link.download = "truthscan-result.png";
      link.href = imageData;
      link.click();
      setShared(true);
    } catch (e) {
      console.error(e);
    }
    setSharing(false);
  }

  const card = { background: "#0d1520", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 22px", marginBottom: 12 };
  const mono = { fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#445060", marginBottom: 10 };

  return (
    <>
      <Head>
        <title>TruthScan AI — Chat Truth Analyzer</title>
        <meta name="description" content="AI-powered chat analyzer. Detect emotional intent, lie probability, red flags and hidden psychological patterns in any conversation." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="TruthScan AI — Is Someone Lying to You?" />
        <meta property="og:description" content="Paste any chat and AI reveals the hidden truth. Interest level, lie probability, manipulation patterns and more." />
        <meta property="og:type" content="website" />
      </Head>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080b10; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes spinR { to{transform:rotate(-360deg)} }
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:1} }
        @keyframes glow { 0%,100%{text-shadow:0 0 20px #00ffe055} 50%{text-shadow:0 0 40px #00ffe0bb} }
        textarea:focus { outline: none; border-color: rgba(0,255,224,0.45) !important; }
        button { font-family: inherit; }
        .share-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 0 40px rgba(0,255,224,0.3) !important; }
        .action-btn:hover { background: rgba(0,255,224,0.06) !important; color: #00ffe0 !important; border-color: rgba(0,255,224,0.2) !important; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#080b10", color: "#dde2ea", fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 16px 80px" }}>

          {/* HEADER */}
          <div style={{ textAlign: "center", padding: "44px 0 30px", animation: "fadeUp 0.5s ease both" }}>
            <div style={{ display: "inline-block", fontFamily: "monospace", fontSize: 10, letterSpacing: 4, color: "#00ffe0", background: "rgba(0,255,224,0.06)", border: "1px solid rgba(0,255,224,0.18)", padding: "5px 14px", borderRadius: 3, marginBottom: 16 }}>
              ⚡ AI-POWERED ANALYSIS
            </div>
            <div style={{ fontSize: "clamp(50px,11vw,82px)", fontWeight: 900, lineHeight: 0.9, color: "#fff", letterSpacing: 1, animation: "glow 3s ease infinite" }}>
              TRUTH<span style={{ color: "#00ffe0" }}>SCAN</span>
            </div>
            <div style={{ fontSize: 11, color: "#445060", marginTop: 10, letterSpacing: 3 }}>DECODE HIDDEN INTENT IN ANY CHAT</div>
            <div style={{ fontSize: 11, color: "#2a3040", marginTop: 6, letterSpacing: 1 }}>AI Pattern Analysis based on emotional response dynamics</div>
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
                    <div onClick={() => fileRef.current.click()}
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
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
              <div style={{ position: "relative", width: 88, height: 88, margin: "0 auto 28px" }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.05)", borderTopColor: "#00ffe0", animation: "spin 1s linear infinite" }} />
                <div style={{ position: "absolute", inset: 10, borderRadius: "50%", border: "1px solid transparent", borderTopColor: "#ff3d6e", animation: "spinR 0.65s linear infinite" }} />
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontFamily: "monospace", fontSize: 14, fontWeight: 900, color: "#00ffe0" }}>{scanPct}%</div>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#00ffe0", letterSpacing: 3, marginBottom: 28 }}>SCANNING CONVERSATION...</div>
              <div style={{ fontFamily: "monospace", fontSize: 11, textAlign: "left", maxWidth: 320, margin: "0 auto" }}>
                {SCAN_STEPS.map((s, i) => (
                  <div key={i} style={{ marginBottom: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: i === scanStep ? "#00ffe0" : i < scanStep ? "rgba(0,255,224,0.4)" : "#333d4a", animation: i === scanStep ? "pulse 1s ease infinite" : "none", marginBottom: 7 }}>
                      <span>{i < scanStep ? "✓" : i === scanStep ? "▸" : "○"} {s.label}</span>
                      <span style={{ fontWeight: 700 }}>{i <= scanStep ? s.pct + "%" : ""}</span>
                    </div>
                    {i <= scanStep && (
                      <div style={{ height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: i < scanStep ? "100%" : "65%", background: "linear-gradient(90deg,#00ffe0,#00ffe088)", borderRadius: 2, transition: "width 0.9s ease" }} />
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
              <div style={{ textAlign: "center", marginBottom: 14, padding: "28px 20px", background: "linear-gradient(135deg,#0a0f1a,#0d1520)", border: "1px solid rgba(255,61,110,0.2)", borderRadius: 16, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#ff3d6e,#00ffe0,#ffe600)" }} />
                <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#445060", marginBottom: 12 }}>ANALYSIS COMPLETE · {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                <div style={{ fontSize: "clamp(17px,4.5vw,24px)", fontWeight: 900, color: "#fff", lineHeight: 1.35, marginBottom: 10 }}>
                  {result.cinematicHeadline}
                </div>
                <div style={{ fontSize: 11, color: "#2a3a4a", letterSpacing: 1 }}>AI Pattern Analysis based on emotional response dynamics</div>
              </div>

              {/* CONFIDENCE */}
              <div style={{ ...card }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={mono}>PSYCHOLOGICAL CONFIDENCE</div>
                  <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 900, color: "#ffe600" }}>{result.confidenceScore}%</div>
                </div>
                <ConfidenceBar pct={result.confidenceScore} />
                <div style={{ fontSize: 11, color: "#2a3a4a", marginTop: 8, fontFamily: "monospace" }}>Based on language patterns, emotional cues and behavioral consistency</div>
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
                <div style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.9, fontStyle: "italic", borderLeft: "2px solid #00ffe0", paddingLeft: 16, color: "#b0bac8" }}>{result.emotionalIntent}</div>
              </div>

              {/* EMOTIONAL IMPACT */}
              <div style={{ ...card, background: "linear-gradient(135deg,#0d1a1f,#0d1520)", border: "1px solid rgba(0,255,224,0.1)" }}>
                <div style={mono}>EMOTIONAL IMPACT ON YOU</div>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 30, lineHeight: 1, flexShrink: 0 }}>🧠</div>
                  <div style={{ fontSize: 14, lineHeight: 1.85, color: "#b0bac8" }}>{result.emotionalImpact}</div>
                </div>
              </div>

              {/* BEHAVIORAL OBSERVATIONS */}
              <div style={card}>
                <div style={mono}>BEHAVIORAL OBSERVATIONS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {result.behavioralObservations?.map((obs, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 14px", background: "rgba(255,230,0,0.03)", border: "1px solid rgba(255,230,0,0.09)", borderRadius: 8 }}>
                      <div style={{ color: "#ffe600", fontSize: 14, marginTop: 2, flexShrink: 0 }}>◈</div>
                      <div style={{ fontSize: 13, color: "#c0cad8", lineHeight: 1.6 }}>{obs}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FUTURE PREDICTION */}
              <div style={{ ...card, background: "linear-gradient(135deg,#150d1a,#0d1520)", border: "1px solid rgba(180,0,255,0.12)" }}>
                <div style={mono}>FUTURE RELATIONSHIP PREDICTION</div>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 30, lineHeight: 1, flexShrink: 0 }}>🔮</div>
                  <div style={{ fontSize: 14, lineHeight: 1.85, color: "#b0bac8", fontStyle: "italic" }}>{result.futurePrediction}</div>
                </div>
              </div>

              {/* SHAREABLE CARD */}
              <div ref={shareCardRef} style={{ background: "linear-gradient(160deg,#060a12,#080d16,#060c14)", padding: "28px 24px", borderRadius: 20, border: "1px solid rgba(0,255,224,0.1)", marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>TRUTH<span style={{ color: "#00ffe0" }}>SCAN</span></div>
                    <div style={{ fontFamily: "monospace", fontSize: 8, color: "#1a2a3a", letterSpacing: 2, marginTop: 2 }}>AI PSYCHOLOGICAL ANALYSIS</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "monospace", fontSize: 11, color: "#ffe600", fontWeight: 900 }}>{result.confidenceScore}% CONFIDENCE</div>
                    <div style={{ fontFamily: "monospace", fontSize: 8, color: "#1a2a3a", marginTop: 3 }}>{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                  </div>
                </div>

                <div style={{ textAlign: "center", padding: "16px 14px", background: "rgba(255,61,110,0.07)", border: "1px solid rgba(255,61,110,0.15)", borderRadius: 12, marginBottom: 16, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#ff3d6e,#00ffe0,#ffe600)" }} />
                  <div style={{ fontSize: 17, fontWeight: 900, color: "#fff", lineHeight: 1.35 }}>{result.cinematicHeadline}</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  {[{ l: "INTEREST LEVEL", v: result.interestScore + "%", c: "#00ffe0" }, { l: "LIE PROBABILITY", v: result.lieScore + "%", c: "#ff3d6e" }].map((m, i) => (
                    <div key={i} style={{ background: "rgba(0,0,0,0.35)", borderRadius: 10, padding: "14px", border: `1px solid ${m.c}18`, textAlign: "center" }}>
                      <div style={{ fontFamily: "monospace", fontSize: 8, letterSpacing: 2, color: "#2a3a4a", marginBottom: 6 }}>{m.l}</div>
                      <div style={{ fontSize: 40, fontWeight: 900, color: m.c, lineHeight: 1 }}>{m.v}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                  {result.greenFlags?.slice(0, 2).map((f, i) => <span key={i} style={{ padding: "5px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600, background: "rgba(0,255,100,0.07)", border: "1px solid rgba(0,255,100,0.18)", color: "#00e85a" }}>✅ {f}</span>)}
                  {result.redFlags?.slice(0, 2).map((f, i) => <span key={i} style={{ padding: "5px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600, background: "rgba(255,61,110,0.07)", border: "1px solid rgba(255,61,110,0.18)", color: "#ff3d6e" }}>🚩 {f}</span>)}
                </div>

                <div style={{ background: "rgba(0,255,224,0.05)", border: "1px solid rgba(0,255,224,0.12)", borderLeft: "3px solid #00ffe0", borderRadius: 10, padding: "13px 16px", marginBottom: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#00ffe0", lineHeight: 1.6 }}>🎯 {result.verdict}</div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 9, color: "#1a2535", letterSpacing: 2 }}>truthscan.in</div>
                  <div style={{ fontFamily: "monospace", fontSize: 9, color: "#1a2535", letterSpacing: 1 }}>⚡ DECODE THE TRUTH</div>
                </div>
              </div>

              {/* SHARE BUTTON */}
              <button className="share-btn" onClick={shareAsImage}
                style={{ width: "100%", padding: "18px", borderRadius: 12, border: "2px solid rgba(0,255,224,0.4)", background: "linear-gradient(135deg,rgba(0,255,224,0.15),rgba(0,255,224,0.05))", color: "#00ffe0", fontSize: 16, fontWeight: 900, cursor: "pointer", transition: "all 0.25s", letterSpacing: 2, marginBottom: 10 }}>
                {sharing ? "⏳ Generating Image..." : shared ? "✅ Saved! Share on Instagram, WhatsApp, Stories" : "📤 SAVE & SHARE RESULT IMAGE"}
              </button>

              {shared && (
                <div style={{ textAlign: "center", fontSize: 12, color: "#445060", fontFamily: "monospace", marginBottom: 14, padding: "10px", background: "rgba(0,255,224,0.03)", borderRadius: 8, border: "1px solid rgba(0,255,224,0.08)" }}>
                  💡 Image saved to your device — share it anywhere on Instagram, WhatsApp, Twitter or Stories!
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {["🔄 Analyze Another", "🕵️ Test Someone Else", "⚡ New Truth Scan"].map((label, i) => (
                  <button key={i} className="action-btn" onClick={reset}
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
