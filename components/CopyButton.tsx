"use client";

import { useState } from "react";

export function CopyButton({ value, label = "Copiar ID" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1300);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button className="pill pill-button" type="button" onClick={copy} title={value}>
      {copied ? "Copiado!" : label}
    </button>
  );
}
