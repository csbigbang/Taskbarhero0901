const SITE_URL = "https://www.tbhdatabase.com.br";

export const dynamic = "force-static";
export const revalidate = 3600;

export function GET(): Response {
  const robots = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /assets/",
    "Disallow: /market/audit/",
    "Disallow: /market/map/",
    "Disallow: /stages-test/",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    `Host: ${SITE_URL}`,
    "",
  ].join("\n");

  return new Response(robots, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
