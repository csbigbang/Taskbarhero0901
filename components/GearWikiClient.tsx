"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./GearWikiClient.module.css";

export type GearWikiItem = {
  item_key: string | number;
  item_type?: string | null;
  grade?: string | null;
  parts?: string | null;
  gear_type?: string | null;
  gear_group?: string | null;
  item_synthesis_type?: string | null;
  level?: string | number | null;
  is_steam_item?: boolean | string | null;
  is_can_exchange_marketable?: boolean | string | null;
  icon_path?: string | null;
  name_pt_br?: string | null;
  name_en_us?: string | null;
  description_pt_br?: string | null;
  description_en_us?: string | null;
};

export type GearWikiPrice = {
  item_key?: string | number | null;
  market_hash_name?: string | null;
  lowest_price_brl?: number | string | null;
  median_price_brl?: number | string | null;
  volume?: number | string | null;
  updated_at?: string | null;
};

type Props = {
  items: GearWikiItem[];
  prices: Record<string, GearWikiPrice>;
  initialGrade?: string;
  initialSlot?: string;
  initialQ?: string;
};

const GRADES = ["ALL", "COMMON", "UNCOMMON", "RARE", "LEGENDARY", "IMMORTAL", "ARCANA", "BEYOND", "CELESTIAL", "DIVINE", "COSMIC"];

const SLOT_GROUPS = [
  { key: "ALL", label: "Todos", icon: "⚔" },
  { key: "WEAPON", label: "Armas", icon: "⚔" },
  { key: "OFFHAND", label: "Off-hand", icon: "◈" },
  { key: "ARMOR", label: "Armadura", icon: "▣" },
  { key: "ACCESSORY", label: "Acessórios", icon: "◆" },
  { key: "SWORD", label: "Sword", icon: "⚔" },
  { key: "BOW", label: "Bow", icon: "➹" },
  { key: "STAFF", label: "Staff", icon: "✦" },
  { key: "CROSSBOW", label: "Crossbow", icon: "⌁" },
  { key: "AXE", label: "Axe", icon: "⚒" },
  { key: "RING", label: "Ring", icon: "◎" },
  { key: "BRACER", label: "Bracer", icon: "▰" },
];

const GRADE_POWER: Record<string, number> = {
  COMMON: 10,
  UNCOMMON: 18,
  RARE: 28,
  LEGENDARY: 42,
  IMMORTAL: 58,
  ARCANA: 72,
  BEYOND: 84,
  CELESTIAL: 92,
  DIVINE: 97,
  COSMIC: 100,
};

const CATEGORY_TO_SPRITE: Record<string, string> = {
  "30": "SWORD",
  "31": "BOW",
  "32": "STAFF",
  "33": "SCEPTER",
  "34": "CROSSBOW",
  "35": "AXE",
  "40": "SHIELD",
  "41": "ARROW",
  "42": "ORB",
  "43": "TOME",
  "44": "BOLT",
  "45": "HATCHET",
  "50": "HELMET",
  "51": "ARMOR",
  "52": "GLOVES",
  "53": "BOOTS",
  "60": "AMULET",
  "61": "EARING",
  "62": "RING",
  "63": "BRACER",
};

const TYPE_LABEL: Record<string, string> = {
  SWORD: "Sword",
  BOW: "Bow",
  STAFF: "Staff",
  SCEPTER: "Scepter",
  CROSSBOW: "Crossbow",
  AXE: "Axe",
  SHIELD: "Shield",
  ARROW: "Arrow",
  ORB: "Orb",
  TOME: "Tome",
  BOLT: "Bolt",
  HATCHET: "Hatchet",
  HELMET: "Helmet",
  ARMOR: "Armor",
  GLOVES: "Gloves",
  BOOTS: "Boots",
  AMULET: "Amulet",
  EARING: "Earring",
  RING: "Ring",
  BRACER: "Bracer",
};

const TYPE_LABEL_PT: Record<string, string> = {
  SWORD: "Espada",
  BOW: "Arco",
  STAFF: "Cajado",
  SCEPTER: "Cetro",
  CROSSBOW: "Besta",
  AXE: "Machado",
  SHIELD: "Escudo",
  ARROW: "Flecha",
  ORB: "Orbe",
  TOME: "Tomo",
  BOLT: "Virote",
  HATCHET: "Machadinha",
  HELMET: "Elmo",
  ARMOR: "Armadura",
  GLOVES: "Luvas",
  BOOTS: "Botas",
  AMULET: "Amuleto",
  EARING: "Brinco",
  RING: "Anel",
  BRACER: "Bracelete",
};

const GRADE_LABEL_PT: Record<string, string> = {
  COMMON: "Comum",
  UNCOMMON: "Incomum",
  RARE: "Raro",
  LEGENDARY: "Lendário",
  IMMORTAL: "Imortal",
  ARCANA: "Arcana",
  BEYOND: "Superior",
  CELESTIAL: "Celestial",
  DIVINE: "Divino",
  COSMIC: "Cósmico",
};

function normalize(value: unknown) {
  return String(value ?? "").trim();
}

function upper(value: unknown) {
  return normalize(value).toUpperCase();
}

function itemName(item: GearWikiItem) {
  return normalize(item.name_en_us) || normalize(item.name_pt_br) || `Equipamento ${item.item_key}`;
}

function itemId(item: GearWikiItem) {
  return normalize(item.item_key).match(/\d{4,}/)?.[0] || normalize(item.item_key);
}

function itemLevel(item: GearWikiItem) {
  const raw = normalize(item.level).match(/\d+/)?.[0];
  return raw ? Number(raw) : 0;
}

function itemGrade(item: GearWikiItem) {
  return upper(item.grade) || "COMMON";
}

function spriteNameFromItemId(value: string | number | null | undefined): string | null {
  const raw = normalize(value).match(/\d{6,}/)?.[0];
  if (!raw || raw.length < 6) return null;
  const id = raw.slice(0, 6);
  const category = id.slice(0, 2);
  const prefix = CATEGORY_TO_SPRITE[category];
  if (!prefix) return null;
  const base = id.slice(2, 4) === "00" ? id.slice(4, 6) : id.slice(3, 5);
  if (!/^\d{2}$/.test(base)) return null;
  return `${prefix}_${category}00${base}`;
}

function typeFromItem(item: GearWikiItem) {
  const byId = spriteNameFromItemId(item.item_key)?.split("_")[0];
  return upper(item.gear_type) || upper(item.parts) || byId || "GEAR";
}

function slotBucket(item: GearWikiItem) {
  const type = typeFromItem(item);
  if (["SWORD", "BOW", "STAFF", "SCEPTER", "CROSSBOW", "AXE"].includes(type)) return "WEAPON";
  if (["SHIELD", "ARROW", "ORB", "TOME", "BOLT", "HATCHET"].includes(type)) return "OFFHAND";
  if (["HELMET", "ARMOR", "GLOVES", "BOOTS"].includes(type)) return "ARMOR";
  if (["AMULET", "EARING", "EARRING", "RING", "BRACER"].includes(type)) return "ACCESSORY";
  return type;
}

function priceNumber(price?: GearWikiPrice) {
  const value = price?.lowest_price_brl ?? price?.median_price_brl;
  const num = typeof value === "number" ? value : Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(num) ? num : 0;
}

function formatBrl(value: number) {
  if (!value) return "sem preço";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function score(item: GearWikiItem, price?: GearWikiPrice) {
  const grade = GRADE_POWER[itemGrade(item)] ?? 20;
  const level = Math.min(itemLevel(item), 100) * 0.42;
  const market = Math.min(priceNumber(price) * 3, 24);
  return Math.round(Math.min(100, grade * 0.55 + level * 0.35 + market));
}

function traitLines(item: GearWikiItem, scoreValue: number) {
  const type = typeFromItem(item);
  const lv = Math.max(1, itemLevel(item));
  const base = Math.max(1, Math.round(scoreValue / 10));
  const damage = Math.max(3, Math.round(lv * 0.7 + base));
  const speed = Math.max(2, Math.round(scoreValue / 7));
  const survival = Math.max(5, Math.round(lv * 0.85 + scoreValue / 3));

  if (["SWORD", "BOW", "STAFF", "SCEPTER", "CROSSBOW", "AXE", "HATCHET"].includes(type)) {
    return [`Attack Damage +${damage}%`, `Critical Damage +${Math.max(5, scoreValue - 18)}%`, `Attack Speed +${speed}%`];
  }
  if (["SHIELD", "ARMOR", "HELMET", "GLOVES", "BOOTS"].includes(type)) {
    return [`Defense +${survival}`, `Damage Reduction +${Math.max(2, Math.round(scoreValue / 12))}%`, `HP +${Math.max(20, survival * 3)}`];
  }
  return [`Cooldown Reduction +${Math.max(2, Math.round(scoreValue / 16))}%`, `Critical Chance +${Math.max(3, Math.round(scoreValue / 2))}%`, `Attack Damage +${Math.max(5, Math.round(scoreValue * 0.9))}%`];
}


type HoveredGear = { item: GearWikiItem; price?: GearWikiPrice };

function cleanItemTitle(item: GearWikiItem) {
  const name = itemName(item).replace(/\s+/g, " ").trim();
  return name.replace(/\s+Variant\s+[ABC]$/i, "");
}

function displayType(item: GearWikiItem) {
  const key = typeFromItem(item);
  return TYPE_LABEL_PT[key] || TYPE_LABEL[key] || key;
}

function displayGrade(grade: string) {
  return GRADE_LABEL_PT[grade] || grade;
}

function variantLetter(item: GearWikiItem) {
  const name = itemName(item);
  const match = name.match(/\s([ABC])$/i);
  return match?.[1]?.toUpperCase() || "A";
}

function gradeLabel(grade: string) {
  return `Grau ${displayGrade(grade)}`;
}

function GearSprite({ item, big = false }: { item: GearWikiItem; big?: boolean }) {
  const sprite = spriteNameFromItemId(item.item_key);
  const src = sprite ? `/images/item-sprites/${sprite}.png` : "";
  if (!src) return null;
  return <img className={big ? styles.gearIconBig : styles.gearIcon} src={src} alt="" loading="lazy" draggable={false} />;
}

function GearPreview({ item, price }: { item: GearWikiItem; price?: GearWikiPrice }) {
  const grade = itemGrade(item);
  const value = score(item, price);
  const tradeable = normalize(item.is_steam_item) === "true" || normalize(item.is_can_exchange_marketable) === "true" || Boolean(price?.market_hash_name);
  const traits = traitLines(item, value);
  const type = displayType(item);

  return (
    <aside className={`${styles.previewPanel} ${styles[`grade${grade}`] || ""}`}>
      <div className={styles.tooltipTitle}>{cleanItemTitle(item)}</div>
      <div className={styles.tooltipTop}>
        <div className={styles.tooltipIconBox}>
          <GearSprite item={item} big />
        </div>
        <div className={styles.tooltipMeta}>
          <strong>{gradeLabel(grade)}</strong>
          <span>{type} · Variante {variantLetter(item)}</span>
          <span>Requer Nível {itemLevel(item) || "?"}</span>
        </div>
      </div>

      <div className={styles.tooltipSection}>
        <h4>Atributos principais</h4>
        {traits.map((line) => (
          <div key={line} className={styles.statLine}><i /> <span>{line}</span></div>
        ))}
      </div>

      <div className={styles.tooltipSection}>
        <h4>Slots</h4>
        <div className={styles.slotLine}><b>T9</b><span>Slot de decoração</span></div>
        <div className={styles.slotLine}><b>T9</b><span>Slot de gravação</span></div>
        <div className={styles.slotLine}><b>T10</b><span>Slot de inscrição</span></div>
      </div>

      <div className={styles.tooltipFooter}>
        <span>{tradeable ? "Negociável" : "Sem mercado"}</span>
        <strong>{formatBrl(priceNumber(price))}</strong>
      </div>
    </aside>
  );
}

function GearCard({ item, price, onHover }: { item: GearWikiItem; price?: GearWikiPrice; onHover: (item: GearWikiItem, price: GearWikiPrice | undefined) => void }) {
  const grade = itemGrade(item);
  const value = score(item, price);
  const type = displayType(item);
  const priceValue = priceNumber(price);

  return (
    <Link
      href={`/items/${encodeURIComponent(itemId(item))}`}
      className={`${styles.gearCard} ${styles[`grade${grade}`] || ""}`}
      onMouseEnter={() => onHover(item, price)}
      onFocus={() => onHover(item, price)}
    >
      <div className={styles.iconSlot}>
        <GearSprite item={item} />
      </div>
      <div className={styles.cardBody}>
        <span className={styles.typeTag}>{type}</span>
        <h3>{cleanItemTitle(item)}</h3>
        <div className={styles.cardMeta}>
          <span>Nível {itemLevel(item) || "?"}</span>
          <span>{displayGrade(grade)}</span>
          <span>{itemId(item)}</span>
        </div>
      </div>
      <div className={styles.cardScore}>
        <strong>{value}</strong>
        <span>{priceValue ? formatBrl(priceValue) : "sem preço"}</span>
      </div>
    </Link>
  );
}

export default function GearWikiClient({ items, prices, initialGrade = "ALL", initialSlot = "ALL", initialQ = "" }: Props) {
  const [query, setQuery] = useState(initialQ);
  const [grade, setGrade] = useState(initialGrade.toUpperCase());
  const [slot, setSlot] = useState(initialSlot.toUpperCase());
  const [sort, setSort] = useState("score");
  const [maxPrice, setMaxPrice] = useState("");
  const [hovered, setHovered] = useState<HoveredGear | null>(null);

  const prepared = useMemo(() => {
    const q = query.trim().toLowerCase();
    const priceLimit = Number(maxPrice.replace(",", "."));

    return items
      .filter((item) => {
        const id = itemId(item);
        const name = itemName(item).toLowerCase();
        const g = itemGrade(item);
        const t = typeFromItem(item);
        const bucket = slotBucket(item);
        const price = prices[id] || prices[String(item.item_key ?? "")];
        const p = priceNumber(price);

        if (q && !`${id} ${name} ${g.toLowerCase()} ${t.toLowerCase()}`.includes(q)) return false;
        if (grade !== "ALL" && g !== grade) return false;
        if (slot !== "ALL" && t !== slot && bucket !== slot) return false;
        if (Number.isFinite(priceLimit) && priceLimit > 0 && p > priceLimit) return false;
        return true;
      })
      .map((item) => {
        const id = itemId(item);
        const price = prices[id] || prices[String(item.item_key ?? "")];
        return { item, price, score: score(item, price), priceValue: priceNumber(price), level: itemLevel(item) };
      })
      .sort((a, b) => {
        if (sort === "level") return b.level - a.level || b.score - a.score;
        if (sort === "price") return b.priceValue - a.priceValue || b.score - a.score;
        if (sort === "name") return itemName(a.item).localeCompare(itemName(b.item));
        return b.score - a.score || b.level - a.level;
      });
  }, [items, prices, query, grade, slot, sort, maxPrice]);

  const visible = prepared.slice(0, 360);
  const stats = useMemo(() => {
    const withPrice = items.filter((item) => priceNumber(prices[itemId(item)] || prices[String(item.item_key ?? "")]) > 0).length;
    const cosmic = items.filter((item) => itemGrade(item) === "COSMIC").length;
    const divine = items.filter((item) => itemGrade(item) === "DIVINE").length;
    return { withPrice, cosmic, divine };
  }, [items, prices]);


  function handleHover(item: GearWikiItem, price: GearWikiPrice | undefined) {
    setHovered({ item, price });
  }

  const preview = hovered || (visible[0] ? { item: visible[0].item, price: visible[0].price } : null);

  return (
    <main className={styles.gearShell}>
      <section className={styles.heroPanel}>
        <div>
          <span className={styles.kicker}>GEAR DATABASE</span>
          <h1>Equipamentos</h1>
          <p>Equipamentos em grid com tooltip animado, sprite real, raridade, level, preço em R$ e acesso rápido ao item.</p>
        </div>
        <div className={styles.heroStats}>
          <div><strong>{items.length.toLocaleString("pt-BR")}</strong><span>gear</span></div>
          <div><strong>{stats.withPrice.toLocaleString("pt-BR")}</strong><span>com preço</span></div>
          <div><strong>{stats.divine + stats.cosmic}</strong><span>top grades</span></div>
        </div>
      </section>

      <section className={styles.filtersPanel}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar gear, ID, ring, bow, sword, divine..." />
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="score">Melhor score</option>
          <option value="level">Maior level</option>
          <option value="price">Maior preço</option>
          <option value="name">Nome A-Z</option>
        </select>
        <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Preço máx. R$" inputMode="decimal" />
      </section>

      <section className={styles.gradeTabs} aria-label="Raridades">
        {GRADES.map((g) => (
          <button key={g} type="button" className={grade === g ? styles.activeTab : ""} onClick={() => setGrade(g)}>
            <span className={styles.gradeDot} data-grade={g.toLowerCase()} />
            {g === "ALL" ? "Todas" : g}
          </button>
        ))}
      </section>

      <section className={styles.slotTabs} aria-label="Slots">
        {SLOT_GROUPS.map((s) => (
          <button key={s.key} type="button" className={slot === s.key ? styles.activeSlot : ""} onClick={() => setSlot(s.key)}>
            <span>{s.icon}</span>{s.label}
          </button>
        ))}
      </section>

      <section className={styles.resultHeader}>
        <div>
          <strong>{prepared.length.toLocaleString("pt-BR")}</strong> resultado(s)
          <span> · exibindo {visible.length.toLocaleString("pt-BR")} para manter a página leve</span>
        </div>
        <Link href="/database">Abrir Banco de Dados ↗</Link>
      </section>

      <section className={styles.gearWorkspace}>
        <div className={styles.gearGrid}>
          {visible.map(({ item, price }) => (
            <GearCard key={String(item.item_key)} item={item} price={price} onHover={handleHover} />
          ))}
        </div>
        <div className={styles.previewRail}>
          {preview ? <GearPreview item={preview.item} price={preview.price} /> : null}
        </div>
      </section>
    </main>
  );
}
