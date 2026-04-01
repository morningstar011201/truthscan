import Head from "next/head";

const posts = [
  {
    slug: "why-she-replies-late",
    title: "Why She Replies Late — What It Actually Means",
    desc: "She's online but not replying. Here's the brutal truth about what delayed replies actually mean.",
    tag: "💬 RELATIONSHIPS",
    readTime: "5 min read",
  },
  {
  slug: "mixed-signals-over-text",
  title: "Mixed Signals Over Text — What They Actually Mean",
  desc: "They text all day then go cold. They flirt then act distant. Here's what mixed signals over text actually mean.",
  tag: "💬 RELATIONSHIPS",
  readTime: "6 min read",
  },
];

export default function Blog() {
  return (
    <>
      <Head>
        <title>Blog — TruthScan AI</title>
        <meta name="description" content="Real talk about texting, mixed signals, late replies and relationship patterns. No fluff." />
        <link rel="canonical" href="https://truthscan.fun/blog" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="theme-color" content="#00ffe0" />
      </Head>

      <style>{`* { box-sizing:border-box; margin:0; padding:0; } body { background:#080b10; }`}</style>

      <div style={{ minHeight: "100vh", background: "#080b10", color: "#dde2ea", fontFamily: "'Segoe UI', sans-serif", padding: "0 16px 80px" }}>

        <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <a href="/" style={{ fontSize: 16, fontWeight: 900, color: "#fff", textDecoration: "none" }}>TRUTH<span style={{ color: "#00ffe0" }}>SCAN</span></a>
          <a href="/" style={{ fontFamily: "monospace", fontSize: 11, color: "#445060", textDecoration: "none", letterSpacing: 1 }}>← HOME</a>
        </div>

        <div style={{ maxWidth: 680, margin: "0 auto", paddingTop: 40 }}>
          <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 4, color: "#00ffe0", marginBottom: 12 }}>⚡ TRUTHSCAN BLOG</div>
          <div style={{ fontSize: "clamp(24px,5vw,32px)", fontWeight: 900, color: "#fff", marginBottom: 8 }}>Real Talk.</div>
          <div style={{ fontSize: 14, color: "#8899aa", marginBottom: 40 }}>No fluff. No perfect AI articles. Just honest breakdowns of texting, mixed signals and relationship patterns.</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {posts.map((post, i) => (
              <a key={i} href={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
                <div style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px", transition: "border-color 0.2s", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(0,255,224,0.25)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}>
                  <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#00ffe0", marginBottom: 10 }}>{post.tag} · {post.readTime}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 8, lineHeight: 1.4 }}>{post.title}</div>
                  <div style={{ fontSize: 13, color: "#8899aa", lineHeight: 1.7 }}>{post.desc}</div>
                  <div style={{ marginTop: 14, fontSize: 12, color: "#00ffe0", fontWeight: 700 }}>Read →</div>
                </div>
              </a>
            ))}
          </div>

          <div style={{ marginTop: 48, background: "linear-gradient(135deg,rgba(0,255,224,0.08),rgba(0,255,224,0.03))", border: "1px solid rgba(0,255,224,0.2)", borderRadius: 14, padding: "24px", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Stop Guessing. Scan Your Chat.</div>
            <div style={{ fontSize: 13, color: "#8899aa", marginBottom: 16 }}>Paste any conversation and get a brutal honest AI breakdown in seconds.</div>
            <a href="/" style={{ display: "inline-block", padding: "12px 28px", background: "rgba(0,255,224,0.12)", border: "2px solid rgba(0,255,224,0.4)", borderRadius: 10, color: "#00ffe0", fontSize: 13, fontWeight: 900, letterSpacing: 2, textDecoration: "none" }}>⚡ TRY FREE</a>
          </div>

        </div>
      </div>
    </>
  );
}
