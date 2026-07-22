"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GlobalSearch } from "@/components/GlobalSearch";
import { RealMenuIcon } from "@/components/RealMenuIcon";

const links = [
  { href: "/database", label: "Visão geral", icon: "/tbh-real/nav/nav-database.png" },
  { href: "/items", label: "Itens", icon: "/tbh-real/nav/nav-items.png" },
  { href: "/gear", label: "Equipamentos", icon: "/tbh-real/nav/nav-gear.png" },
  { href: "/drops", label: "Drops", icon: "/tbh-real/nav/nav-drops.png" },
  { href: "/stages", label: "Fases", icon: "/tbh-real/nav/nav-stages.png" },
  { href: "/monsters", label: "Monstros", icon: "/tbh-real/nav/nav-monsters.png" },
  { href: "/market", label: "Mercado", icon: "/tbh-real/nav/nav-market.png" },
  { href: "/grades", label: "Raridades", icon: "/tbh-real/nav/nav-rarities.png" },
];

export function SiteHeader({ siteName }: { siteName: string }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="header tbhdb-header">
      <div className="header-inner tbhdb-header-inner">
        <Link href="/" className="logo tbhdb-logo" aria-label="Voltar para o início do TBH Database">
          <span className="tbhdb-logo-art">
            <img src="/tbh-real/branding/LogoTextImage_TBH.png" alt="Task Bar Hero" loading="eager" decoding="async" />
          </span>
          <span className="tbhdb-logo-copy">
            <strong>{siteName || "TBH Database"}</strong>
            <em>Fan site BR não oficial</em>
          </span>
        </Link>

        <div className="tbhdb-search-wrap">
          <GlobalSearch />
        </div>

        <nav className="links tbhdb-nav" aria-label="Menu principal">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link key={link.href} href={link.href} className={active ? "tbhdb-nav-link active" : "tbhdb-nav-link"}>
                <span className="tbhdb-nav-icon">
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
