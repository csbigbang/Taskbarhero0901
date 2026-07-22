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

export function cleanAssetValue(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^public\//, "")
    .replace(/^\/+/, "");
}

function fileBase(value: string) {
  return (value.split("/").pop() || value)
    .replace(/\.(png|jpg|jpeg|webp|gif)$/i, "")
    .replace(/[^a-zA-Z0-9_-]/g, "");
}

function withPng(value: string) {
  return /\.(png|jpg|jpeg|webp|gif)$/i.test(value) ? value : `${value}.png`;
}

function pushUnique(list: string[], value?: string | null) {
  if (!value) return;
  const normalized = value.startsWith("/") ? value : `/${value}`;
  if (!list.includes(normalized)) list.push(normalized);
}

export function firstItemId(...values: unknown[]) {
  for (const value of values) {
    const raw = cleanAssetValue(value);
    const match = raw.match(/\d{6,}/);
    if (match?.[0]) return match[0].slice(0, 6);
  }
  return "";
}

export function isGearItemId(value: unknown) {
  const id = firstItemId(value);
  return Boolean(id && CATEGORY_TO_SPRITE[id.slice(0, 2)]);
}

export function gearSpriteName(value: unknown) {
  const id = firstItemId(value);
  if (!/^\d{6}$/.test(id)) return "";

  const category = id.slice(0, 2);
  const prefix = CATEGORY_TO_SPRITE[category];
  if (!prefix) return "";

  // IDs base: 300001 => SWORD_300001.
  // IDs completos de drop/equip: 306071 => SWORD_300007.
  const tier = id.slice(2, 4) === "00" ? id.slice(4, 6) : id.slice(3, 5);
  if (!/^\d{2}$/.test(tier)) return "";

  return `${prefix}_${category}00${tier}`;
}

export function itemAssetSources(options: { itemKey?: unknown; iconPath?: unknown }) {
  const sources: string[] = [];
  const itemId = firstItemId(options.itemKey, options.iconPath);
  const spriteName = gearSpriteName(options.itemKey || options.iconPath);
  const gear = Boolean(spriteName || isGearItemId(itemId));
  const icon = cleanAssetValue(options.iconPath);

  if (spriteName) {
    pushUnique(sources, `/images/item-sprites/${spriteName}.png`);
    pushUnique(sources, `/game-assets/items/${spriteName}.png`);
  }

  if (icon) {
    const name = fileBase(icon);
    const isBrokenGearAlias = gear && /^Item_\d{6}$/i.test(name);

    if (!isBrokenGearAlias) {
      const file = withPng(name);
      pushUnique(sources, `/images/item-sprites/${file}`);
      pushUnique(sources, `/images/items/${file}`);
      pushUnique(sources, `/game-assets/items/${file}`);
    }

    if (icon.includes("/")) pushUnique(sources, `/${withPng(icon)}`);
  }

  if (itemId && !gear) {
    pushUnique(sources, `/images/items/Item_${itemId}.png`);
    pushUnique(sources, `/images/items/${itemId}.png`);
    pushUnique(sources, `/game-assets/items/Item_${itemId}.png`);
  }

  return sources;
}
