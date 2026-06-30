import Link from "next/link";
import { GameAssetImage } from "@/components/GameAssetImage";

const features = [
  {
    href: "/items",
    title: "Itens e Equipamentos",
    text: "Catálogo visual com raridade, tipo, parte, nível e busca por nome/ID.",
    asset: "Icon_Gear_Active"
  },
  {
    href: "/drops",
    title: "Localizador de Drops",
    text: "Descubra onde cada item cai e qual fonte gera cada recompensa.",
    asset: "Chest_NormalBoss"
  },
  {
    href: "/stages",
    title: "Fases e Rotas",
    text: "Consulte fases, acts e recompensas por fonte de drop.",
    asset: "Icon_Portal_NormalStage"
  },
  {
    href: "/market",
    title: "Mercado BR",
    text: "Preços cacheados, itens valiosos e custo-benefício em R$.",
    asset: "Icon_Gold"
  },
  {
    href: "/farm",
    title: "Valor de Farm",
    text: "Ranking de fases com maior valor estimado por drop.",
    asset: "StageIcon_Occupied_Base"
  },
  {
    href: "/ranking",
    title: "Rankings inteligentes",
    text: "Veja destaques por valor, raridade, utilidade e potencial de farm.",
    asset: "AchievementIcon"
  }
];

export function GameFeatureHub() {
  return (
    <div className="real-feature-grid">
      {features.map((feature) => (
        <Link className="real-feature-card" href={feature.href} key={feature.href}>
          <div className="real-feature-icon-wrap">
            <GameAssetImage
              name={feature.asset}
              alt={feature.title}
              className="real-feature-icon"
              fallbackName="★"
            />
          </div>
          <div>
            <strong>{feature.title}</strong>
            <p>{feature.text}</p>
          </div>
          <span className="real-feature-arrow">→</span>
        </Link>
      ))}
    </div>
  );
}
