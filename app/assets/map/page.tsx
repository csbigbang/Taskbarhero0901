import Link from "next/link";
import type { Metadata } from "next";
import { ItemImage } from "@/components/ItemImage";
import { getItems } from "@/lib/data";
import { clean, itemTitle, prettyCode } from "@/lib/format";
import { findItemAsset, itemHasAsset, itemIconName } from "@/lib/asset-resolver";
import { loadGameAssetManifest } from "@/lib/server-assets";
import { rarityClass } from "@/lib/rarity";

export const metadata: Metadata = {
  title: "Mapa de imagens"
};

export const dynamic = "force-dynamic";

function pct(value: number, total: number) {
  if (!total) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

export default async function AssetMapPage() {
  const [manifest, items] = await Promise.all([
    Promise.resolve(loadGameAssetManifest()),
    getItems({ limit: 10000 })
  ]);

  const rows = items.map((item) => {
    const asset = findItemAsset(manifest, item);
    const matched = Boolean(asset) || itemHasAsset(manifest, item);
    return { item, asset, matched };
  });

  const matched = rows.filter((row) => row.matched);
  const missing = rows.filter((row) => !row.matched);
  const visibleMissing = missing.slice(0, 120);
  const visibleMatched = matched.slice(0, 120);

  return (
    <section className="page-card">
      <div className="page-banner">
        <span className="banner-kicker">Bloco 2</span>
        <h1>Mapa de imagens dos itens</h1>
        <p>
          Checagem geral para saber quais itens já estão ligados aos assets exportados do jogo e quais ainda precisam de mapa manual.
        </p>
      </div>

      <div className="page-body">
        <div className="asset-summary coverage-summary">
          <div>
            <strong>{items.length.toLocaleString("pt-BR")}</strong>
            <span>itens no banco</span>
          </div>
          <div>
            <strong>{matched.length.toLocaleString("pt-BR")}</strong>
            <span>com imagem localizada</span>
          </div>
          <div>
            <strong>{pct(matched.length, items.length)}</strong>
            <span>cobertura atual</span>
          </div>
        </div>

        <div className="coverage-bar" aria-label="Cobertura de imagens">
          <span style={{ width: pct(matched.length, items.length) }} />
        </div>

        <div className="notice asset-notice" style={{ marginTop: 16 }}>
          <strong>Importante</strong>
          <span>
            Muitos itens compartilham o mesmo ícone. Então não precisa existir uma imagem diferente para cada uma das 5.944 linhas.
            O ideal é que todo item tenha pelo menos um <code>icon_path</code> resolvido para algum PNG do jogo.
          </span>
        </div>

        <div className="asset-actions-row">
          <Link className="btn" href="/assets">← Biblioteca de assets</Link>
          <Link className="btn primary" href="/items">Ver itens</Link>
        </div>

        <section className="section">
          <div className="section-title-row">
            <div>
              <span className="eyebrow">OK</span>
              <h2>Itens com imagem</h2>
            </div>
            <span className="pill">mostrando {visibleMatched.length} de {matched.length}</span>
          </div>

          <div className="asset-map-grid">
            {visibleMatched.map(({ item, asset }) => {
              const title = itemTitle(item);
              const grade = rarityClass(item.grade);
              return (
                <Link className={`asset-map-card rarity-${grade}`} key={item.item_key} href={`/items/${encodeURIComponent(item.item_key)}`}>
                  <ItemImage iconPath={itemIconName(item.icon_path, item.item_key)} alt={title} itemKey={item.item_key} size="sm" />
                  <div>
                    <strong>{title}</strong>
                    <span>{item.item_key} · {clean(item.grade)}</span>
                    <small>{asset?.url || itemIconName(item.icon_path, item.item_key)}</small>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="section">
          <div className="section-title-row">
            <div>
              <span className="eyebrow">Pendente</span>
              <h2>Itens sem imagem localizada</h2>
            </div>
            <span className="pill">mostrando {visibleMissing.length} de {missing.length}</span>
          </div>

          {visibleMissing.length ? (
            <div className="missing-table">
              <div className="missing-head">
                <span>Item</span>
                <span>Icon path esperado</span>
                <span>Tipo</span>
                <span>Raridade</span>
              </div>
              {visibleMissing.map(({ item }) => (
                <Link className="missing-row" key={item.item_key} href={`/items/${encodeURIComponent(item.item_key)}`}>
                  <span>{itemTitle(item)} <em>#{item.item_key}</em></span>
                  <span>{itemIconName(item.icon_path, item.item_key)}</span>
                  <span>{prettyCode(item.item_type)}</span>
                  <span>{clean(item.grade)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="notice">Todos os itens testados possuem imagem localizada.</div>
          )}
        </section>
      </div>
    </section>
  );
}
