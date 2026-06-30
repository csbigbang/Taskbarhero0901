"use client";

import { useState } from "react";

function cleanIconName(value?: string | null) {
  return String(value ?? "").trim().replace(/[^a-zA-Z0-9_-]/g, "");
}

export function RadarItemIcon({ iconPath, alt }: { iconPath?: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  const icon = cleanIconName(iconPath);

  if (!icon || failed) return null;

  return (
    <span style={{ display: "inline-flex", width: 42, height: 42, alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
      <img
        src={`/images/items/${icon}.png`}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        style={{ maxWidth: "100%", maxHeight: "100%", imageRendering: "pixelated" }}
      />
    </span>
  );
}
