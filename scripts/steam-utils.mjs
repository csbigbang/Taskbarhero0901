import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

export function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    value = value.replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env"));

export const APP_ID = Number(process.env.STEAM_APP_ID || "3678970");
export const CURRENCY = Number(process.env.STEAM_MARKET_CURRENCY || "7");
export const DELAY_MS = Number(process.env.STEAM_MARKET_DELAY_MS || "3500");
export const COUNTRY = String(process.env.STEAM_MARKET_COUNTRY || "BR").toUpperCase();
export const LANGUAGE = String(process.env.STEAM_MARKET_LANGUAGE || "brazilian");

export function requireSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Faltou NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local");
    process.exit(1);
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: WebSocket }
  });
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function compactSteamIconUrl(iconUrl) {
  if (!iconUrl) return null;
  const clean = String(iconUrl)
    .replace(/^https?:\/\/steamcommunity-a\.akamaihd\.net\/economy\/image\//, "")
    .replace(/^https?:\/\/community\.cloudflare\.steamstatic\.com\/economy\/image\//, "");
  return clean || null;
}

export function fullSteamIconUrl(iconUrl) {
  if (!iconUrl) return null;
  if (String(iconUrl).startsWith("http")) return iconUrl;
  return `https://community.cloudflare.steamstatic.com/economy/image/${iconUrl}`;
}

export function detectCurrency(text) {
  const s = String(text || "");
  if (!s.trim()) return "unknown";
  if (/R\$|BRL/i.test(s)) return "BRL";
  if (/€|EUR/i.test(s)) return "EUR";
  if (/USD|US\$|\$/.test(s)) return "USD";
  if (/£|GBP/i.test(s)) return "GBP";
  return "unknown";
}

export function parseSteamPrice(text, expectedCurrency = CURRENCY) {
  if (!text) return null;
  const raw = String(text).trim();
  const detected = detectCurrency(raw);

  // Se o script estiver configurado para BRL, não aceita € como se fosse real.
  // Isso evita o erro clássico: "€2.02" virar "R$ 2,02" no site.
  if (expectedCurrency === 7 && detected !== "BRL" && detected !== "unknown") {
    return null;
  }

  let s = raw
    .replace(/R\$|BRL|USD|US\$|EUR|GBP|€|£|\$/gi, "")
    .replace(/\s/g, "")
    .trim();

  const comma = s.lastIndexOf(",");
  const dot = s.lastIndexOf(".");

  if (comma >= 0 && dot >= 0) {
    // Decide pelo último separador: 1.234,56 ou 1,234.56
    if (comma > dot) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (comma >= 0) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    // 1,234 não existe aqui; remove separador de milhar quando tiver 3 casas no fim.
    s = s.replace(/,(?=\d{3}(\D|$))/g, "");
  }

  const n = Number(s.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function formatBrl(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "sem preço";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

export function marketListingUrl(hash) {
  return `https://steamcommunity.com/market/listings/${APP_ID}/${encodeURIComponent(hash)}`;
}
