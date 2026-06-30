import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function parsePrice(text: string | null) {
  if (!text) return null;
  const raw = String(text).trim();
  if (/€|EUR/i.test(raw)) return null;
  let s = raw.replace(/R\$|BRL|\s/gi, "");
  const comma = s.lastIndexOf(",");
  const dot = s.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) s = comma > dot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  else if (comma >= 0) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get("hash");
  if (!hash) return NextResponse.json({ success: false, error: "Informe ?hash=" }, { status: 400 });

  const url = new URL("https://steamcommunity.com/market/priceoverview/");
  url.searchParams.set("appid", "3678970");
  url.searchParams.set("currency", "7");
  url.searchParams.set("country", "BR");
  url.searchParams.set("cc", "br");
  url.searchParams.set("l", "brazilian");
  url.searchParams.set("market_hash_name", hash);

  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 TBH-Banco-BR/1.0 price check",
      "accept": "application/json,text/plain,*/*",
      "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.7,en;q=0.5"
    },
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);
  return NextResponse.json({
    ok: res.ok,
    request: { appid: 3678970, currency: 7, country: "BR", hash },
    steam: json,
    parsed: {
      lowest_price_brl: parsePrice(json?.lowest_price ?? null),
      median_price_brl: parsePrice(json?.median_price ?? null),
    }
  });
}
