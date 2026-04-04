export default function Sitemap() { return null; }

export async function getServerSideProps({ res }) {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.truthscan.fun</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.truthscan.fun/pricing</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url> 
  <url>
    <loc>https://www.truthscan.fun/privacy</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url> 
  <url>
    <loc>https://www.truthscan.fun/terms</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url> 
  <url>
    <loc>https://www.truthscan.fun/blog</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.truthscan.fun/blog/why-she-replies-late</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.truthscan.fun/blog/mixed-signals-over-text</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;
  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap);
  res.end();
  return { props: {} };
}
