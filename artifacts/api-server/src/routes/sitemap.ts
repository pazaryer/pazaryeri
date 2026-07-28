import { Router, type IRouter } from "express";
import { getSupabaseAdmin } from "../lib/supabase-db";

const router: IRouter = Router();
const SITE_URL = process.env.PUBLIC_SITE_URL ?? "https://pazaryeri0.web.app";

const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/kesfet", priority: "0.9", changefreq: "daily" },
  { path: "/giris", priority: "0.5", changefreq: "monthly" },
  { path: "/kayit", priority: "0.5", changefreq: "monthly" },
  { path: "/terms", priority: "0.3", changefreq: "yearly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
];

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

router.get("/sitemap.xml", async (_req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const { data: listings } = await sb
      .from("listings")
      .select("id, updated_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(5000);

    const now = new Date().toISOString().split("T")[0];
    const urls: string[] = [];

    for (const page of STATIC_PAGES) {
      urls.push(`  <url>
    <loc>${xmlEscape(`${SITE_URL}${page.path}`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
    }

    for (const listing of listings ?? []) {
      const lastmod = (listing.updated_at ?? now).toString().split("T")[0];
      urls.push(`  <url>
    <loc>${xmlEscape(`${SITE_URL}/listing/${listing.id}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (err) {
    next(err);
  }
});

router.get("/robots.txt", (_req, res) => {
  const body = `User-agent: *
Allow: /
Disallow: /hesabim
Disallow: /mesajlar
Disallow: /ilan-ver
Disallow: /chat/

Sitemap: ${SITE_URL}/sitemap.xml
`;
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send(body);
});

export default router;
