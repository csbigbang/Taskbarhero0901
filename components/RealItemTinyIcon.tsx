"use client";

import ItemSmartImage from "@/components/ItemSmartImage";

type Props = {
  iconPath?: string | null;
  itemKey?: string | number | null;
  alt: string;
  size?: "sm" | "md" | "lg";
};

export function RealItemTinyIcon({ iconPath, itemKey, alt, size = "md" }: Props) {
  return (
    <span className={`farm-real-icon farm-real-icon-${size}`}>
      <ItemSmartImage itemKey={itemKey} iconPath={iconPath} alt={alt} />
    </span>
  );
}
