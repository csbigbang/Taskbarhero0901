import Link from "next/link";
import { GameAssetImage } from "@/components/GameAssetImage";
import { compactNumber } from "@/lib/format";

type Props = {
  stats: {
    items: number;
    drops: number;
    stages: number;
  };
};

const quickIcons = [
  { name: "Item_110001", label: "Itens", url: "/images/items/Item_110001.png" },
  { name: "Item_111001", label: "Materiais", url: "/images/items/Item_111001.png" },
  { name: "Item_910011", label: "Drops", url: "/images/items/Item_910011.png" },
  { name: "Item_920011", label: "Chefe", url: "/images/items/Item_920011.png" },
  { name: "Item_160003", label: "Mercado", url: "/images/items/Item_160003.png" },
  { name: "Item_116002", label: "Raridades", url: "/images/items/Item_116002.png" }
];

export function GameHomeShowcase({ stats }: Props) {
  return (
    <section className="game-home-showcase fan-home">
      <div className="panel fan-hero-card">
        <span className="eyebrow no-margin">Fan site BR</span>
        <h1 className="hero-title fan-title">
          Task Bar Hero <span className="accent">Central BR</span>
        </h1>
        <p className="hero-subtitle">
          Uma central brasileira para consultar drops, itens, raridades, mercado em R$, rotas de farm e rankings úteis.
        </p>

        <form className="home-search fan-home-search" action="/drops" method="get">
          <input name="q" placeholder="Buscar item, fase, boss, material, raridade ou ID..." autoComplete="off" />
          <button className="btn primary" type="submit">Buscar</button>
        </form>

        <div className="hero-actions fan-actions">
          <Link className="btn primary" href="/drops">Procurar drops</Link>
          <Link className="btn" href="/items">Ver itens</Link>
          <Link className="btn" href="/market">Mercado BR</Link>
          <Link className="btn" href="/farm">Valor de Farm</Link>
        </div>

        <div className="fan-stat-row">
          <div className="fan-stat"><strong>{compactNumber(stats.items)}</strong><span>itens</span></div>
          <div className="fan-stat"><strong>{compactNumber(stats.drops)}</strong><span>drops</span></div>
          <div className="fan-stat"><strong>{compactNumber(stats.stages)}</strong><span>fases</span></div>
          <div className="fan-stat"><strong>BRL</strong><span>mercado</span></div>
        </div>
      </div>

      <div className="panel fan-tools-card">
        <div className="fan-window-title">Ferramentas do jogador</div>
        <div className="fan-icon-strip">
          {quickIcons.map((asset) => (
            <Link href={asset.label === "Drops" ? "/drops" : asset.label === "Mercado" ? "/market" : asset.label === "Raridades" ? "/grades" : "/items"} className="fan-tool-slot" key={asset.name} title={asset.label}>
              <GameAssetImage
                name={asset.name}
                alt={asset.label}
                categories={["items"]}
                className="fan-tool-img"
                extraUrls={[asset.url]}
                eager
              />
              <span>{asset.label}</span>
            </Link>
          ))}
        </div>
        <div className="fan-mini-note">
          Visual limpo, sem placeholders: imagem só aparece quando existe asset real importado.
        </div>
      </div>
    </section>
  );
}
