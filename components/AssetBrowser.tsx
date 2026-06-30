"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";

export type GameAsset = {
  id: string;
  name: string;
  category: string;
  url: string;
  originalPath: string;
  sizeBytes: number;
};

export type GameAssetManifest = {
  generatedAt: string | null;
  sourceRoot: string | null;
  total: number;
  counts: Record<string, number>;
  assets: GameAsset[];
};

const labels: Record<string, string> = {
  items: "Itens / Equipamentos",
  skills: "Skills / Buffs",
  heroes: "Heróis / Pets",
  monsters: "Monstros",
  stages: "Fases / Mapas",
  ui: "Interface",
  branding: "Branding",
  misc: "Outros"
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AssetBrowser({ manifest }: { manifest: GameAssetManifest }) {
  const categories = useMemo(() => Object.keys(manifest.counts).sort(), [manifest.counts]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [limit, setLimit] = useState(240);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return manifest.assets.filter((asset) => {
      const matchCategory = category === "all" || asset.category === category;
      const matchQuery = !q || `${asset.name} ${asset.originalPath} ${asset.category}`.toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [manifest.assets, query, category]);

  const visible = filtered.slice(0, limit);

  return (
    <div className="asset-browser">
      <div className="asset-summary">
        <div>
          <strong>{manifest.total.toLocaleString("pt-BR")}</strong>
          <span>imagens importadas</span>
        </div>
        <div>
          <strong>{categories.length}</strong>
          <span>categorias</span>
        </div>
        <div>
          <strong>{manifest.generatedAt ? new Date(manifest.generatedAt).toLocaleDateString("pt-BR") : "-"}</strong>
          <span>última importação</span>
        </div>
      </div>

      <div className="asset-tools">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar imagem: Item_110001, skill, hero, zombie, ui..."
        />
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">Todas categorias</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{labels[cat] || cat} ({manifest.counts[cat]})</option>
          ))}
        </select>
      </div>

      <div className="asset-category-row">
        <button className={category === "all" ? "asset-tab active" : "asset-tab"} onClick={() => setCategory("all")}>
          Todas <em>{manifest.total}</em>
        </button>
        {categories.map((cat) => (
          <button key={cat} className={category === cat ? "asset-tab active" : "asset-tab"} onClick={() => setCategory(cat)}>
            {labels[cat] || cat} <em>{manifest.counts[cat]}</em>
          </button>
        ))}
      </div>

      <div className="asset-results-line">
        Mostrando {visible.length.toLocaleString("pt-BR")} de {filtered.length.toLocaleString("pt-BR")} imagens filtradas.
      </div>

      <div className="asset-grid">
        {visible.map((asset) => (
          <article className="asset-card" key={asset.id}>
            <div className="asset-thumb">
              <img src={asset.url} alt={asset.name} loading="lazy" />
            </div>
            <div className="asset-info">
              <strong title={asset.name}>{asset.name}</strong>
              <span>{labels[asset.category] || asset.category}</span>
              <small title={asset.originalPath}>{asset.originalPath}</small>
              <em>{formatBytes(asset.sizeBytes)}</em>
            </div>
            <div className="asset-actions">
              <CopyButton value={asset.url} label="Copiar URL" />
            </div>
          </article>
        ))}
      </div>

      {visible.length < filtered.length && (
        <button className="btn primary asset-more" onClick={() => setLimit((value) => value + 240)}>
          Carregar mais 240 imagens
        </button>
      )}
    </div>
  );
}
