import { HeroesWikiClient } from "@/components/HeroesWikiClient";
import { HEROES } from "@/lib/heroes-data";

export const dynamic = "force-static";

export default function HeroesPage() {
  return <HeroesWikiClient heroes={HEROES} />;
}
