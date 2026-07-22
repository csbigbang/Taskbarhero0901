const SITE_URL = "https://www.tbhdatabase.com.br";

const PUBLIC_ROUTES = [
  "",
  "/database",
  "/items",
  "/gear",
  "/drops",
  "/stages",
  "/monsters",
  "/heroes",
  "/grades",
  "/market",
  "/ranking",
  "/radar",
  "/farm",
  "/farm/optimizer",
  "/builds",
  "/doctor",
  "/progress",
  "/compare",
  "/inventory",
  "/cube",
  "/save",
  "/status",
] as const;

export const dynamic = "force-static";
export const revalidate = 3600;

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function GET(): Response {
  const entries = PUBLIC_ROUTES.map((route) => {
    const url = escapeXml(`${SITE_URL}${route}`);

    return [
      "  <url>",
      `    <loc>${url}</loc>`,
      "  </url>",
    ].join("\n");
  }).join("\n");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    "</urlset>",
    "",
  ].join("\n");

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
