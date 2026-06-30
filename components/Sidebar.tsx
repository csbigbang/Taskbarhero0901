"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { RealMenuIcon } from "@/components/RealMenuIcon";

const groups = [
  {
    title: "Banco do jogo",
    items: [
      { href: "/database", label: "Banco de Dados", icon: "/images/rarities/divine.png", count: "tudo" },
      { href: "/heroes", label: "Heróis", icon: "/game-assets/heroes/Hero_101.png", count: "6" },
      { href: "/gear", label: "Equipamentos", icon: "/images/item-sprites/SWORD_300001.png", count: "5.760" },
      { href: "/items", label: "Itens", icon: "/images/items/Item_110001.png", count: "5.944" },
      { href: "/drops", label: "Drops", icon: "/images/items/Item_910011.png", count: "44.757" },
      { href: "/stages", label: "Fases", icon: "/images/items/Item_920011.png", count: "120" },
      { href: "/monsters", label: "Monstros", icon: "/images/items/Item_920011.png", count: "61" },
      { href: "/grades", label: "Raridades", icon: "/images/rarities/divine.png", count: "10" },
    ],
  },
  {
    title: "Ferramentas BR",
    items: [
      { href: "/status", label: "Situação do Jogo", icon: "/images/items/Item_111004.png", count: "ao vivo" },
      { href: "/radar", label: "Radar do Dia", icon: "/images/items/Item_160002.png", count: "destaque" },
      { href: "/doctor", label: "Analisador de Builds", icon: "/images/items/Item_116002.png", count: "pro" },
      { href: "/progress", label: "Progressão", icon: "/images/items/Item_112005.png", count: "rota" },
      { href: "/builds", label: "Planejador de Builds", icon: "/images/items/Item_115004.png", count: "build" },
      { href: "/compare", label: "Comparador", icon: "/images/items/Item_112001.png", count: "vs" },
      { href: "/farm/optimizer", label: "Otimizador de Farm", icon: "/images/items/Item_160002.png", count: "pro" },
      { href: "/cube", label: "Calculadora do Cube", icon: "/images/items/Item_100001.png", count: "cálc." },
      { href: "/inventory", label: "Inventário", icon: "/images/items/Item_111001.png", count: "R$" },
      { href: "/save", label: "Analisador de Salvamento", icon: "/images/items/Item_112001.png", count: "novo" },
      { href: "/market", label: "Mercado", icon: "/images/items/Item_100001.png", count: "R$" },
      { href: "/ranking", label: "Ranking", icon: "/images/items/Item_115004.png", count: "top" },
    ],
  },
  {
    title: "Farm rápido",
    items: [
      { href: "/drops?source=NORMAL_MONSTER_BOX", label: "Monstros", icon: "/images/items/Item_910011.png", count: "baú" },
      { href: "/drops?source=BOSS_MONSTER_BOX", label: "Chefe", icon: "/images/items/Item_920011.png", count: "baú" },
      { href: "/items?type=MATERIAL", label: "Materiais", icon: "/images/items/Item_111001.png", count: "mat." },
      { href: "/gear", label: "Visual de Equipamentos", icon: "/images/item-sprites/SWORD_300001.png", count: "equip." },
    ],
  },
  {
    title: "Raridades",
    items: [
      { href: "/gear?grade=DIVINE", label: "Divino", icon: "/images/rarities/divine.png", count: "ouro" },
      { href: "/gear?grade=COSMIC", label: "Cósmico", icon: "/images/rarities/cosmic.png", count: "rosa" },
      { href: "/gear?grade=LEGENDARY", label: "Lendário", icon: "/images/rarities/legendary.png", count: "lar." },
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
    <aside className="sidebar tbh-pro-sidebar pixel-sidebar" aria-label="Menu lateral">
      <div className="sidebar-card sidebar-title-card tbh-pro-sidebar-title pixel-sidebar-title-card">
        <span className="tbh-pro-sidebar-medal">
          <RealMenuIcon src="/images/items/Item_100001.png" alt="TBH BR" />
        </span>
        <div>
          <strong>Task Bar Hero</strong>
          <span>Banco BR</span>
        </div>
      </div>

      {groups.map((group) => (
        <nav className="sidebar-group pixel-sidebar-group" key={group.title} aria-label={group.title}>
          <h3>{group.title}</h3>
          {group.items.map((item) => {
            const active = isActive(pathname, searchParams, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={active ? "sidebar-link pixel-sidebar-btn active" : "sidebar-link pixel-sidebar-btn"}
              >
                <span className="sidebar-icon tbh-pro-menu-icon pixel-sidebar-icon">
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
