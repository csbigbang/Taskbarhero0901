"use client";

import { useMemo, useState } from "react";

type Props = {
  itemKey?: string | number | null;
  iconPath?: string | null;
  alt: string;
  className?: string;
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

function clean(value: unknown) {
  return String(value ?? "").trim().replace(/\\/g, "/").replace(/^\/+/, "");
}

function withExt(path: string) {
  if (!path) return "";
  return /\.(png|jpg|jpeg|webp|gif)$/i.test(path) ? path : `${path}.png`;
}

function pushUnique(list: string[], value: string | null | undefined) {
  if (!value) return;
  const path = value.startsWith("/") ? value : `/${value}`;
  if (!list.includes(path)) list.push(path);
}

function itemIds(value: string | number | null | undefined) {
  const raw = clean(value);
  if (!raw) return [];
  const digits = raw.match(/\d{4,}/g) || [];
  return Array.from(new Set([raw, ...digits]));
}

function isGearId(value: string | number | null | undefined) {
  const raw = clean(value).match(/\d{6,}/)?.[0];
  if (!raw) return false;
  return Boolean(CATEGORY_TO_SPRITE[raw.slice(0, 2)]);
}

function spriteNameFromItemId(value: string | number | null | undefined): string | null {
  const raw = clean(value).match(/\d{6,}/)?.[0];
  if (!raw || raw.length < 6) return null;

  const id = raw.slice(0, 6);
  const category = id.slice(0, 2);
  const prefix = CATEGORY_TO_SPRITE[category];
  if (!prefix) return null;

  // IDs locais: 345171 => CROSSBOW_340017, 306071 => SWORD_300007.
  // IDs sprite/base: 300001 => SWORD_300001.
  const base = id.slice(2, 4) === "00" ? id.slice(4, 6) : id.slice(3, 5);
  if (!/^\d{2}$/.test(base)) return null;
  return `${prefix}_${category}00${base}`;
}

function buildSources(itemKey?: string | number | null, iconPath?: string | null) {
  const list: string[] = [];
  const icon = clean(iconPath);

  if (icon) {
    const file = icon.split("/").pop() || icon;
    pushUnique(list, `/images/item-sprites/${withExt(file)}`);
    pushUnique(list, `/images/items/${withExt(file)}`);
    pushUnique(list, `/game-assets/items/${withExt(file)}`);
    pushUnique(list, `/game-assets/${withExt(file)}`);
    pushUnique(list, `/${withExt(icon)}`);
  }

  const sprite = spriteNameFromItemId(itemKey);
  const gear = isGearId(itemKey);

  if (sprite) {
    pushUnique(list, `/images/item-sprites/${sprite}.png`);
    pushUnique(list, `/images/items/${sprite}.png`);
    pushUnique(list, `/game-assets/items/${sprite}.png`);
    pushUnique(list, `/game-assets/${sprite}.png`);
  }

  // Gear/equipamentos do TBH não existem como /images/items/Item_300001.png.
  // Eles usam sprites reais como SWORD_300001.png, BOW_310001.png etc.
  // Evita dezenas de 404 no terminal e melhora a velocidade das páginas.
  if (!gear) {
    for (const id of itemIds(itemKey)) {
      pushUnique(list, `/images/items/Item_${id}.png`);
      pushUnique(list, `/images/items/${id}.png`);
      pushUnique(list, `/images/item-sprites/Item_${id}.png`);
      pushUnique(list, `/images/item-sprites/${id}.png`);
      pushUnique(list, `/game-assets/items/Item_${id}.png`);
      pushUnique(list, `/game-assets/Item_${id}.png`);
      pushUnique(list, `/game-assets/${id}.png`);
    }
  }

  return list;
}

export default function ItemSmartImage({ itemKey, iconPath, alt, className }: Props) {
  const sources = useMemo(() => buildSources(itemKey, iconPath), [itemKey, iconPath]);
  const [index, setIndex] = useState(0);
  const src = sources[index];

  if (!src) return null;

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setIndex((current) => current + 1)}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
