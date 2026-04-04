export default function Robots() {}

export async function getServerSideProps({ res }) {
  res.setHeader("Content-Type", "text/plain");
  res.write(`User-agent: *
Allow: /

Disallow: /admin
Disallow: /profile
Disallow: /api/

Sitemap: https://www.truthscan.fun/sitemap.xml`);
  res.end();
  return { props: {} };
}
