#!/usr/bin/env node
import { normalizeText, requireSupabase } from "./steam-utils.mjs";

const db = requireSupabase();

const AUTO_ACCEPT_SCORE = Number(process.env.STEAM_AUTO_ACCEPT_SCORE || "92");
const AUTO_ACCEPT = String(process.env.STEAM_AUTO_ACCEPT || "true").toLowerCase() !== "false";
const OVERWRITE_MANUAL = process.argv.includes("--overwrite-manual");
const CLEAN_BAD_LINKS = process.argv.includes("--clean-bad-links");
const LIMIT_STEAM = Number(process.env.STEAM_MAP_LIMIT || "5000");
const LIMIT_ITEMS = Number(process.env.STEAM_MAP_LOCAL_LIMIT || "0"); // 0 = carregar tudo
const PAGE_SIZE = Math.min(Number(process.env.STEAM_MAP_PAGE_SIZE || "1000"), 1000);

const GRADE_MAP = new Map([
  ["common", "COMMON"],
  ["uncommon", "UNCOMMON"],
  ["rare", "RARE"],
  ["legendary", "LEGENDARY"],
  ["immortal", "IMMORTAL"],
  ["arcana", "ARCANA"],
  ["beyond", "BEYOND"],
  ["celestial", "CELESTIAL"],
  ["divine", "DIVINE"],
  ["cosmic", "COSMIC"]
]);

const GEAR_TYPE_MAP = new Map([
  ["sword", "SWORD"],
  ["bow", "BOW"],
  ["staff", "STAFF"],
  ["scepter", "SCEPTER"],
  ["crossbow", "CROSSBOW"],
  ["axe", "AXE"],
  ["shield", "SHIELD"],
  ["arrow", "ARROW"],
  ["orb", "ORB"],
  ["tome", "TOME"],
  ["bolt", "BOLT"],
  ["hatchet", "HATCHET"],
  ["helmet", "HELMET"],
  ["helm", "HELMET"],
  ["armor", "ARMOR"],
  ["armour", "ARMOR"],
  ["gloves", "GLOVES"],
  ["boots", "BOOTS"],
  ["amulet", "AMULET"],
  ["earring", "EARING"],
  ["earing", "EARING"],
  ["ring", "RING"],
  ["bracer", "BRACER"]
]);

const VARIANT_TO_LAST_DIGIT = new Map([
  ["A", "1"],
  ["B", "2"],
  ["C", "3"],
  ["D", "4"],
  ["E", "5"]
]);

function argFlag(name) {
  return process.argv.includes(name);
}

function cleanSteamName(value) {
  return String(value || "")
    .replace(/\u2122|\u00ae/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeGrade(value) {
  const n = normalizeText(value);
  return GRADE_MAP.get(n) || String(value || "").toUpperCase().trim() || null;
}

function normalizeGearType(value) {
  const n = normalizeText(value);
  return GEAR_TYPE_MAP.get(n) || String(value || "").toUpperCase().trim() || null;
}

function asBoolText(value) {
  return String(value || "").toLowerCase() === "true";
}

function tokens(value) {
  return normalizeText(value)
    .split(" ")
    .filter((x) => x.length >= 3 && !["the", "and", "item", "material", "offering", "crafting", "decoration"].includes(x));
}

function tokenRatio(a, b) {
  const aa = new Set(tokens(a));
  const bb = new Set(tokens(b));
  if (!aa.size || !bb.size) return { hit: 0, ratioA: 0, ratioB: 0 };
  let hit = 0;
  for (const t of aa) if (bb.has(t)) hit++;
  return { hit, ratioA: hit / aa.size, ratioB: hit / bb.size };
}

function parseSteamType(typeValue) {
  const typeRaw = cleanSteamName(typeValue || "");
  if (!typeRaw) return { typeRaw: null, gearType: null, level: null, typeNormalized: "" };

  // No Steam Market real do TBH, o nome fica assim:
  // Shadow Bow (Arcana) A
  // e o tipo/descrição do asset vem como:
  // Bow - Lv. 80
  const gearType = typeRaw.match(/^(.+?)\s*-\s*Lv\.?\s*(\d+)\.?$/i);
  if (gearType) {
    return {
      typeRaw,
      gearType: normalizeGearType(gearType[1]),
      level: String(gearType[2] || "").trim() || null,
      typeNormalized: normalizeText(typeRaw)
    };
  }

  return { typeRaw, gearType: null, level: null, typeNormalized: normalizeText(typeRaw) };
}

function parseSteamName(marketHashName, name, typeValue) {
  const raw = cleanSteamName(marketHashName || name);
  const n = normalizeText(raw);
  const parsedType = parseSteamType(typeValue);

  // Formato real do Market do TBH:
  // Shadow Bow (Arcana) A
  // Dimensional Armor (Beyond) B
  // O tipo/level vem separado em asset_description.type: "Bow - Lv. 80".
  const realGear = raw.match(/^(.+?)\s*\(([^)]+)\)(?:\s+([A-Z]))?$/i);
  if (realGear && normalizeGrade(realGear[2])) {
    const coreName = cleanSteamName(realGear[1] || "");
    return {
      kind: "gear",
      format: "steam-real",
      raw,
      normalized: n,
      categoryRaw: parsedType.typeRaw,
      gearType: parsedType.gearType,
      level: parsedType.level,
      coreName,
      coreNormalized: normalizeText(coreName),
      grade: normalizeGrade(realGear[2]),
      variant: realGear[3] ? String(realGear[3]).toUpperCase() : null,
      typeRaw: parsedType.typeRaw,
      typeNormalized: parsedType.typeNormalized
    };
  }

  // Formato alternativo/antigo:
  // Bow - Lv. 80 Shadow Bow (Arcana) A
  // Armor - Lv. 80 Dimensional Armor (Beyond) B
  const gear = raw.match(/^(.+?)\s*-\s*Lv\.?\s*(\d+)\s+(.+?)(?:\s*\(([^)]+)\))?(?:\s+([A-Z]))?$/i);
  if (gear) {
    const categoryRaw = gear[1]?.trim();
    const category = normalizeGearType(categoryRaw);
    const level = gear[2]?.trim() || null;
    const coreName = cleanSteamName(gear[3] || "");
    const grade = gear[4] ? normalizeGrade(gear[4]) : null;
    const variant = gear[5] ? String(gear[5]).toUpperCase() : null;
    return {
      kind: "gear",
      format: "legacy-full",
      raw,
      normalized: n,
      categoryRaw,
      gearType: category,
      level,
      coreName,
      coreNormalized: normalizeText(coreName),
      grade,
      variant,
      typeRaw: parsedType.typeRaw,
      typeNormalized: parsedType.typeNormalized
    };
  }

  // Se o nome não traz raridade, mas o tipo diz que é Gear, mantemos como item simples.

  // Materiais geralmente vêm como:
  // Amber Gem
  // Amethyst
  // Crafting Material Stone
  // Decoration Material Diamond
  // Offering Material Empire 50th Anniversary Coin
  const materialCore = raw
    .replace(/^Crafting\s+Material\s+/i, "")
    .replace(/^Decoration\s+Material\s+/i, "")
    .replace(/^Offering\s+Material\s+/i, "")
    .trim();

  return {
    kind: "material-or-simple",
    raw,
    normalized: n,
    coreName: materialCore,
    coreNormalized: normalizeText(materialCore),
    typeRaw: parsedType.typeRaw,
    typeNormalized: parsedType.typeNormalized
  };
}

function enrichItem(item) {
  return {
    ...item,
    item_key: String(item.item_key ?? ""),
    item_type_u: String(item.item_type ?? "").toUpperCase(),
    grade_u: String(item.grade ?? "").toUpperCase(),
    gear_type_u: String(item.gear_type ?? "").toUpperCase(),
    parts_u: String(item.parts ?? "").toUpperCase(),
    level_s: String(item.level ?? "").trim(),
    is_steam_item_b: asBoolText(item.is_steam_item),
    is_marketable_b: asBoolText(item.is_can_exchange_marketable),
    is_bucket_box_b: asBoolText(item.is_bucket_box),
    en_n: normalizeText(item.name_en_us),
    pt_n: normalizeText(item.name_pt_br),
    key_n: normalizeText(item.item_key),
    icon_n: normalizeText(item.icon_path)
  };
}

function nameScore(core, item) {
  const coreN = normalizeText(core);
  if (!coreN) return { score: 0, reason: "sem nome base" };

  if (item.en_n === coreN) return { score: 56, reason: "nome EN exato" };
  if (item.pt_n === coreN) return { score: 54, reason: "nome PT exato" };
  if (item.en_n && (coreN.includes(item.en_n) || item.en_n.includes(coreN))) return { score: 38, reason: "nome EN contido" };
  if (item.pt_n && (coreN.includes(item.pt_n) || item.pt_n.includes(coreN))) return { score: 36, reason: "nome PT contido" };

  const enRatio = tokenRatio(coreN, item.en_n);
  const ptRatio = tokenRatio(coreN, item.pt_n);
  const best = enRatio.hit >= ptRatio.hit ? enRatio : ptRatio;
  if (best.hit >= 2 && (best.ratioA >= 0.66 || best.ratioB >= 0.66)) {
    return { score: Math.round(22 + Math.max(best.ratioA, best.ratioB) * 12), reason: `tokens do nome ${best.hit}` };
  }

  return { score: 0, reason: "nome diferente" };
}

function scoreGear(parsed, item) {
  if (item.item_type_u !== "GEAR") return null;
  if (parsed.gearType && item.gear_type_u && item.gear_type_u !== parsed.gearType) return null;
  if (parsed.grade && item.grade_u && item.grade_u !== parsed.grade) return null;
  if (parsed.level && item.level_s && item.level_s !== parsed.level) return null;

  const ns = nameScore(parsed.coreName, item);
  if (ns.score <= 0) return null;

  let score = ns.score;
  const reasons = [ns.reason];

  if (parsed.gearType && item.gear_type_u === parsed.gearType) {
    score += 12;
    reasons.push(`tipo ${parsed.gearType}`);
  }

  if (parsed.grade && item.grade_u === parsed.grade) {
    score += 20;
    reasons.push(`grade ${parsed.grade}`);
  }

  if (parsed.level && item.level_s === parsed.level) {
    score += 15;
    reasons.push(`Lv.${parsed.level}`);
  }

  if (parsed.format === "steam-real") {
    score += 10;
    reasons.push("formato real Steam");
  }

  if (parsed.variant) {
    const expectedLast = VARIANT_TO_LAST_DIGIT.get(parsed.variant);
    if (expectedLast && item.item_key.endsWith(expectedLast)) {
      score += 16;
      reasons.push(`variante ${parsed.variant}`);
    } else if (expectedLast) {
      score -= 18;
      reasons.push(`variante ${parsed.variant} não bate`);
    }
  }

  if (item.is_steam_item_b) score += 2;
  if (item.is_marketable_b) score += 3;

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    reason: `gear inteligente: ${reasons.join(" + ")}`
  };
}

function scoreMaterial(parsed, item) {
  if (item.item_type_u !== "MATERIAL") return null;

  const rawN = parsed.normalized;
  const coreN = parsed.coreNormalized;
  const names = [item.en_n, item.pt_n, item.key_n, item.icon_n].filter(Boolean);

  if (names.includes(rawN)) return { score: 100, reason: "material: nome Steam exato" };
  if (names.includes(coreN)) return { score: 98, reason: "material: nome sem prefixo exato" };

  const ns = nameScore(parsed.coreName || parsed.raw, item);
  if (ns.score >= 36) {
    let score = ns.score + 42;
    if (item.is_steam_item_b) score += 1;
    if (item.is_marketable_b) score += 2;
    return { score: Math.min(94, Math.round(score)), reason: `material: ${ns.reason}` };
  }

  return null;
}

function scoreFallback(parsed, item) {
  // Fallback seguro para nomes muito simples. Não autoaceita se não passar do corte.
  const rawN = parsed.normalized;
  const names = [item.en_n, item.pt_n, item.key_n, item.icon_n].filter(Boolean);
  if (names.includes(rawN)) return { score: 92, reason: "fallback: nome exato" };

  const ns = nameScore(parsed.raw, item);
  if (ns.score >= 38) return { score: ns.score + 35, reason: `fallback: ${ns.reason}` };
  return null;
}

function scoreCandidate(market, item) {
  const parsed = parseSteamName(market.market_hash_name, market.name, market.type);

  // Evita linkar caixas internas como preço real de item do Market.
  if (item.item_type_u === "STAGEBOX" || item.is_bucket_box_b) {
    return { score: 0, reason: "ignorado: caixa interna/StageBox" };
  }

  let s = null;
  if (parsed.kind === "gear") s = scoreGear(parsed, item);
  if (!s && parsed.kind !== "gear") s = scoreMaterial(parsed, item);
  if (!s) s = scoreFallback(parsed, item);
  if (!s) return { score: 0, reason: "sem similaridade segura" };

  return s;
}

function isManualMap(row) {
  const notes = String(row?.notes || "").toLowerCase();
  return notes.includes("manual") || notes.includes("não sobrescrever") || notes.includes("nao sobrescrever");
}

async function fetchAllRows(table, select, options = {}) {
  const limit = Number(options.limit || 0);
  const order = options.order || null;
  const rows = [];
  let from = 0;

  while (true) {
    if (limit > 0 && rows.length >= limit) break;

    const take = limit > 0 ? Math.min(PAGE_SIZE, limit - rows.length) : PAGE_SIZE;
    const to = from + take - 1;

    let query = db.from(table).select(select);
    if (order) query = query.order(order);
    query = query.range(from, to);

    const { data, error } = await query;
    if (error) throw error;

    const batch = data || [];
    rows.push(...batch);

    if (batch.length < take) break;
    from += take;
  }

  return rows;
}

async function loadMarketItems() {
  return fetchAllRows(
    "tbh_steam_market_items",
    "market_hash_name,name,type,icon_url,sell_listings,sell_price_text,sale_price_text,lowest_price_brl",
    { limit: LIMIT_STEAM, order: "market_hash_name" }
  );
}

async function loadLocalItems() {
  const rows = await fetchAllRows(
    "tbh_items_full",
    "item_key,name_pt_br,name_en_us,icon_path,grade,item_type,parts,gear_type,level,is_steam_item,is_can_exchange_marketable,is_bucket_box",
    { limit: LIMIT_ITEMS, order: "item_key" }
  );
  return rows.map(enrichItem);
}

async function loadExistingMap() {
  return fetchAllRows(
    "tbh_market_item_map",
    "item_key,market_hash_name,enabled,notes",
    { limit: 0, order: "item_key" }
  );
}

function chooseBestCandidates(marketItems, items) {
  const candidates = [];
  const bestBySteam = [];

  // Reduz comparações: separa por tipo.
  const gears = items.filter((x) => x.item_type_u === "GEAR");
  const materials = items.filter((x) => x.item_type_u === "MATERIAL");
  const others = items.filter((x) => x.item_type_u !== "GEAR" && x.item_type_u !== "MATERIAL" && x.item_type_u !== "STAGEBOX");

  for (const sm of marketItems || []) {
    const parsed = parseSteamName(sm.market_hash_name, sm.name);
    const pool = parsed.kind === "gear" ? gears : [...materials, ...others];
    let best = null;
    let second = null;

    for (const item of pool) {
      const s = scoreCandidate(sm, item);
      if (!s || s.score <= 0) continue;

      const row = {
        market_hash_name: sm.market_hash_name,
        item_key: item.item_key,
        score: s.score,
        reason: s.reason,
        status: s.score >= AUTO_ACCEPT_SCORE ? "accepted" : "suggested",
        updated_at: new Date().toISOString()
      };

      if (!best || row.score > best.score) {
        second = best;
        best = row;
      } else if (!second || row.score > second.score) {
        second = row;
      }
    }

    if (best) {
      // Se o segundo candidato estiver colado no primeiro, não autoaceita.
      // Isso evita link errado quando há ambiguidade real.
      if (second && best.score < 100 && best.score - second.score < 4) {
        best.status = "suggested";
        best.reason = `${best.reason} · ambíguo com ${second.item_key} score=${second.score}`;
      }
      candidates.push(best);
      bestBySteam.push({ best, second });
    }
  }

  return { candidates, bestBySteam };
}

function chooseAutoLinks(candidates, existingMap) {
  const byItem = new Map();
  const existingByItem = new Map((existingMap || []).map((x) => [String(x.item_key), x]));

  for (const c of candidates || []) {
    if (c.status !== "accepted") continue;
    const old = byItem.get(c.item_key);
    if (!old || c.score > old.score) byItem.set(c.item_key, c);
  }

  const out = [];
  let skippedManual = 0;

  for (const c of byItem.values()) {
    const current = existingByItem.get(String(c.item_key));
    if (current && isManualMap(current) && !OVERWRITE_MANUAL) {
      skippedManual++;
      continue;
    }
    out.push({
      item_key: c.item_key,
      market_hash_name: c.market_hash_name,
      enabled: true,
      notes: `auto-link 14.5 steam-real-name: ${c.reason} score=${c.score}`,
      updated_at: new Date().toISOString()
    });
  }

  return { autoLinks: out, skippedManual };
}

async function cleanBadLinks(existingMap, marketNames) {
  if (!CLEAN_BAD_LINKS) return 0;
  const bad = (existingMap || []).filter((row) => row.enabled && row.market_hash_name && !marketNames.has(row.market_hash_name));
  if (!bad.length) return 0;

  let changed = 0;
  for (const row of bad) {
    const { error } = await db
      .from("tbh_market_item_map")
      .update({ enabled: false, notes: `desativado 14.5: market_hash_name não existe na lista real Steam (${row.market_hash_name})`, updated_at: new Date().toISOString() })
      .eq("item_key", row.item_key);
    if (error) console.error(`Erro ao desativar link ruim ${row.item_key}:`, error.message);
    else changed++;
  }
  return changed;
}

async function main() {
  console.log("Mapeando itens Steam Market com itens locais...");
  console.log(`Mapper inteligente 14.5 STEAM REAL NAME · auto_accept_score=${AUTO_ACCEPT_SCORE} · auto_accept=${AUTO_ACCEPT} · page_size=${PAGE_SIZE}`);

  const [marketItems, items, existingMap] = await Promise.all([
    loadMarketItems(),
    loadLocalItems(),
    loadExistingMap()
  ]);

  console.log(`Steam items: ${marketItems.length}`);
  console.log(`Itens locais: ${items.length}`);
  if (items.length === 1000) {
    console.log("AVISO: ainda carregou só 1000 itens. Verifique se o script 14.4 foi copiado e se o Supabase não está limitando a API.");
  }
  console.log(`Links existentes: ${existingMap.length}`);

  const marketNames = new Set(marketItems.map((x) => x.market_hash_name).filter(Boolean));
  const cleaned = await cleanBadLinks(existingMap, marketNames);
  if (cleaned) console.log(`Links ruins desativados: ${cleaned}`);

  const { candidates } = chooseBestCandidates(marketItems, items);

  const score100 = candidates.filter((x) => x.score >= 100).length;
  const score92 = candidates.filter((x) => x.score >= AUTO_ACCEPT_SCORE).length;
  const suggested = candidates.filter((x) => x.score > 0 && x.score < AUTO_ACCEPT_SCORE).length;

  console.log(`Candidatos encontrados: ${candidates.length}`);
  console.log(`Score 100: ${score100}`);
  console.log(`Acima do corte (${AUTO_ACCEPT_SCORE}+): ${score92}`);
  console.log(`Sugestões abaixo do corte: ${suggested}`);

  if (candidates.length) {
    const { error } = await db
      .from("tbh_steam_market_candidates")
      .upsert(candidates, { onConflict: "market_hash_name,item_key" });
    if (error) throw error;
  }

  let autoLinks = [];
  let skippedManual = 0;

  if (AUTO_ACCEPT) {
    const result = chooseAutoLinks(candidates, existingMap);
    autoLinks = result.autoLinks;
    skippedManual = result.skippedManual;

    if (autoLinks.length) {
      const { error } = await db
        .from("tbh_market_item_map")
        .upsert(autoLinks, { onConflict: "item_key" });
      if (error) throw error;
    }
  }

  const accepted = candidates.filter((x) => x.status === "accepted").length;
  console.log(`Candidatos criados/atualizados: ${candidates.length}`);
  console.log(`Links aceitos automaticamente: ${autoLinks.length}`);
  console.log(`Candidatos marcados como accepted: ${accepted}`);
  if (skippedManual) console.log(`Links manuais preservados: ${skippedManual}`);

  const preview = candidates
    .filter((x) => x.status === "accepted")
    .slice(0, 12)
    .map((x) => `  ${x.item_key} <= ${x.market_hash_name} (${x.score})`)
    .join("\n");
  if (preview) {
    console.log("Prévia de links aceitos:");
    console.log(preview);
  }

  console.log("Abra /market/map para revisar vínculos e gaps.");
  console.log("Depois rode: node scripts/refresh-steam-market-real.mjs --all");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
