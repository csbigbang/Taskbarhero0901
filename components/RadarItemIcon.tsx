"use client";

import ItemSmartImage from "@/components/ItemSmartImage";

export function RadarItemIcon({ iconPath, alt, itemKey }: { iconPath?: string | null; alt: string; itemKey?: string | number | null }) {
  return (
    <span style={{ display: "inline-flex", width: 42, height: 42, alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
      <ItemSmartImage itemKey={itemKey} iconPath={iconPath} alt={alt} />
    </span>
  );
}
