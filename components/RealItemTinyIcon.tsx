"use client";

import { useState } from "react";

type Props = {
  iconPath?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg";
};

function cleanIconName(value?: string | null) {
  if (!value) return "";
  return value.trim().replace(/[^a-zA-Z0-9_-]/g, "");
}

export function RealItemTinyIcon({ iconPath, alt, size = "md" }: Props) {
  const [hidden, setHidden] = useState(false);
  const icon = cleanIconName(iconPath);

  if (!icon || hidden) return null;

  return (
    <span className={`farm-real-icon farm-real-icon-${size}`}>
      <img src={`/images/items/${icon}.png`} alt={alt} loading="lazy" onError={() => setHidden(true)} />
    </span>
  );
}
