import { useState, useRef, useEffect } from "react";
import Head from "next/head";

const STEPS = [
  "Parsing message patterns...",
  "Reading emotional signals...",
  "Running deception model...",
  "Generating truth report...",
];

function Bar({ pct, color }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), 400);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden", marginTop: 10 }}>
      <div style={{ height: "100%", width: `${w}%`, background: color, borderRadius: 4, transition: "width 1.5s cubic-bezier(.16,1,.3,1)", boxShadow: `0 0 10px ${color}88` }} />
    </div>
  );
}

export default function TruthScan() {
  const [chat, setChat] = useState("");
  const [stage, setStage] = useState("input");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [inputMode, setInputMode] = useState("text");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMime, setImageMime] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

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
    setErr(""); setStage("loading"); setStep(0);
    let i = 0;
    const iv = setInterval(() => { i = Math.min(i + 1, 3); setStep(i); }, 900);

    const schema = `{"interestScore":<0-100>,"interestDesc":"<one punchy sentence>","lieScore":<0-100>,"lieDesc":"<one punchy sentence>","greenFlags":["<phrase>","<phrase>","<phrase>"],"redFlags":["<phrase>","<phrase>"],"emotionalIntent":"<2-3 sentence psychological insight>","verdict":"<one bold dramatic verdict>"}`;

    let messages;
    if (inputMode === "image") {
      messages = [{ role: "user", content: [
        { type: "image", source: { type: "base64", media_type: imageMime, data: imageBase64 } },
        { type: "text", text: `You are TruthScan AI. Extract all chat messages from this screenshot (supports Hindi/Hinglish/Urdu/English), then analyze psychologically. Reply ONLY raw JSON no markdown:\n${schema}` }
      ]}];
    } else {
      messages = [{ role: "user", content: `You are TruthScan AI. Analyze this conversation (Hindi/Hinglish/Urdu/English). Reply ONLY raw JSON no markdown:\n${schema}\n\nCONVERSATION:\n${chat}` }];
    }

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages })
      });
      clearInterval(iv);
      if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || `Error ${res.status}`); }
      const data = await res.json();
      const raw = data.content?.[0]?.text || "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Could not parse. Try again.");
      setResult(JSON.parse(match[0]));
      setStage("results");
    } catch (e) {
      clearInterval(iv);
      setErr("❌ " + e.message);
      setStage("input");
    }
  }

  function reset() { setStage("input"); setResult(null); setErr(""); setImagePreview(null); setImageBase64(null); setChat(""); }

  function copyReport() {
    const r = result;
    navigator.clipboard.writeText(
      `⚡ TRUTHSCAN AI REPORT\n\n📊 Interest: ${r.interestScore}%\n🔍 Lie Probability: ${r.lieScore}%\n\n✅ Green Flags: ${r.greenFlags?.join(" | ")}\n🚩 Red Flags: ${r.redFlags?.join(" | ")}\n\n🧠 ${r.emotionalIntent}\n\n🎯 VERDICT: ${r.verdict}\n\n— TruthScan AI`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const card = { background: "#0d1520", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 22px", marginBottom: 12 };

  return (
    <>
      <Head>
        <title>TruthScan AI — Chat Truth Analyzer</title>
        <meta name="description" content="Analyze any chat conversation with AI. Detect interest level, lie probability, red flags and hidden emotional intent." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph for WhatsApp/Instagram sharing */}
        <meta property="og:title" content="TruthScan AI — Is Someone Lying to You?" />
        <meta property="og:description" content="Paste any chat and AI will reveal the hidden truth. Interest level, lie probability, red flags and more!" />
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
        @keyframes borderPulse { 0%,100%{border-color:rgba(0,255,224,0.3)} 50%{border-color:rgba(0,255,224,0.8)} }
        textarea:focus { outline: none; border-color: rgba(0,255,224,0.45) !important; }
        button { font-family: inherit; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#080b10", color: "#dde2ea", fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 16px 60px" }}>

          {/* HEADER */}
          <div style={{ textAlign: "center", padding: "44px 0 30px", animation: "fadeUp 0.5s ease both" }}>
            <div style={{ display: "inline-block", fontFamily: "monospace", fontSize: 10, letterSpacing: 4, color: "#00ffe0", background: "rgba(0,255,224,0.06)", border: "1px solid rgba(0,255,224,0.18)", padding: "5px 14px", borderRadius: 3, marginBottom: 16 }}>
              ⚡ AI-POWERED ANALYSIS
            </div>
            <div style={{ fontSize: "clamp(50px,11vw,82px)", fontWeight: 900, lineHeight: 0.9, color: "#fff", letterSpacing: 1, animation: "glow 3s ease infinite" }}>
              TRUTH<span style={{ color: "#00ffe0" }}>SCAN</span>
            </div>
            <div style={{ fontSize: 11, color: "#445060", marginTop: 14, letterSpacing: 3 }}>DECODE HIDDEN INTENT IN ANY CHAT</div>
          </div>

          {/* INPUT STAGE */}
          {stage === "input" && (
            <div style={{ animation: "fadeUp 0.4s ease both" }}>

              {/* TABS */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14, background: "#0d1520", padding: 6, borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)" }}>
                {[{ id: "text", icon: "💬", label: "Paste Text" }, { id: "image", icon: "📸", label: "Upload Screenshot" }].map(tab => (
                  <button key={tab.id} onClick={() => { setInputMode(tab.id); setErr(""); }}
                    style={{ flex: 1, padding: "11px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", background: inputMode === tab.id ? "rgba(0,255,224,0.12)" : "transparent", color: inputMode === tab.id ? "#00ffe0" : "#445060", border: inputMode === tab.id ? "1px solid rgba(0,255,224,0.3)" : "1px solid transparent" }}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* TEXT INPUT */}
              {inputMode === "text" && (
                <div style={{ ...card, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#00ffe0,transparent)", opacity: 0.5 }} />
                  <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: "#445060", marginBottom: 12 }}>PASTE CHAT CONVERSATION</div>
                  <textarea value={chat} onChange={e => setChat(e.target.value)} rows={8}
                    placeholder={"Paste any WhatsApp / Instagram / Telegram / SMS chat here...\n\nExample:\nRiya: hey you free tonight?\nMe: yeah why?\nRiya: no reason just asking"}
                    style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 16px", color: "#dde2ea", fontFamily: "inherit", fontSize: 14, lineHeight: 1.8, resize: "vertical", transition: "border-color 0.2s" }} />
                  <div style={{ fontFamily: "monospace", fontSize: 10, color: "#445060", textAlign: "right", marginTop: 6 }}>{chat.length} chars</div>
                </div>
              )}

              {/* IMAGE INPUT */}
              {inputMode === "image" && (
                <div style={{ ...card, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#00ffe0,transparent)", opacity: 0.5 }} />
                  <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: "#445060", marginBottom: 12 }}>UPLOAD CHAT SCREENSHOT</div>
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
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 30px rgba(0,255,224,0.25)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
                style={{ width: "100%", padding: 20, background: "linear-gradient(135deg,rgba(0,255,224,0.15),rgba(0,255,224,0.05))", border: "2px solid rgba(0,255,224,0.4)", borderRadius: 12, color: "#00ffe0", fontSize: 22, fontWeight: 900, letterSpacing: 4, cursor: "pointer", transition: "all 0.25s", display: "block", marginTop: 4 }}>
                ⚡ ANALYZE CONVERSATION
              </button>
            </div>
          )}

          {/* LOADING */}
          {stage === "loading" && (
            <div style={{ ...card, textAlign: "center", padding: "52px 24px", animation: "fadeUp 0.3s ease both" }}>
              <div style={{ position: "relative", width: 78, height: 78, margin: "0 auto 28px" }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.05)", borderTopColor: "#00ffe0", animation: "spin 1s linear infinite" }} />
                <div style={{ position: "absolute", inset: 10, borderRadius: "50%", border: "1px solid transparent", borderTopColor: "#ff3d6e", animation: "spinR 0.65s linear infinite" }} />
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#00ffe0", letterSpacing: 3, marginBottom: 26 }}>SCANNING CONVERSATION...</div>
              <div style={{ fontFamily: "monospace", fontSize: 11, lineHeight: 2.6 }}>
                {STEPS.map((s, i) => (
                  <div key={i} style={{ color: i === step ? "#00ffe0" : i < step ? "rgba(0,255,224,0.3)" : "#445060", animation: i === step ? "pulse 1s ease infinite" : "none" }}>
                    {i < step ? "✓" : i === step ? "▸" : "○"} {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RESULTS */}
          {stage === "results" && result && (
            <div style={{ animation: "fadeUp 0.4s ease both" }}>
              <div style={{ ...card, textAlign: "center", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#ff3d6e,#00ffe0,#ffe600)" }} />
                <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 3 }}>✅ ANALYSIS COMPLETE</div>
                <div style={{ fontFamily: "monospace", fontSize: 10, color: "#445060", letterSpacing: 2, marginTop: 6 }}>{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                {[{ label: "INTEREST LEVEL", score: result.interestScore, desc: result.interestDesc, color: "#00ffe0" }, { label: "LIE PROBABILITY", score: result.lieScore, desc: result.lieDesc, color: "#ff3d6e" }].map((c, i) => (
                  <div key={i} style={{ background: "#0d1520", border: `1px solid ${c.color}20`, borderRadius: 14, padding: "20px" }}>
                    <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#445060", marginBottom: 10 }}>{c.label}</div>
                    <div style={{ fontSize: 54, fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.score}%</div>
                    <Bar pct={c.score} color={c.color} />
                    <div style={{ fontSize: 12, color: "#556070", marginTop: 10, lineHeight: 1.6 }}>{c.desc}</div>
                  </div>
                ))}
              </div>

              <div style={card}>
                <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#445060", marginBottom: 14 }}>FLAG ANALYSIS</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {result.greenFlags?.map((f, i) => <span key={i} style={{ padding: "7px 13px", borderRadius: 6, fontSize: 13, fontWeight: 600, background: "rgba(0,255,100,0.07)", border: "1px solid rgba(0,255,100,0.18)", color: "#00e85a" }}>✅ {f}</span>)}
                  {result.redFlags?.map((f, i) => <span key={i} style={{ padding: "7px 13px", borderRadius: 6, fontSize: 13, fontWeight: 600, background: "rgba(255,61,110,0.07)", border: "1px solid rgba(255,61,110,0.18)", color: "#ff3d6e" }}>🚩 {f}</span>)}
                </div>
              </div>

              <div style={card}>
                <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#445060", marginBottom: 14 }}>EMOTIONAL INTENT</div>
                <div style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.9, fontStyle: "italic", borderLeft: "2px solid #00ffe0", paddingLeft: 16, color: "#b0bac8" }}>{result.emotionalIntent}</div>
              </div>

              <div style={{ background: "linear-gradient(135deg,#0b1e1a,#0d1820)", border: "1px solid rgba(0,255,224,0.12)", borderRadius: 14, padding: "22px", marginBottom: 12 }}>
                <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: 2, marginBottom: 18 }}>📊 SHAREABLE REPORT</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  {[{ l: "INTEREST", v: result.interestScore + "%", c: "#00ffe0" }, { l: "LIE PROB.", v: result.lieScore + "%", c: "#ff3d6e" }, { l: "GREEN FLAGS", v: result.greenFlags?.length, c: "#00e85a" }, { l: "RED FLAGS", v: result.redFlags?.length, c: "#ffe600" }].map((m, i) => (
                    <div key={i} style={{ background: "rgba(0,0,0,0.25)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 2, color: "#445060", marginBottom: 6 }}>{m.l}</div>
                      <div style={{ fontSize: 32, fontWeight: 900, color: m.c, lineHeight: 1 }}>{m.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 10, padding: "14px 16px", borderLeft: "3px solid #00ffe0", fontSize: 14, fontWeight: 600, lineHeight: 1.6, marginBottom: 18 }}>🎯 {result.verdict}</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button onClick={copyReport} style={{ padding: "12px 20px", borderRadius: 10, border: "1px solid rgba(0,255,224,0.28)", background: "rgba(0,255,224,0.08)", color: "#00ffe0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{copied ? "✅ Copied!" : "📋 Copy Report"}</button>
                  <button onClick={reset} style={{ padding: "12px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#dde2ea", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>🔄 Analyze Another</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: 9, color: "#2a3040", letterSpacing: 2, paddingTop: 16 }}>
            TRUTHSCAN AI — FOR ENTERTAINMENT PURPOSES ONLY
          </div>
        </div>
      </div>
    </>
  );
}
