"use client";

import { useMemo, useState } from "react";

type Props = {
  iconPath?: string | null;
  alt: string;
  itemKey: string;
  size?: "sm" | "md" | "lg";
};

function safeIconName(value?: string | null) {
  if (!value) return "";
  return value.trim().replace(/[^a-zA-Z0-9_-]/g, "");
}

export function ItemImage({ iconPath, alt, itemKey, size = "md" }: Props) {
  const [failed, setFailed] = useState(false);
  const src = useMemo(() => {
    const iconName = safeIconName(iconPath);
    if (iconName) return `/images/items/${iconName}.png`;
    const key = safeIconName(itemKey);
    if (key) return `/images/items/Item_${key}.png`;
    return "";
  }, [iconPath, itemKey]);

  // Sem imagem real: não mostra placeholder.
  if (!src || failed) return null;

  return (
    <div className={`item-icon item-icon-${size}`}>
      <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />
    </div>
  );
}
