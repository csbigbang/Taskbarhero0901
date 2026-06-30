import { notFound } from "next/navigation";
import { HeroesWikiClient } from "@/components/HeroesWikiClient";
import { HEROES, getHero } from "@/lib/heroes-data";

export const dynamic = "force-static";

type PageProps = {
  params: Promise<{ heroKey: string }>;
};

export function generateStaticParams() {
  return HEROES.map((hero) => ({ heroKey: hero.key }));
}

export async function generateMetadata({ params }: PageProps) {
  const { heroKey } = await params;
  const hero = getHero(heroKey);
  if (!hero) return { title: "Hero não encontrado" };
  return {
    title: `${hero.name} - TBH Banco de Dados BR`,
    description: hero.description,
  };
}

export default async function HeroDetailPage({ params }: PageProps) {
  const { heroKey } = await params;
  const hero = getHero(heroKey);
  if (!hero) notFound();
  return <HeroesWikiClient heroes={HEROES} initialHero={hero.key} />;
}
