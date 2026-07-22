"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { RealMenuIcon } from "@/components/RealMenuIcon";

const groups = [
  {
    title: "TBH Database",
    items: [
      { href: "/database", label: "Visão Geral", icon: "/tbh-real/nav/nav-database.png", count: "base" },
      { href: "/items", label: "Itens", icon: "/tbh-real/nav/nav-items.png", count: "5.944" },
      { href: "/gear", label: "Equipamentos", icon: "/tbh-real/nav/nav-gear.png", count: "5.760" },
      { href: "/drops", label: "Drops", icon: "/tbh-real/nav/nav-drops.png", count: "44.757" },
      { href: "/stages", label: "Fases", icon: "/tbh-real/nav/nav-stages.png", count: "120" },
      { href: "/monsters", label: "Monstros", icon: "/tbh-real/nav/nav-monsters.png", count: "61" },
      { href: "/grades", label: "Raridades", icon: "/tbh-real/nav/nav-rarities.png", count: "10" },
      { href: "/heroes", label: "Heróis", icon: "/game-assets/heroes/Hero_101.png", count: "6" },
    ],
  },
  {
    title: "Ferramentas",
    items: [
      { href: "/market", label: "Mercado BR", icon: "/tbh-real/nav/nav-market.png", count: "R$" },
      { href: "/farm/optimizer", label: "Valor de Farm", icon: "/tbh-real/nav/nav-farm.png", count: "rota" },
      { href: "/radar", label: "Radar do Dia", icon: "/tbh-real/ui/Icon_Demon_Active.png", count: "agora" },
      { href: "/builds", label: "Builds", icon: "/tbh-real/nav/nav-builds.png", count: "planos" },
      { href: "/doctor", label: "Análise", icon: "/tbh-real/nav/nav-analysis.png", count: "guia" },
      { href: "/compare", label: "Comparador", icon: "/tbh-real/nav/nav-compare.png", count: "A/B" },
      { href: "/cube", label: "Cube", icon: "/tbh-real/nav/nav-cube.png", count: "simular" },
      { href: "/status", label: "Situação", icon: "/tbh-real/nav/nav-status.png", count: "online" },
    ],
  },
  {
    title: "Acesso rápido",
    items: [
      { href: "/drops?source=NORMAL_MONSTER_BOX", label: "Baú Normal", icon: "/images/items/Item_910011.png", count: "item" },
      { href: "/drops?source=BOSS_MONSTER_BOX", label: "Baú de Chefe", icon: "/images/items/Item_920011.png", count: "chefe" },
      { href: "/items?type=MATERIAL", label: "Materiais", icon: "/images/items/Item_111001.png", count: "mat." },
      { href: "/gear?grade=DIVINE", label: "Itens Divinos", icon: "/tbh-real/nav/nav-rarities.png", count: "ouro" },
    ],
  },
];

function hrefToParts(href: string) {
  const [path, rawQuery = ""] = href.split("?");
  const query = new URLSearchParams(rawQuery);
  return { path, query };
}

function hasSameQuery(target: URLSearchParams, current: URLSearchParams) {
  const targetEntries = Array.from(target.entries());
  if (targetEntries.length === 0) return true;
  return targetEntries.every(([key, value]) => current.get(key) === value);
}

function isActive(pathname: string, searchParams: URLSearchParams, href: string) {
  const { path, query } = hrefToParts(href);
  if (pathname !== path) return false;
  return hasSameQuery(query, searchParams);
}

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <aside className="sidebar tbhdb-sidebar" aria-label="Menu lateral do TBH Database">
      <div className="sidebar-card sidebar-title-card tbhdb-sidebar-brand">
        <img src="/tbh-real/branding/LogoTextImage_TBH.png" alt="Task Bar Hero" loading="eager" decoding="async" />
        <strong>TBH Database</strong>
        <span>Feito por fãs · sem afiliação</span>
      </div>

      {groups.map((group) => (
        <nav className="sidebar-group tbhdb-sidebar-group" key={group.title} aria-label={group.title}>
          <h3>{group.title}</h3>
          {group.items.map((item) => {
            const active = isActive(pathname, searchParams, item.href);
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={active ? "sidebar-link tbhdb-sidebar-link active" : "sidebar-link tbhdb-sidebar-link"}>
                <span className="sidebar-icon tbhdb-sidebar-icon">
                  <RealMenuIcon src={item.icon} alt="" />
                </span>
                <span>{item.label}</span>
                <em>{item.count}</em>
              </Link>
            );
          })}
        </nav>
      ))}
    </aside>
  );
}
