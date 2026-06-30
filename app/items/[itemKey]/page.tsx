import { createClient } from "@supabase/supabase-js";
import ItemSmartImage from "../../../components/ItemSmartImage";
import ItemDetailActions from "../../../components/ItemDetailActions";
import styles from "./item-detail-pro.module.css";
import {
  AnyRow,
  buildAdviceFor,
  calculateItemDetailScore,
  cubeAdviceFor,
  dropSourceOf,
  dropWeightOf,
  firstValue,
  formatBRL,
  itemKeyOf,
  itemNameOf,
  levelOf,
  priceOf,
  rarityOf,
  recommendationFor,
  safeSlug,
  scoreLabel,
  stageNameOf,
  typeOfItem,
  volumeOf,
} from "../../../lib/item-detail-pro";

export const dynamic = "force-dynamic";

type StageMap = Map<string, AnyRow>;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getItem(supabase: any, key: string) {
  const byKey = await supabase.from("tbh_items_full").select("*").eq("item_key", key).limit(1);
  if (byKey.data?.[0]) return byKey.data[0] as AnyRow;

  const byId = Number(key);
  if (Number.isFinite(byId)) {
    const tryId = await supabase.from("tbh_items_full").select("*").eq("id", byId).limit(1);
    if (tryId.data?.[0]) return tryId.data[0] as AnyRow;
  }

  return null;
}

async function getMarket(supabase: any, key: string) {
  const res = await supabase.from("tbh_market_items_view").select("*").eq("item_key", key).limit(1);
  return (res.data?.[0] as AnyRow | undefined) || null;
}

async function getDrops(supabase: any, key: string) {
  const res = await supabase.from("tbh_stage_drop_items").select("*").eq("item_key", key).limit(120);
  return (res.data || []) as AnyRow[];
}

async function getStages(supabase: any, drops: AnyRow[]) {
  const stageKeys = Array.from(new Set(drops.map((drop) => String(firstValue(drop, ["stage_key", "stage_id", "stage", "map_key"]))).filter(Boolean))).slice(0, 80);
  if (!stageKeys.length) return new Map<string, AnyRow>();

  const res = await supabase.from("tbh_stages_full").select("*").in("stage_key", stageKeys);
  const map: StageMap = new Map();
  for (const stage of (res.data || []) as AnyRow[]) {
    const key = String(firstValue(stage, ["stage_key", "stage_id", "id", "key"]));
    if (key) map.set(key, stage);
  }
  return map;
}

async function getRelated(supabase: any, item: AnyRow, currentKey: string) {
  const rarity = rarityOf(item);
  const type = typeOfItem(item);

  let query = supabase.from("tbh_items_full").select("*").neq("item_key", currentKey).limit(8);
  if (rarity && rarity !== "Sem raridade") query = query.eq("rarity", rarity);
  const res = await query;
  let rows = (res.data || []) as AnyRow[];

  if (!rows.length && type && type !== "Item") {
    const fallback = await supabase.from("tbh_items_full").select("*").neq("item_key", currentKey).limit(8);
    rows = ((fallback.data || []) as AnyRow[]).filter((row) => typeOfItem(row).toLowerCase() === type.toLowerCase()).slice(0, 6);
  }

  return rows.slice(0, 6);
}

function stageKeyOfDrop(drop: AnyRow) {
  return String(firstValue(drop, ["stage_key", "stage_id", "stage", "map_key"]));
}

function StatBar({ label, value }: { label: string; value: number }) {
  const safe = Math.max(0, Math.min(100, Math.round(value || 0)));
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.bar}><span className={styles.barFill} style={{ width: `${safe}%` }} /></span>
      <span className={styles.statValue}>{safe}</span>
    </div>
  );
}

export default async function ItemDetailPage(props: any) {
  const params = await props.params;
  const rawKey = decodeURIComponent(String(params?.itemKey || ""));
  const supabase = getSupabase();

  if (!supabase) {
    return (
      <main className={styles.page}>
        <section className={styles.notFound}>
          <h1>Supabase não configurado</h1>
          <p>Confira as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.</p>
        </section>
      </main>
    );
  }

  const item = await getItem(supabase, rawKey);

  if (!item) {
    return (
      <main className={styles.page}>
        <section className={styles.notFound}>
          <h1>Item não encontrado</h1>
          <p>Não encontrei o item <strong>{rawKey}</strong> no banco importado.</p>
          <a href="/items">Voltar para itens</a>
        </section>
      </main>
    );
  }

  const itemKey = itemKeyOf(item) || rawKey;
  const [market, drops] = await Promise.all([
    getMarket(supabase, itemKey),
    getDrops(supabase, itemKey),
  ]);
  const [stages, related] = await Promise.all([
    getStages(supabase, drops),
    getRelated(supabase, item, itemKey),
  ]);

  const name = itemNameOf(market || item);
  const rarity = rarityOf(item);
  const type = typeOfItem(item);
  const level = levelOf(item);
  const price = priceOf(market || item);
  const priceLabel = formatBRL(price);
  const volume = volumeOf(market || item);
  const score = calculateItemDetailScore(item, market, drops);
  const iconPath = String(firstValue(item, ["icon_path", "icon", "image", "asset", "asset_name"]));
  const marketHash = String(firstValue(market || item, ["market_hash_name", "hash_name", "steam_name"]));

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.iconFrame}>
            <ItemSmartImage className={styles.itemImage} itemKey={itemKey} iconPath={iconPath} alt={name} />
          </div>

          <div>
            <span className={styles.kicker}>Detalhes do item</span>
            <h1 className={styles.title}>{name}</h1>
            <div className={styles.metaRow}>
              <span className={styles.metaPill}>ID {itemKey}</span>
              <span className={styles.metaPill}>{rarity}</span>
              <span className={styles.metaPill}>{type}</span>
              {level > 0 ? <span className={styles.metaPill}>Nível {level}</span> : null}
              {marketHash ? <span className={styles.metaPill}>Steam: {marketHash}</span> : null}
            </div>
          </div>

          <aside className={styles.scorePanel}>
            <span className={styles.scoreNumber}>{score.finalScore}</span>
            <span className={styles.scoreText}>{scoreLabel(score.finalScore)}</span>
            <div className={styles.priceLine}>{priceLabel}</div>
            {volume > 0 ? <div className={styles.dropMeta}>Volume: {volume}</div> : null}
          </aside>
        </div>
      </section>

      <section className={styles.actionsPanel}>
        <ItemDetailActions itemKey={itemKey} itemName={name} priceLabel={priceLabel} score={score.finalScore} />
      </section>

      <section className={styles.sectionGrid}>
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Recomendação</h2>
          <div className={styles.recommendation}>
            <p><strong>Resumo:</strong> {recommendationFor(item, market, drops)}</p>
            <p><strong>Build:</strong> {buildAdviceFor(item)}</p>
            <p><strong>Cube:</strong> {cubeAdviceFor(item, market)}</p>
          </div>
        </div>

        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Pontuação do item</h2>
          <div className={styles.statList}>
            <StatBar label="Raridade" value={score.rarityScore} />
            <StatBar label="Nível" value={score.levelScore} />
            <StatBar label="Mercado" value={score.marketScore} />
            <StatBar label="Liquidez" value={score.liquidityScore} />
            <StatBar label="Farm" value={score.farmScore} />
          </div>
        </div>
      </section>

      <section className={styles.sectionGrid}>
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Onde dropar</h2>
          {drops.length ? (
            <div className={styles.dropList}>
              {drops.slice(0, 12).map((drop, index) => {
                const sKey = stageKeyOfDrop(drop);
                const stage = stages.get(sKey);
                const weight = dropWeightOf(drop);
                return (
                  <article className={styles.dropCard} key={`${sKey}-${index}`}>
                    <div>
                      <div className={styles.dropName}>{stageNameOf(stage, sKey ? `Fase ${sKey}` : "Fonte desconhecida")}</div>
                      <div className={styles.dropMeta}>{dropSourceOf(drop)} {weight > 0 ? `· peso/chance ${weight}` : ""}</div>
                    </div>
                    {sKey ? <a className={styles.dropAction} href={`/drops?stage=${safeSlug(sKey)}`}>Ver drops</a> : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.empty}>Nenhum drop encontrado para este item no banco atual.</div>
          )}
        </div>

        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Mercado e uso</h2>
          <div className={styles.recommendation}>
            <p><strong>Preço atual:</strong> {priceLabel}</p>
            <p><strong>Volume:</strong> {volume > 0 ? volume : "sem volume"}</p>
            <p><strong>Farm:</strong> {drops.length ? `${drops.length} fonte(s) encontrada(s)` : "sem fonte encontrada"}</p>
            <p><strong>Decisão rápida:</strong> {price > 0 ? "Compare preço, raridade e utilidade antes de vender." : "Sem preço cacheado. Use com cuidado na avaliação de valor."}</p>
          </div>
        </div>
      </section>

      <section className={styles.panel} style={{ marginTop: 20 }}>
        <h2 className={styles.panelTitle}>Itens relacionados</h2>
        {related.length ? (
          <div className={styles.relatedGrid}>
            {related.map((row) => {
              const rKey = itemKeyOf(row);
              const rName = itemNameOf(row);
              const rIcon = String(firstValue(row, ["icon_path", "icon", "image", "asset", "asset_name"]));
              return (
                <a className={styles.relatedCard} href={`/items/${safeSlug(rKey)}`} key={rKey || rName}>
                  <ItemSmartImage className={styles.relatedImg} itemKey={rKey} iconPath={rIcon} alt={rName} />
                  <span>
                    <span className={styles.relatedName}>{rName}</span>
                    <span className={styles.relatedMeta}>{rarityOf(row)} · {typeOfItem(row)}</span>
                  </span>
                </a>
              );
            })}
          </div>
        ) : (
          <div className={styles.empty}>Nenhum item relacionado encontrado.</div>
        )}
      </section>
    </main>
  );
}
