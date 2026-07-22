"use client";

import { useMemo, useState } from "react";
import { itemAssetSources } from "@/lib/item-asset-paths";

type Props = {
  iconPath?: string | null;
  alt: string;
  itemKey: string;
  size?: "sm" | "md" | "lg";
};

export function ItemImage({ iconPath, alt, itemKey, size = "md" }: Props) {
  const sources = useMemo(() => itemAssetSources({ itemKey, iconPath }), [iconPath, itemKey]);
  const [index, setIndex] = useState(0);
  const src = sources[index];

  // Sem asset real: não mostra placeholder quebrado.
  if (!src) return null;

  return (
    <div className={`item-icon item-icon-${size}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={() => setIndex((current) => current + 1)}
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}
