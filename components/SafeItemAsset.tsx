"use client";

import { useMemo, useState } from "react";

type AnyItem = Record<string, any> | null | undefined;

type SafeItemAssetProps = {
  item?: AnyItem;
  itemKey?: string | number | null;
  id?: string | number | null;
  code?: string | number | null;
  iconPath?: string | null;
  icon_path?: string | null;
  name?: string | null;
  alt?: string;
  className?: string;
  imgClassName?: string;
  size?: number;
  width?: number;
  height?: number;
  hideWhenMissing?: boolean;
};

const gearPrefixes: Array<[number, string]> = [
  [630000, "BRACER"],
  [620000, "RING"],
  [610000, "EARRING"],
  [600000, "AMULET"],
  [530000, "BOOTS"],
  [520000, "GLOVES"],
  [510000, "ARMOR"],
  [500000, "HELMET"],
  [450000, "HATCHET"],
  [440000, "BOLT"],
  [430000, "TOME"],
  [420000, "ORB"],
  [410000, "ARROW"],
  [400000, "SHIELD"],
  [350000, "SCEPTER"],
  [340000, "CROSSBOW"],
  [330000, "AXE"],
  [320000, "STAFF"],
  [310000, "BOW"],
  [300000, "SWORD"],
];

function asString(value: any): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeIconPath(path: string): string[] {
  if (!path) return [];
  const clean = path.replaceAll("\\\\", "/").replace(/^public\//, "");
  const withSlash = clean.startsWith("/") ? clean : `/${clean}`;
  const out = [withSlash];
  if (!/\.(png|webp|gif|jpg|jpeg)$/i.test(withSlash)) {
    out.push(`${withSlash}.png`, `${withSlash}.webp`);
  }
  return out;
}

function gearSpriteCandidates(rawKey: string): string[] {
  const key = Number(rawKey);
  if (!Number.isFinite(key)) return [];

  const found = gearPrefixes.find(([base]) => key >= base && key < base + 10000);
  if (!found) return [];

  const [base, prefix] = found;
  const index = Math.max(1, Math.floor((key - base) / 1000) + 1);
  const spriteId = `${base + index}`;

  return [
    `/images/item-sprites/${prefix}_${spriteId}.png`,
    `/images/items/${prefix}_${spriteId}.png`,
    `/game-assets/items/${prefix}_${spriteId}.png`,
    `/images/item-sprites/${prefix}_${rawKey}.png`,
    `/images/items/${prefix}_${rawKey}.png`,
  ];
}

function buildCandidates(props: SafeItemAssetProps): string[] {
  const item = props.item ?? {};
  const rawKey =
    asString(props.itemKey) ||
    asString(props.id) ||
    asString(props.code) ||
    asString(item.item_key) ||
    asString(item.ItemKey) ||
    asString(item.item_id) ||
    asString(item.id) ||
    asString(item.key) ||
    asString(item.code);

  const icon =
    asString(props.iconPath) ||
    asString(props.icon_path) ||
    asString(item.icon_path) ||
    asString(item.iconPath) ||
    asString(item.asset_path) ||
    asString(item.assetPath);

  const candidates: string[] = [];
  candidates.push(...normalizeIconPath(icon));

  if (rawKey) {
    candidates.push(...gearSpriteCandidates(rawKey));
    candidates.push(
      `/images/items/Item_${rawKey}.png`,
      `/images/items/${rawKey}.png`,
      `/game-assets/items/Item_${rawKey}.png`,
      `/game-assets/Item_${rawKey}.png`,
    );
  }

  return Array.from(new Set(candidates.filter(Boolean)));
}

export function SafeItemAsset(props: SafeItemAssetProps) {
  const candidates = useMemo(() => buildCandidates(props), [props.item, props.itemKey, props.id, props.code, props.iconPath, props.icon_path]);
  const [index, setIndex] = useState(0);

  const width = props.width ?? props.size ?? 42;
  const height = props.height ?? props.size ?? 42;
  const src = candidates[index];

  if (!src) {
    if (props.hideWhenMissing !== false) return null;
    return <span className={props.className} style={{ width, height, display: "inline-block" }} />;
  }

  return (
    <img
      src={src}
      alt={props.alt ?? props.name ?? asString(props.item?.name) ?? "item"}
      className={props.imgClassName ?? props.className}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      style={{ objectFit: "contain", imageRendering: "pixelated" }}
      onError={() => {
        setIndex((current) => {
          const next = current + 1;
          return next < candidates.length ? next : current;
        });
      }}
    />
  );
}

export default SafeItemAsset;
