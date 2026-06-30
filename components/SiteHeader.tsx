"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GlobalSearch } from "@/components/GlobalSearch";
import { RealMenuIcon } from "@/components/RealMenuIcon";

const links = [
  { href: "/heroes", label: "Heróis", icon: "/game-assets/heroes/Hero_101.png" },
  { href: "/gear", label: "Equipamentos", icon: "/images/item-sprites/SWORD_300001.png" },
  { href: "/items", label: "Itens", icon: "/images/items/Item_110001.png" },
  { href: "/drops", label: "Drops", icon: "/images/items/Item_910011.png" },
  { href: "/stages", label: "Fases", icon: "/images/items/Item_920011.png" },
  { href: "/monsters", label: "Monstros", icon: "/images/items/Item_920011.png" },
  { href: "/market", label: "Mercado", icon: "/images/items/Item_100001.png" },
  { href: "/radar", label: "Radar", icon: "/images/items/Item_160002.png" },
  { href: "/database", label: "Banco", icon: "/images/rarities/divine.png" },
  { href: "/status", label: "Situação", icon: "/images/items/Item_111004.png" },
  { href: "/builds", label: "Builds", icon: "/images/items/Item_115004.png" },
  { href: "/doctor", label: "Análise", icon: "/images/items/Item_116002.png" },
  { href: "/progress", label: "Progresso", icon: "/images/items/Item_112005.png" },
  { href: "/farm", label: "Farm", icon: "/images/items/Item_160002.png" },
  { href: "/save", label: "Salvamento", icon: "/images/items/Item_112001.png" },
];

export function SiteHeader({ siteName }: { siteName: string }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="header tbh-pro-header pixel-top-header">
      <div className="header-inner tbh-pro-header-inner">
        <Link href="/" className="logo tbh-pro-logo pixel-logo-button" aria-label="Voltar para a página inicial">
          <span className="tbh-pro-logo-icon">
            <RealMenuIcon src="/images/items/Item_100001.png" alt="TBH BR" />
          </span>
          <span className="tbh-pro-logo-text">
            <strong>TBH BR</strong>
            <em>Banco BR</em>
          </span>
        </Link>

        <div className="tbh-pro-search-wrap pixel-search-frame">
          <GlobalSearch />
        </div>

        <nav className="links tbh-pro-nav pixel-main-nav" aria-label="Menu principal">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? "pixel-asset-btn active" : "pixel-asset-btn"}
                data-active={active ? "true" : "false"}
              >
                <span className="pixel-asset-btn-icon">
                  <RealMenuIcon src={link.icon} alt="" />
                </span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
