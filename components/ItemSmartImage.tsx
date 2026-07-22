"use client";

import { useMemo, useState } from "react";
import { itemAssetSources } from "@/lib/item-asset-paths";

type Props = {
  itemKey?: string | number | null;
  iconPath?: string | null;
  alt: string;
  className?: string;
};

export default function ItemSmartImage({ itemKey, iconPath, alt, className }: Props) {
  const sources = useMemo(() => itemAssetSources({ itemKey, iconPath }), [itemKey, iconPath]);
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
