"use client";

import { useState } from "react";
import styles from "./ItemDetailActions.module.css";

type Props = {
  itemKey: string;
  itemName: string;
  priceLabel: string;
  score: number;
};

export default function ItemDetailActions({ itemKey, itemName, priceLabel, score }: Props) {
  const [copied, setCopied] = useState(false);

  async function copySummary() {
    const text = [
      `${itemName}`,
      `ID: ${itemKey}`,
      `Pontuação: ${score}/100`,
      `Preço: ${priceLabel}`,
      `${window.location.origin}/items/${encodeURIComponent(itemKey)}`,
    ].join("\n");

    await navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className={styles.row}>
      <a className={styles.action} href={`/compare?item=${encodeURIComponent(itemKey)}`}>Comparar</a>
      <a className={styles.action} href={`/drops?item=${encodeURIComponent(itemKey)}`}>Ver drops</a>
      <a className={styles.action} href={`/farm/optimizer?item=${encodeURIComponent(itemKey)}`}>Farmar</a>
      <a className={styles.action} href={`/inventory?item=${encodeURIComponent(itemKey)}`}>Inventário</a>
      <button className={styles.action} type="button" onClick={copySummary}>{copied ? "Copiado" : "Copiar"}</button>
    </div>
  );
}
