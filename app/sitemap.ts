import type { MetadataRoute } from "next";

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

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
  }));
}
