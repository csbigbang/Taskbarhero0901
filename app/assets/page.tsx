import Link from "next/link";
import type { Metadata } from "next";
import { AssetBrowser } from "@/components/AssetBrowser";
import { loadGameAssetManifest } from "@/lib/server-assets";

export const metadata: Metadata = {
  title: "Assets do jogo"
};

export default function AssetsPage() {
  const manifest = loadGameAssetManifest();

  return (
    <section className="page-card">
      <div className="page-banner">
        <span className="banner-kicker">Biblioteca visual</span>
        <h1>Assets do jogo</h1>
        <p>
          Galeria interna para conferir todas as imagens exportadas do jogo antes de usar em itens,
          builds, mercado, skills, monstros e páginas especiais.
        </p>
      </div>

      <div className="page-body">
        {manifest.total <= 0 ? (
          <div className="notice asset-notice">
            <strong>Nenhum asset importado ainda.</strong>
            <span>Rode no terminal:</span>
            <code>npm run assets:import "C:\\imagens-thb\\Assets"</code>
          </div>
        ) : (
          <>
            <div className="asset-actions-row">
              <Link className="btn primary" href="/assets/map">Checar imagens dos itens</Link>
              <span className="pill">Use este mapa antes dos sistemas de build, mercado e farm.</span>
            </div>
            <AssetBrowser manifest={manifest} />
          </>
        )}
      </div>
    </section>
  );
}
