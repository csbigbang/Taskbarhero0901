"use client";

import { useMemo, useState } from "react";
import { itemAssetSources } from "@/lib/item-asset-paths";

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

function asString(value: any): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function buildCandidates(props: SafeItemAssetProps): string[] {
  const item = props.item ?? {};
  const itemKey =
    asString(props.itemKey) ||
    asString(props.id) ||
    asString(props.code) ||
    asString(item.item_key) ||
    asString(item.ItemKey) ||
    asString(item.item_id) ||
    asString(item.id) ||
    asString(item.key) ||
    asString(item.code);

  const iconPath =
    asString(props.iconPath) ||
    asString(props.icon_path) ||
    asString(item.icon_path) ||
    asString(item.iconPath) ||
    asString(item.asset_path) ||
    asString(item.assetPath);

  return itemAssetSources({ itemKey, iconPath });
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
