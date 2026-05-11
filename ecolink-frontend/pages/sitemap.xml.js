// pages/sitemap.xml.js — Génère le sitemap pour le SEO
export default function Sitemap() {}

export async function getServerSideProps({ res }) {
  const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://ecolink.fr"

  const pages = [
    { url: "",           priority: "1.0",  changefreq: "daily" },
    { url: "/recherche", priority: "0.9",  changefreq: "hourly" },
    { url: "/publier",   priority: "0.8",  changefreq: "monthly" },
    { url: "/impact",    priority: "0.7",  changefreq: "weekly" },
    { url: "/a-propos",  priority: "0.5",  changefreq: "monthly" },
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (p) => `  <url>
    <loc>${BASE}${p.url}</loc>
    <priority>${p.priority}</priority>
    <changefreq>${p.changefreq}</changefreq>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>`

  res.setHeader("Content-Type", "text/xml")
  res.write(sitemap)
  res.end()

  return { props: {} }
}
