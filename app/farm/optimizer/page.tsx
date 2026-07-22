import Link from "next/link";
import styles from "@/components/FarmOptimizer.module.css";
import { EmptyState } from "@/components/EmptyState";
import { RealItemTinyIcon } from "@/components/RealItemTinyIcon";
import { RARITIES } from "@/lib/rarity";
import { clean, dateBR, moneyBRL, percent, prettyCode } from "@/lib/format";
import { getFarmOptimizerData, type FarmDropOpportunity, type FarmStageOpportunity } from "@/lib/farm-optimizer";

export const dynamic = "force-dynamic";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

const SOURCES = ["", "NORMAL_MONSTER_BOX", "BOSS_MONSTER_BOX", "STAGE_BOX", "FIRST_CLEAR", "SOULSTONE"];
const TYPES = ["", "GEAR", "MATERIAL", "STAGEBOX", "CONSUMABLE", "RUNE"];
const MODES = [
  ["value", "Melhor valor"],
  ["score", "Pontuação geral"],
  ["price", "Maior preço"],
  ["weight", "Melhor peso"],
] as const;

function sourceLabel(value?: string | null) {
  return prettyCode(value || "Fonte desconhecida");
}

function stageSub(stage: FarmStageOpportunity) {
  const parts = [];
  if (stage.act && stage.stageNo) parts.push(`Ato ${stage.act}-${stage.stageNo}`);
  if (stage.stageLevel) parts.push(`Nível ${stage.stageLevel}`);
  if (stage.sourceType) parts.push(sourceLabel(stage.sourceType));
  return parts.join(" · ");
}

function DropMini({ drop }: { drop: FarmDropOpportunity }) {
  return (
    <div className={styles.topDropItem}>
      <RealItemTinyIcon iconPath={drop.iconPath} alt={drop.itemName} size="sm" />
      <div>
        <strong>{drop.itemName}</strong>
        <div className="pill-row">
          <span className={`grade grade-${clean(drop.grade, "common").toLowerCase()}`}>{clean(drop.grade)}</span>
          <span className="pill">{moneyBRL(drop.priceBrl)}</span>
          <span className="pill">Peso: {percent(drop.weightPercent)}</span>
        </div>
      </div>
      <strong>{moneyBRL(drop.estimatedValueBrl)}</strong>
    </div>
  );
}

function StageOpportunityCard({ stage, rank }: { stage: FarmStageOpportunity; rank: number }) {
  return (
    <article className={`small-card ${styles.stageCard}`}>
      <span className={styles.rankBadge}>#{rank}</span>
      <h3>{stage.stageName}</h3>
      <p>{stageSub(stage)}</p>

      <div className={styles.valueRow}>
        <div className={styles.valueBox}><strong>{moneyBRL(stage.estimatedValueBrl)}</strong><span>valor estimado</span></div>
        <div className={styles.valueBox}><strong>{moneyBRL(stage.bestPriceBrl)}</strong><span>melhor item</span></div>
        <div className={styles.valueBox}><strong>{stage.pricedDrops}/{stage.totalDrops}</strong><span>drops com preço</span></div>
        <div className={styles.valueBox}><strong>{stage.score.toFixed(1)}</strong><span>farm score</span></div>
      </div>

      {stage.bestItem && (
        <div className={styles.topDropList}>
          <DropMini drop={stage.bestItem} />
          {stage.topDrops.filter((d) => d.id !== stage.bestItem?.id).slice(0, 3).map((drop) => <DropMini key={drop.id} drop={drop} />)}
        </div>
      )}

      <div className={styles.actionsRow}>
        <Link className="btn ghost" href={`/stages/${encodeURIComponent(stage.stageKey)}`}>Abrir fase</Link>
        <Link className="btn ghost" href={`/drops?q=${encodeURIComponent(stage.stageName)}&source=${encodeURIComponent(stage.sourceType || "")}`}>Ver drops</Link>
      </div>
    </article>
  );
}

function DropOpportunityCard({ drop, rank }: { drop: FarmDropOpportunity; rank: number }) {
  return (
    <article className={`small-card ${styles.dropCard} rarity-${clean(drop.grade, "common").toLowerCase()}`}>
      <span className={styles.rankBadge}>#{rank}</span>
      <div className={styles.itemTitleRow}>
        <RealItemTinyIcon iconPath={drop.iconPath} alt={drop.itemName} size="md" />
        <div>
          <h3>{drop.itemName}</h3>
          <p>{drop.stageName} · {sourceLabel(drop.sourceType)}</p>
        </div>
      </div>

      <div className={styles.valueRow}>
        <div className={styles.valueBox}><strong>{moneyBRL(drop.priceBrl)}</strong><span>preço BR na Steam</span></div>
        <div className={styles.valueBox}><strong>{percent(drop.weightPercent)}</strong><span>peso no drop</span></div>
        <div className={styles.valueBox}><strong>{moneyBRL(drop.estimatedValueBrl)}</strong><span>valor ponderado</span></div>
        <div className={styles.valueBox}><strong>{drop.score.toFixed(1)}</strong><span>score</span></div>
      </div>

      <div className="pill-row">
        <span className={`grade grade-${clean(drop.grade, "common").toLowerCase()}`}>{clean(drop.grade)}</span>
        <span className="pill">ID: {drop.itemKey}</span>
        <span className="pill">Tipo: {prettyCode(drop.itemType)}</span>
        <span className="pill">Volume: {clean(drop.volume)}</span>
        <span className="pill">Atualizado: {dateBR(drop.updatedAt)}</span>
      </div>

      <div className={styles.actionsRow}>
        <Link className="btn ghost" href={`/items/${encodeURIComponent(drop.itemKey)}`}>Abrir item</Link>
        <Link className="btn ghost" href={`/drops?q=${encodeURIComponent(drop.itemKey)}`}>Onde dropa</Link>
        <Link className="btn ghost" href={`/stages/${encodeURIComponent(drop.stageKey)}`}>Fase</Link>
      </div>
    </article>
  );
}

export default async function FarmOptimizerPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const q = first(sp.q) ?? "";
  const grade = first(sp.grade) ?? "";
  const source = first(sp.source) ?? "";
  const type = first(sp.type) ?? "";
  const mode = (first(sp.mode) ?? "value") as "value" | "score" | "price" | "weight";
  const minPriceRaw = first(sp.minPrice) ?? "";
  const minPrice = Number(minPriceRaw || 0);

  const result = await getFarmOptimizerData({ q, grade, source, type, mode, minPrice, limit: q ? 900 : 500 });

  return (
    <main className="page-frame">
      <div className="page-banner">Otimizador de Farm Pro</div>
      <div className="page-body">
        <section className="panel">
          <span className="eyebrow">Farm inteligente BR</span>
          <h1>Otimizador de Farm</h1>
          <p>
            Encontre o melhor lugar para farmar juntando drop, fase, fonte, peso do DropKey e preço cacheado do Mercado Steam em R$.
          </p>

          <form className={styles.formGrid} action="/farm/optimizer">
            <input name="q" defaultValue={q} placeholder="Item, fase, ID, chefe, material..." />
            <select name="grade" defaultValue={grade}>
              <option value="">Todas as raridades</option>
              {RARITIES.map((g) => <option key={g.key} value={g.key}>{g.pt}</option>)}
            </select>
            <select name="source" defaultValue={source}>
              {SOURCES.map((s) => <option key={s} value={s}>{s ? sourceLabel(s) : "Todas fontes"}</option>)}
            </select>
            <select name="type" defaultValue={type}>
              {TYPES.map((t) => <option key={t} value={t}>{t ? prettyCode(t) : "Todos tipos"}</option>)}
            </select>
            <select name="mode" defaultValue={mode}>
              {MODES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <input name="minPrice" defaultValue={minPriceRaw} placeholder="Preço mín. R$" inputMode="decimal" />

            <div className={styles.formActions}>
              <button className="btn primary" type="submit">Otimizar farm</button>
              <Link className="btn ghost" href="/farm/optimizer">Limpar</Link>
              <Link className="btn ghost" href="/farm">Valor de Farm antigo</Link>
            </div>
          </form>

          <p className={styles.modeHint}>Dica: para farm alvo, pesquise o nome do item. Para farm geral, use raridade + preço mínimo.</p>

          <div className={styles.summaryGrid}>
            <div className={styles.summaryBox}><strong>{result.summary.dropsRead}</strong><span>drops analisados</span></div>
            <div className={styles.summaryBox}><strong>{result.summary.itemsPriced}</strong><span>drops com preço</span></div>
            <div className={styles.summaryBox}><strong>{result.summary.stagesFound}</strong><span>rotas de farm</span></div>
            <div className={styles.summaryBox}><strong>{moneyBRL(result.summary.bestEstimatedValueBrl)}</strong><span>melhor valor estimado</span></div>
          </div>
        </section>

        <section className="section">
          <div className="section-title-row">
            <h2>Melhores rotas de farm</h2>
            <Link className="btn ghost" href="/market">Ver mercado</Link>
          </div>
          {result.stages.length ? (
            <div className={styles.optimizerGrid}>
              {result.stages.map((stage, index) => <StageOpportunityCard key={stage.key} stage={stage} rank={index + 1} />)}
            </div>
          ) : (
            <EmptyState title="Nenhuma rota encontrada" text="Tente buscar por outro item/fase, limpar raridade ou reduzir o preço mínimo." />
          )}
        </section>

        <section className="section">
          <div className="section-title-row">
            <h2>Melhores drops individuais</h2>
            <Link className="btn ghost" href="/compare">Comparar itens</Link>
          </div>
          {result.drops.length ? (
            <div className={styles.dropGrid}>
              {result.drops.map((drop, index) => <DropOpportunityCard key={`${drop.id}-${drop.itemKey}`} drop={drop} rank={index + 1} />)}
            </div>
          ) : (
            <EmptyState title="Nenhum drop individual" text="Sem preço cacheado para os itens filtrados ou filtro muito específico." />
          )}
        </section>
      </div>
    </main>
  );
}
