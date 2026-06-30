"use client";

import { useState } from "react";

type HomeFeatureIconProps = {
  src: string;
  alt?: string;
  size?: "sm" | "md" | "lg";
};

export function HomeFeatureIcon({ src, alt = "", size = "md" }: HomeFeatureIconProps) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;

  return (
    <span className={`homeFeatureIcon homeFeatureIcon-${size}`} aria-hidden={alt ? undefined : true}>
      <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />
    </span>
  );
}
