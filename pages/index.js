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
  const [sharing, setSharing] = useState(false);
  const fileRef = useRef();
  const shareCardRef = useRef();

  useEffect(() => {
    // Load html2canvas
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
    setErr(""); setStage("loading"); setStep(0);
    let i = 0;
    const iv = setInterval(() => { i = Math.min(i + 1, 3); setStep(i); }, 900);

    const schema = `{"interestScore":<0-100>,"interestDesc":"<one punchy sentence max 8 words>","lieScore":<0-100>,"lieDesc":"<one punchy sentence max 8 words>","greenFlags":["<3-4 word phrase>","<3-4 word phrase>","<3-4 word phrase>"],"redFlags":["<3-4 word phrase>","<3-4 word phrase>"],"emotionalIntent":"<2-3 sentence psychological insight>","verdict":"<one bold dramatic verdict without asterisks>"}`;

    let messages;
    if (inputMode === "image") {
      messages = [{ role: "user", content: [
        { type: "image", source: { type: "base64", media_type: imageMime, data: imageBase64 } },
        { type: "text", text: `You are TruthScan AI. Extract all chat messages from this screenshot (supports Hindi/Hinglish/Urdu/English), then analyze psychologically. Reply ONLY raw JSON no markdown no asterisks:\n${schema}` }
      ]}];
    } else {
      messages = [{ role: "user", content: `You are TruthScan AI. Analyze this conversation (Hindi/Hinglish/Urdu/English). Reply ONLY raw JSON no markdown no asterisks:\n${schema}\n\nCONVERSATION:\n${chat}` }];
    }

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: inputMode === "image" ? messages[0].content[1].text : messages[0].content })
      });
      clearInterval(iv);
      if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || `Error ${res.status}`); }
      const data = await res.json();
      const raw = data.text || "";
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
      `⚡ TRUTHSCAN AI REPORT\n\n📊 Interest: ${r.interestScore}%\n🔍 Lie Probability: ${r.lieScore}%\n\n✅ Green Flags: ${r.greenFlags?.join(" | ")}\n🚩 Red Flags: ${r.redFlags?.join(" | ")}\n\n🧠 ${r.emotionalIntent}\n\n🎯 VERDICT: ${r.verdict}\n\nAnalyzed at truthscan.in`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function shareAsImage() {
    if (!shareCardRef.current || !window.html2canvas) return;
    setSharing(true);
    try {
      const canvas = await window.html2canvas(shareCardRef.current, {
        backgroundColor: "#080b10",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imageData = canvas.toDataURL("image/png");

      // Try native share (mobile)
      if (navigator.share && navigator.canShare) {
        const blob = await (await fetch(imageData)).blob();
        const file = new File([blob], "truthscan-result.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "TruthScan AI Result",
            text: `🎯 ${result.verdict}\n\nAnalyzed at truthscan.in`,
            files: [file],
          });
          setSharing(false);
          return;
        }
      }

      // Fallback: download image
      const link = document.createElement("a");
      link.download = "truthscan-result.png";
      link.href = imageData;
      link.click();
    } catch (e) {
      console.error(e);
    }
    setSharing(false);
  }

  const card = { background: "#0d1520", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 22px", marginBottom: 12 };

  return (
    <>
      <Head>
        <title>TruthScan AI — Chat Truth Analyzer</title>
        <meta name="description" content="Analyze any chat conversation with AI. Detect interest level, lie probability, red flags and hidden emotional intent." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
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
                  <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: "#445060", marginBottom: 12 }}>PASTE CHAT CONVERSATION</div>
                  <textarea value={chat} onChange={e => setChat(e.target.value)} rows={8}
                    placeholder={"Paste any WhatsApp / Instagram / Telegram / SMS chat here...\n\nExample:\nRiya: hey you free tonight?\nMe: yeah why?\nRiya: no reason just asking"}
                    style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 16px", color: "#dde2ea", fontFamily: "inherit", fontSize: 14, lineHeight: 1.8, resize: "vertical", transition: "border-color 0.2s" }} />
                  <div style={{ fontFamily: "monospace", fontSize: 10, color: "#445060", textAlign: "right", marginTop: 6 }}>{chat.length} chars</div>
                </div>
              )}

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

              {/* SHAREABLE CARD - this gets captured as image */}
              <div ref={shareCardRef} style={{ background: "#080b10", padding: "24px", borderRadius: 16, border: "1px solid rgba(0,255,224,0.15)" }}>

                {/* Card Header */}
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>
                    TRUTH<span style={{ color: "#00ffe0" }}>SCAN</span>
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 9, color: "#445060", letterSpacing: 2, marginTop: 4 }}>AI CHAT ANALYSIS — {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                </div>

                {/* Score Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  {[{ label: "INTEREST LEVEL", score: result.interestScore, desc: result.interestDesc, color: "#00ffe0" }, { label: "LIE PROBABILITY", score: result.lieScore, desc: result.lieDesc, color: "#ff3d6e" }].map((c, i) => (
                    <div key={i} style={{ background: "#0d1520", border: `1px solid ${c.color}20`, borderRadius: 12, padding: "16px" }}>
                      <div style={{ fontFamily: "monospace", fontSize: 8, letterSpacing: 3, color: "#445060", marginBottom: 8 }}>{c.label}</div>
                      <div style={{ fontSize: 44, fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.score}%</div>
                      <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden", marginTop: 8 }}>
                        <div style={{ height: "100%", width: `${c.score}%`, background: c.color, borderRadius: 2 }} />
                      </div>
                      <div style={{ fontSize: 11, color: "#556070", marginTop: 8, lineHeight: 1.5 }}>{c.desc}</div>
                    </div>
                  ))}
                </div>

                {/* Flags */}
                <div style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 8, letterSpacing: 3, color: "#445060", marginBottom: 10 }}>FLAG ANALYSIS</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {result.greenFlags?.map((f, i) => <span key={i} style={{ padding: "5px 10px", borderRadius: 5, fontSize: 12, fontWeight: 600, background: "rgba(0,255,100,0.07)", border: "1px solid rgba(0,255,100,0.18)", color: "#00e85a" }}>✅ {f}</span>)}
                    {result.redFlags?.map((f, i) => <span key={i} style={{ padding: "5px 10px", borderRadius: 5, fontSize: 12, fontWeight: 600, background: "rgba(255,61,110,0.07)", border: "1px solid rgba(255,61,110,0.18)", color: "#ff3d6e" }}>🚩 {f}</span>)}
                  </div>
                </div>

                {/* Verdict */}
                <div style={{ background: "rgba(0,255,224,0.05)", border: "1px solid rgba(0,255,224,0.15)", borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 8, letterSpacing: 3, color: "#445060", marginBottom: 8 }}>VERDICT</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#00ffe0", lineHeight: 1.5 }}>🎯 {result.verdict}</div>
                </div>

                {/* Emotional Intent */}
                <div style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 8, letterSpacing: 3, color: "#445060", marginBottom: 8 }}>EMOTIONAL INTENT</div>
                  <div style={{ fontSize: 12, fontWeight: 300, lineHeight: 1.8, fontStyle: "italic", borderLeft: "2px solid #00ffe0", paddingLeft: 12, color: "#b0bac8" }}>{result.emotionalIntent}</div>
                </div>

                {/* Watermark */}
                <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: 10, color: "#2a3a4a", letterSpacing: 3 }}>
                  truthscan.in ⚡ DECODE THE TRUTH
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
                <button onClick={shareAsImage}
                  style={{ padding: "14px", borderRadius: 10, border: "1px solid rgba(0,255,224,0.35)", background: "linear-gradient(135deg,rgba(0,255,224,0.15),rgba(0,255,224,0.05))", color: "#00ffe0", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                  {sharing ? "⏳ Generating..." : "📤 Share as Image"}
                </button>
                <button onClick={copyReport}
                  style={{ padding: "14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#dde2ea", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  {copied ? "✅ Copied!" : "📋 Copy Text"}
                </button>
              </div>

              {/* SHARE PLATFORMS */}
              <div style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px", marginTop: 10 }}>
                <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#445060", marginBottom: 12 }}>SHARE ON</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { name: "WhatsApp", color: "#25D366", icon: "💬", url: `https://wa.me/?text=${encodeURIComponent(`🔍 My TruthScan AI Result:\n\n🎯 Verdict: ${result.verdict}\n📊 Interest: ${result.interestScore}% | Lie Prob: ${result.lieScore}%\n\nAnalyze your chats at truthscan.in ⚡`)}` },
                    { name: "Twitter/X", color: "#1DA1F2", icon: "𝕏", url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`🔍 TruthScan AI analyzed my chat!\n\n🎯 ${result.verdict}\n📊 Interest: ${result.interestScore}% | Lie Prob: ${result.lieScore}%\n\nAnalyze yours at truthscan.in ⚡`)}` },
                    { name: "Telegram", color: "#0088cc", icon: "✈️", url: `https://t.me/share/url?url=truthscan.in&text=${encodeURIComponent(`🔍 TruthScan AI Result:\n🎯 ${result.verdict}\n📊 Interest: ${result.interestScore}% | Lie Prob: ${result.lieScore}%`)}` },
                    { name: "Facebook", color: "#1877F2", icon: "📘", url: `https://www.facebook.com/sharer/sharer.php?u=truthscan.in` },
                  ].map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                      style={{ flex: 1, minWidth: 120, padding: "10px 8px", borderRadius: 8, background: `${s.color}15`, border: `1px solid ${s.color}30`, color: s.color, fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "none", textAlign: "center", display: "block" }}>
                      {s.icon} {s.name}
                    </a>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "#2a3a4a", marginTop: 10, textAlign: "center", fontFamily: "monospace" }}>
                  💡 Tap "Share as Image" first then share the image on Instagram/Stories
                </div>
              </div>

              <button onClick={reset}
                style={{ width: "100%", padding: "14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#dde2ea", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 10 }}>
                🔄 Analyze Another Chat
              </button>
            </div>
          )}

          <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: 9, color: "#2a3040", letterSpacing: 2, paddingTop: 16 }}>
            TRUTHSCAN AI
          </div>
        </div>
      </div>
    </>
  );
}
