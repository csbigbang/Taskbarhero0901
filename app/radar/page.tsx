import Link from "next/link";
import styles from "./radar.module.css";
import { RadarItemIcon } from "@/components/RadarItemIcon";
import { getRadarData, type RadarFarm, type RadarMarketItem } from "@/lib/radar-opportunities";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Radar de Oportunidades | TBH Banco de Dados BR",
  description: "Veja o que vale farmar, vender, comprar e usar no Cube hoje em Task Bar Hero.",
};

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function money(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "sem preço";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function dateBR(value?: string | null) {
  if (!value) return "sem atualização";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "sem atualização";
  return date.toLocaleString("pt-BR");
}

function label(value?: string | null) {
  return String(value ?? "").replace(/_/g, " ") || "-";
}

function itemHref(item: RadarMarketItem) {
  return `/items/${encodeURIComponent(item.itemKey)}`;
}

function ItemRow({ item, mode }: { item: RadarMarketItem; mode: "sell" | "buy" | "cube" }) {
  const valueLabel = mode === "buy" && item.discountPercent > 0 ? `${Math.round(item.discountPercent)}% off` : money(item.priceBrl);
  const subValue = mode === "buy" && item.medianBrl > 0 ? `mediana ${money(item.medianBrl)}` : item.volumeText ? `volume ${item.volumeText}` : label(item.grade);

  return (
    <article className={styles.itemCard}>
      <RadarItemIcon iconPath={item.iconPath} alt={item.name} />
      <div className={styles.itemText}>
        <strong>{item.name}</strong>
        <div className={styles.itemMeta}>
          <span>{label(item.grade)}</span>
          <span>{label(item.itemType)}</span>
          {item.parts ? <span>{label(item.parts)}</span> : null}
          {item.level ? <span>Nível {item.level}</span> : null}
        </div>
        <div className={styles.itemReason}>{item.reason}</div>
        <div className={styles.itemActions}>
          <Link href={itemHref(item)}>Abrir item</Link>
          <Link href={`/drops?q=${encodeURIComponent(item.itemKey)}`}>Drops</Link>
          <Link href={`/compare?q=${encodeURIComponent(item.name)}`}>Comparar</Link>
        </div>
      </div>
      <div className={styles.itemValue}>
        <strong>{valueLabel}</strong>
        <span>{subValue}</span>
      </div>
    </article>
  );
}

function ItemSection({ title, eyebrow, description, items, mode }: { title: string; eyebrow: string; description: string; items: RadarMarketItem[]; mode: "sell" | "buy" | "cube" }) {
  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHead}>
        <div>
          <div className={styles.sectionEyebrow}>{eyebrow}</div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className={styles.itemList}>
        {items.length ? items.map((item) => <ItemRow key={`${mode}-${item.itemKey}`} item={item} mode={mode} />) : <div className={styles.empty}>Nenhum item encontrado agora. Atualize o mercado e tente novamente.</div>}
      </div>
    </section>
  );
}

function FarmCard({ farm, index }: { farm: RadarFarm; index: number }) {
  return (
    <article className={styles.farmCard}>
      <div className={styles.farmMeta}>#{index + 1} · {label(farm.sourceType)} · {farm.stageLevel ? `Nível ${farm.stageLevel}` : "fase"}</div>
      <h3>{farm.stageName}</h3>
      <div className={styles.farmStats}>
        <div>
          <span>Valor estimado</span>
          <strong>{money(farm.estimatedValueBrl)}</strong>
        </div>
        <div>
          <span>Melhor item</span>
          <strong>{money(farm.bestPriceBrl)}</strong>
        </div>
        <div>
          <span>Drops com preço</span>
          <strong>{farm.pricedDrops}/{farm.totalDrops}</strong>
        </div>
      </div>
      <div className={styles.farmItems}>
        {farm.topItems.map((item) => (
          <Link href={itemHref(item)} className={styles.farmPill} key={`${farm.key}-${item.itemKey}`}>
            <RadarItemIcon iconPath={item.iconPath} alt={item.name} />
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
      <div className={styles.farmActions}>
        <Link href={`/farm/optimizer?q=${encodeURIComponent(farm.stageName)}`}>Abrir farm</Link>
        <Link href={`/drops?q=${encodeURIComponent(farm.stageKey)}`}>Ver drops</Link>
      </div>
    </article>
  );
}

export default async function RadarPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const budget = Number(first(sp.budget) || 10);
  const focus = first(sp.focus) || "all";
  const data = await getRadarData({ budget, focus });

  return (
    <div className="page-frame">
      <div className="page-banner page-banner-assets">Radar de Oportunidades</div>
      <div className="page-body">
        <div className={styles.radarShell}>
          <section className={styles.hero}>
            <span className={styles.kicker}>Radar diário BR</span>
            <h1>O que vale farmar, vender e comprar hoje</h1>
            <p>
              O radar cruza preços cacheados do mercado, raridade, liquidez e drops para mostrar oportunidades rápidas para jogador tomar decisão sem ficar abrindo várias páginas.
            </p>
            <form className={styles.filterBar} method="GET">
              <label>
                Orçamento por item
                <input name="budget" type="number" step="0.5" min="0.5" defaultValue={data.summary.budget} />
              </label>
              <label>
                Foco
                <select name="focus" defaultValue={focus}>
                  <option value="all">Tudo</option>
                  <option value="sell">Vender</option>
                  <option value="buy">Comprar barato</option>
                  <option value="farm">Farmar</option>
                  <option value="cube">Cube</option>
                </select>
              </label>
              <button type="submit">Atualizar radar</button>
              <Link className={styles.primaryLink} href="/market">Abrir mercado</Link>
            </form>
          </section>

          <section className={styles.statsGrid}>
            <div className={styles.statCard}><span>Itens com preço</span><strong>{data.summary.pricedItems}</strong></div>
            <div className={styles.statCard}><span>Maior desconto</span><strong>{Math.round(data.summary.bestDealPercent)}%</strong></div>
            <div className={styles.statCard}><span>Melhor farm</span><strong>{money(data.summary.bestFarmValue)}</strong></div>
            <div className={styles.statCard}><span>Atualizado</span><strong>{dateBR(data.summary.updatedAt)}</strong></div>
          </section>

          <section className={styles.alertGrid}>
            {data.alerts.map((alert) => (
              <Link className={styles.alertCard} href={alert.href} key={`${alert.tone}-${alert.title}`}>
                <span className={styles.alertTone}>{alert.tone}</span>
                <strong>{alert.title}</strong>
                <p>{alert.body}</p>
              </Link>
            ))}
          </section>

          <div className={styles.twoColumns}>
            <ItemSection
              eyebrow="Vender agora"
              title="Itens com melhor força de mercado"
              description="Itens com preço mais forte, boa raridade e sinais de liquidez."
              items={data.sellNow}
              mode="sell"
            />
            <ItemSection
              eyebrow="Comprar barato"
              title="Itens abaixo da mediana"
              description="Itens em que o menor preço está abaixo da mediana cacheada."
              items={data.buyDeals}
              mode="buy"
            />
          </div>

          <section>
            <div className={styles.sectionHead}>
              <div>
                <div className={styles.sectionEyebrow}>Farm do dia</div>
                <h2>Melhores rotas pelo valor dos drops</h2>
                <p>Ranking de fases/fontes que combinam itens com preço e chance de drop.</p>
              </div>
            </div>
            <div className={styles.farmGrid}>
              {data.farms.length ? data.farms.map((farm, index) => <FarmCard key={farm.key} farm={farm} index={index} />) : <div className={styles.empty}>Nenhuma rota calculada agora.</div>}
            </div>
          </section>

          <ItemSection
            eyebrow="Cube"
            title="Itens baratos para sacrificar com cuidado"
            description="Baixo custo dentro do orçamento escolhido. Compare antes de gastar item de build."
            items={data.cubeTargets}
            mode="cube"
          />
        </div>
      </div>
    </div>
  );
}
