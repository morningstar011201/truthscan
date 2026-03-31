import Head from "next/head";

export default function Privacy() {
  const s = {
    page: { minHeight: "100vh", background: "#080b10", color: "#dde2ea", fontFamily: "'Segoe UI', sans-serif", padding: "0 16px 80px" },
    nav: { maxWidth: 720, margin: "0 auto", padding: "20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)" },
    logo: { fontSize: 16, fontWeight: 900, color: "#fff", textDecoration: "none" },
    back: { fontFamily: "monospace", fontSize: 11, color: "#445060", textDecoration: "none", letterSpacing: 1 },
    wrap: { maxWidth: 720, margin: "0 auto", paddingTop: 40 },
    tag: { display: "inline-block", fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: "#00ffe0", background: "rgba(0,255,224,0.06)", border: "1px solid rgba(0,255,224,0.18)", padding: "4px 12px", borderRadius: 3, marginBottom: 20 },
    h1: { fontSize: "clamp(22px,4vw,30px)", fontWeight: 900, color: "#fff", marginBottom: 8 },
    date: { fontFamily: "monospace", fontSize: 10, color: "#445060", letterSpacing: 2, marginBottom: 36 },
    h2: { fontSize: 16, fontWeight: 800, color: "#fff", marginTop: 32, marginBottom: 10 },
    p: { fontSize: 14, color: "#8899aa", lineHeight: 1.9, marginBottom: 14 },
    divider: { height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)", margin: "28px 0" },
    footer: { textAlign: "center", marginTop: 48, fontFamily: "monospace", fontSize: 10, color: "#2a3040", letterSpacing: 2 },
  };

  return (
    <>
      <Head>
        <title>Privacy Policy — TruthScan AI</title>
        <meta name="description" content="Privacy Policy for TruthScan AI. Learn how we collect, use and protect your data." />
        <link rel="canonical" href="https://truthscan.fun/privacy" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="robots" content="noindex" />
        <meta name="theme-color" content="#00ffe0" />
      </Head>

      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { background: #080b10; }`}</style>

      <div style={s.page}>
        <nav style={s.nav}>
          <a href="/" style={s.logo}>TRUTH<span style={{ color: "#00ffe0" }}>SCAN</span></a>
          <a href="/" style={s.back}>← HOME</a>
        </nav>

        <div style={s.wrap}>
          <div style={s.tag}>📄 LEGAL</div>
          <h1 style={s.h1}>Privacy Policy</h1>
          <div style={s.date}>LAST UPDATED: MARCH 2025 · TRUTHSCAN AI · INDIA</div>

          <p style={s.p}>This Privacy Policy explains how TruthScan AI ("we", "us", or "our") collects, uses, and protects your information when you use our service at truthscan.fun. By using TruthScan, you agree to the practices described here.</p>

          <div style={s.divider} />

          <h2 style={s.h2}>1. Information We Collect</h2>
          <p style={s.p}><strong style={{ color: "#dde2ea" }}>Account Information:</strong> When you sign up, we collect your email address and any profile details you choose to provide (name, username, date of birth).</p>
          <p style={s.p}><strong style={{ color: "#dde2ea" }}>Chat Content:</strong> When you paste a conversation or upload a screenshot for analysis, the content is sent to our AI provider (Groq) for processing. We store a short preview (first 200 characters) of text-based scans in our database linked to your account. We do not store screenshot images.</p>
          <p style={s.p}><strong style={{ color: "#dde2ea" }}>Usage Data:</strong> We collect data about how you use TruthScan — number of scans, scan history, and credit balance — to provide our service.</p>
          <p style={s.p}><strong style={{ color: "#dde2ea" }}>Payment Information:</strong> Payments are processed by Razorpay. We do not store your card details. We only store the pack purchased, amount paid, and payment reference ID.</p>

          <div style={s.divider} />

          <h2 style={s.h2}>2. How We Use Your Information</h2>
          <p style={s.p}>We use the information we collect to provide and improve TruthScan AI, process payments and manage your credit balance, show you your scan history, and send important service-related communications if needed.</p>
          <p style={s.p}>We do not sell your personal data to anyone. We do not use your chat content for advertising or share it with third parties beyond what is necessary to deliver our service.</p>

          <div style={s.divider} />

          <h2 style={s.h2}>3. Data Storage</h2>
          <p style={s.p}>Your data is stored securely using Supabase, hosted in the Mumbai (India) region. We take reasonable precautions to protect your data from unauthorised access, but no system is completely secure.</p>

          <div style={s.divider} />

          <h2 style={s.h2}>4. Your Chat Privacy</h2>
          <p style={s.p}>We understand that the conversations you analyse on TruthScan are personal and sensitive. We treat this data with care. Chat content is processed by Groq's AI API solely for the purpose of generating your analysis result. We strongly recommend not including full names, phone numbers, or other identifying information in chats you submit for analysis.</p>

          <div style={s.divider} />

          <h2 style={s.h2}>5. Third Party Services</h2>
          <p style={s.p}>TruthScan uses the following third-party services to operate: Supabase (database and authentication), Groq API (AI analysis), and Razorpay (payment processing). Each of these services has their own privacy policy which governs their use of data.</p>

          <div style={s.divider} />

          <h2 style={s.h2}>6. Cookies</h2>
          <p style={s.p}>We use minimal cookies required for authentication — specifically to keep you logged in. We do not use advertising cookies or tracking cookies.</p>

          <div style={s.divider} />

          <h2 style={s.h2}>7. Your Rights</h2>
          <p style={s.p}>You can delete your account and all associated data at any time by contacting us. You can also request to see what data we hold about you. To exercise these rights, email us at <span style={{ color: "#00ffe0" }}>truthscan.fun@gmail.com</span>.</p>

          <div style={s.divider} />

          <h2 style={s.h2}>8. Children's Privacy</h2>
          <p style={s.p}>TruthScan is intended for users aged 18 and above. We do not knowingly collect data from anyone under 18.</p>

          <div style={s.divider} />

          <h2 style={s.h2}>9. Changes To This Policy</h2>
          <p style={s.p}>We may update this Privacy Policy from time to time. We will post the updated version on this page with a revised date. Continued use of TruthScan after changes means you accept the updated policy.</p>

          <div style={s.divider} />

          <h2 style={s.h2}>10. Contact</h2>
          <p style={s.p}>For any privacy-related questions, contact us at <span style={{ color: "#00ffe0" }}>truthscan.fun@gmail.com</span>.</p>

          <div style={s.footer}>TRUTHSCAN AI · truthscan.fun · INDIA</div>
        </div>
      </div>
    </>
  );
}
