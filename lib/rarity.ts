export const RARITIES = [
  { key: "COMMON", pt: "Comum", color: "#9ca3af", desc: "Base inicial do jogo, comum em fases e baús." },
  { key: "UNCOMMON", pt: "Incomum", color: "#4ade80", desc: "Um degrau acima do comum, útil para progressão." },
  { key: "RARE", pt: "Raro", color: "#60a5fa", desc: "Itens com valor melhor e menor frequência." },
  { key: "LEGENDARY", pt: "Lendário", color: "#f59e0b", desc: "Itens fortes, bons para builds e farm avançado." },
  { key: "IMMORTAL", pt: "Imortal", color: "#ef4444", desc: "Raridade alta para equipamentos e recompensas especiais." },
  { key: "ARCANA", pt: "Arcana", color: "#a855f7", desc: "Raridade mágica, acima das linhas tradicionais." },
  { key: "BEYOND", pt: "Superior", color: "#22d3ee", desc: "Itens acima do padrão, já na faixa premium de raridade." },
  { key: "CELESTIAL", pt: "Celestial", color: "#38bdf8", desc: "Raridade celestial, visual forte e foco em progressão alta." },
  { key: "DIVINE", pt: "Divino", color: "#fde047", desc: "Uma das raridades mais desejadas para farm e builds." },
  { key: "COSMIC", pt: "Cósmico", color: "#f472b6", desc: "Topo de raridade do banco, foco em itens especiais e endgame." }
] as const;

export type RarityKey = typeof RARITIES[number]["key"];

export function rarityClass(value?: string | null) {
  const key = String(value || "unknown").trim().toLowerCase();
  return key.replace(/[^a-z0-9_-]/g, "") || "unknown";
}

export function rarityInfo(value?: string | null) {
  const key = String(value || "").trim().toUpperCase();
  return RARITIES.find((rarity) => rarity.key === key) ?? null;
}
