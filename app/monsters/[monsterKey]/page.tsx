import { Suspense } from "react";
import { MonsterBestiary } from "@/components/MonsterBestiary";
import { getMonsterByKey } from "@/lib/monster-codex-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ monsterKey: string }> }) {
  const { monsterKey } = await params;
  const monster = getMonsterByKey(monsterKey);
  return {
    title: monster ? `${monster.namePt} | Monstros Pro` : "Monstro | TBH Banco de Dados BR",
    description: monster ? `Estatísticas, modos, fases e aparições de ${monster.namePt}.` : "Detalhes do monstro.",
  };
}

export default async function MonsterDetailPage({ params }: { params: Promise<{ monsterKey: string }> }) {
  const { monsterKey } = await params;
  return (
    <Suspense fallback={null}>
      <MonsterBestiary initialMonsterKey={Number(monsterKey)} />
    </Suspense>
  );
}
