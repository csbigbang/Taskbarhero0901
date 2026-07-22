import Link from "next/link";
import styles from "./database.module.css";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "TBH Database | Central BR",
  description: "Central de dados do Task Bar Hero em português: itens, drops, monstros, stages, economia, cube e ferramentas BR.",
};

type Dataset = {
  key: string;
  title: string;
  category: string;
  rows: number | null;
  localTable?: string;
  href?: string;
  icon?: string;
  status: "online" | "partial" | "planned";
  description: string;
  tags: string[];
};

type CountInfo = {
  ok: boolean;
  count: number;
};

const DATASETS: Dataset[] = [
  // Heroes & Combat
  { key: "heroes", title: "Heróis", category: "Heróis & Combate", rows: 6, href: "/builds", icon: "/game-assets/heroes/Hero_101.png", status: "partial", description: "Classes jogáveis, funções e base para builds.", tags: ["classe", "build", "save"] },
  { key: "monsters", title: "Monstros", category: "Heróis & Combate", rows: 61, href: "/monsters", icon: "/images/monsters/Monster_10011.png", status: "online", description: "Bestiário BR com sprites, HP, ATK, recompensa e localização.", tags: ["monstro", "boss", "wave", "farm"] },
  { key: "skills", title: "Skills", category: "Heróis & Combate", rows: 106, href: "/database?cat=Heróis%20%26%20Combate&q=skills", icon: "/images/items/Item_115004.png", status: "planned", description: "Habilidades ativas extraídas do jogo. Preparado para virar guia de classe.", tags: ["skill", "dano", "classe"] },
  { key: "passives", title: "Passivas", category: "Heróis & Combate", rows: 108, href: "/database?cat=Heróis%20%26%20Combate&q=passivas", icon: "/images/items/Item_116002.png", status: "planned", description: "Passivas e bônus permanentes por classe ou sistema.", tags: ["passiva", "build", "classe"] },
  { key: "buffs", title: "Buffs", category: "Heróis & Combate", rows: 29, href: "/database?cat=Heróis%20%26%20Combate&q=buffs", icon: "/images/items/Item_112005.png", status: "planned", description: "Efeitos temporários, buffs e estados positivos.", tags: ["buff", "efeito", "status"] },
  { key: "status-effects", title: "Efeitos de Status", category: "Heróis & Combate", rows: 6, href: "/database?cat=Heróis%20%26%20Combate&q=status", icon: "/images/items/Item_111004.png", status: "planned", description: "Debuffs e efeitos especiais usados em combate.", tags: ["debuff", "efeito", "status"] },

  // Items & Gear
  { key: "items", title: "Itens", category: "Itens e Equipamentos", rows: 5944, localTable: "tbh_items_full", href: "/items", icon: "/images/items/Item_110001.png", status: "online", description: "Todos os itens importados: equipamentos, materiais, baús e itens de economia.", tags: ["item", "gear", "material", "preço"] },
  { key: "gear", title: "Equipamentos", category: "Itens e Equipamentos", rows: 5760, href: "/items?type=GEAR", icon: "/images/items/Item_112001.png", status: "online", description: "Equipamentos filtrados por tipo, raridade, nível e preço.", tags: ["arma", "armadura", "acessório", "build"] },
  { key: "materials", title: "Materiais", category: "Itens e Equipamentos", rows: 125, href: "/items?type=MATERIAL", icon: "/images/items/Item_111001.png", status: "online", description: "Materiais de progressão, craft, Cube e economia.", tags: ["material", "craft", "cube"] },
  { key: "grades", title: "Raridades", category: "Itens e Equipamentos", rows: 10, href: "/grades", icon: "/images/rarities/divine.png", status: "online", description: "Comum até Cósmico, com filtros e visual pixelado.", tags: ["raridade", "grade", "filtro"] },
  { key: "stat-mods", title: "Mods de Atributo", category: "Itens e Equipamentos", rows: 620, href: "/database?cat=Itens%20%26%20Gear&q=stat", icon: "/images/items/Item_116001.png", status: "planned", description: "Mods e atributos que aparecem nos equipamentos.", tags: ["stat", "mod", "roll"] },
  { key: "item-groups", title: "Grupos de Itens", category: "Itens e Equipamentos", rows: 2275, href: "/database?cat=Itens%20%26%20Gear&q=grupo", icon: "/images/items/Item_100001.png", status: "planned", description: "Grupos internos usados pelo jogo para organizar recompensas e drops.", tags: ["grupo", "drop", "interno"] },

  // Stages & Drops
  { key: "stages", title: "Fases", category: "Fases e Drops", rows: 120, localTable: "tbh_stages_full", href: "/stages", icon: "/images/items/Item_920011.png", status: "online", description: "Mapa por ato e dificuldade com pontos, monstros, chefes e baús.", tags: ["fase", "act", "modo", "boss"] },
  { key: "drops", title: "Drops", category: "Fases e Drops", rows: 44757, localTable: "tbh_stage_drop_items", href: "/drops", icon: "/images/items/Item_910011.png", status: "online", description: "Localizador de drops com fonte, fase, baú, item e rota de farm.", tags: ["drop", "baú", "stage", "farm"] },
  { key: "stage-boxes", title: "Baús de Fase", category: "Fases e Drops", rows: 59, href: "/drops?source=STAGE_BOX", icon: "/images/items/Item_920011.png", status: "partial", description: "Baús de fase, boss e recompensas por conclusão.", tags: ["box", "chest", "drop"] },
  { key: "farm-optimizer", title: "Otimizador de Farm", category: "Fases e Drops", rows: null, href: "/farm/optimizer", icon: "/images/items/Item_160002.png", status: "online", description: "Ranking de melhores rotas com base em drops e preço em R$.", tags: ["farm", "rota", "valor", "R$"] },

  // Progression
  { key: "runes", title: "Runas", category: "Progressão", rows: 197, href: "/database?cat=Progressão&q=runas", icon: "/game-assets/items/sactx-0-256x256-DXT5_BC3-RuneIcon-720b438c.png", status: "planned", description: "Runas, níveis e bônus de progressão.", tags: ["runa", "progressão", "build"] },
  { key: "levels", title: "Níveis", category: "Progressão", rows: 100, href: "/progress", icon: "/images/items/Item_112005.png", status: "partial", description: "Base para simulador de progressão e rota por level.", tags: ["level", "exp", "rota"] },
  { key: "stage-scaling", title: "Escala de Fases", category: "Progressão", rows: 170, href: "/stages", icon: "/images/items/Item_920011.png", status: "partial", description: "Escalonamento interno das fases por modo e ato.", tags: ["scaling", "stage", "dificuldade"] },
  { key: "skill-levels", title: "Níveis de Skills", category: "Progressão", rows: 360, href: "/database?cat=Progressão&q=skill%20levels", icon: "/images/items/Item_115004.png", status: "planned", description: "Progressão de habilidades por nível.", tags: ["skill", "level", "dano"] },

  // Crafting & Economy
  { key: "market", title: "Mercado BR", category: "Craft e Economia", rows: null, localTable: "tbh_market_prices", href: "/market", icon: "/images/items/Item_100001.png", status: "online", description: "Preços reais salvos em cache em R$, usando o nome correto do mercado.", tags: ["steam", "preço", "mercado", "R$"] },
  { key: "cube", title: "Calculadora do Cube", category: "Craft e Economia", rows: 8, href: "/cube", icon: "/images/items/Item_100001.png", status: "online", description: "Simulador de risco, custo, retorno e itens bons para o Cube.", tags: ["cube", "craft", "risco"] },
  { key: "crafting", title: "Receitas de Craft", category: "Craft e Economia", rows: 56, href: "/database?cat=Crafting%20%26%20Economia&q=crafting", icon: "/game-assets/items/Craft_MainWeaponButton_Active.png", status: "planned", description: "Receitas de craft e evolução de itens.", tags: ["craft", "receita", "material"] },
  { key: "synthesis", title: "Síntese", category: "Craft e Economia", rows: 533, href: "/database?cat=Crafting%20%26%20Economia&q=synthesis", icon: "/images/items/Item_111001.png", status: "planned", description: "Receitas e drops de síntese.", tags: ["synthesis", "receita", "drop"] },
  { key: "extraction", title: "Custos de Extração", category: "Craft e Economia", rows: 90, href: "/database?cat=Crafting%20%26%20Economia&q=extraction", icon: "/images/items/Item_160002.png", status: "planned", description: "Custos de extração e economia de melhorias.", tags: ["extração", "custo", "economia"] },

  // Collection & Storage
  { key: "pets", title: "Pets", category: "Coleção & Conta", rows: 8, href: "/database?cat=Coleção%20%26%20Conta&q=pets", icon: "/game-assets/heroes/PetSlot_Bat_Arranged.png", status: "planned", description: "Pets, slots e bônus de coleção.", tags: ["pet", "coleção", "bônus"] },
  { key: "skins", title: "Skins", category: "Coleção & Conta", rows: 100, href: "/database?cat=Coleção%20%26%20Conta&q=skins", icon: "/game-assets/heroes/Hero_101.png", status: "planned", description: "Skins e cosméticos extraídos do jogo.", tags: ["skin", "cosmético", "coleção"] },
  { key: "inventory", title: "Inventário", category: "Coleção & Conta", rows: null, href: "/inventory", icon: "/images/items/Item_111001.png", status: "online", description: "Calculadora manual de inventário e valor total da conta.", tags: ["inventário", "valor", "conta"] },
  { key: "save", title: "Analisador de Salvamento", category: "Coleção & Conta", rows: null, href: "/save", icon: "/images/items/Item_112001.png", status: "online", description: "Leitura do save para personagens e itens equipados.", tags: ["save", "equipado", "personagem"] },
  { key: "doctor", title: "Analisador de Builds", category: "Coleção & Conta", rows: null, href: "/doctor", icon: "/images/items/Item_116002.png", status: "online", description: "Consultor da conta: piores slots, melhorias e farm recomendado.", tags: ["doctor", "build", "upgrade"] },
];

const CATEGORIES = Array.from(new Set(DATASETS.map((item) => item.category)));

async function countTable(table: string): Promise<CountInfo> {
  try {
    const db = supabase();
    const { count, error } = await db.from(table).select("*", { count: "exact", head: true });
    if (error) return { ok: false, count: 0 };
    return { ok: true, count: count ?? 0 };
  } catch {
    return { ok: false, count: 0 };
  }
}

async function getCounts() {
  const tables = [
    "tbh_items_full",
    "tbh_stage_drop_items",
    "tbh_stages_full",
    "tbh_steam_market_items",
    "tbh_steam_market_candidates",
    "tbh_market_prices",
  ];

  const values = await Promise.all(tables.map((table) => countTable(table)));
  return Object.fromEntries(tables.map((table, index) => [table, values[index]])) as Record<string, CountInfo>;
}

function formatNumber(value?: number | null) {
  if (value == null) return "ferramenta";
  return new Intl.NumberFormat("pt-BR").format(value);
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function statusLabel(status: Dataset["status"]) {
  if (status === "online") return "online";
  if (status === "partial") return "parcial";
  return "próximo";
}

export default async function DatabasePage({ searchParams }: { searchParams?: Promise<{ q?: string; cat?: string }> }) {
  const counts = await getCounts();
  const params = (await searchParams) ?? {};
  const q = String(params.q ?? "").trim();
  const cat = String(params.cat ?? "").trim();
  const query = normalize(q);

  const filtered = DATASETS.filter((item) => {
    const matchCategory = !cat || item.category === cat;
    const haystack = normalize([item.title, item.category, item.description, ...item.tags].join(" "));
    const matchQuery = !query || haystack.includes(query);
    return matchCategory && matchQuery;
  });

  const online = DATASETS.filter((item) => item.status === "online").length;
  const totalRows = DATASETS.reduce((acc, item) => acc + (item.rows ?? 0), 0);
  const localRows = ["tbh_items_full", "tbh_stage_drop_items", "tbh_stages_full"].reduce((acc, table) => {
    const info = counts[table];
    return acc + (info?.ok ? info.count : 0);
  }, 0);

  return (
    <main className={styles.databaseShell}>
      <section className={styles.heroPanel}>
        <div>
          <p className={styles.kicker}>Central BR</p>
          <h1>TBH Database</h1>
          <p>
            Central organizada do Task Bar Hero: itens, drops, fases, monstros, mercado, cube, save e ferramentas BR em um só lugar.
          </p>
        </div>
        <div className={styles.heroStats}>
          <article><strong>{formatNumber(DATASETS.length)}</strong><span>módulos</span></article>
          <article><strong>{formatNumber(totalRows)}</strong><span>linhas referência</span></article>
          <article><strong>{formatNumber(localRows)}</strong><span>linhas locais</span></article>
          <article><strong>{online}</strong><span>online</span></article>
        </div>
      </section>

      <section className={styles.searchPanel}>
        <form className={styles.searchForm}>
          <input name="q" defaultValue={q} placeholder="Buscar dataset, item, monstro, cube, mercado, runa..." />
          {cat ? <input type="hidden" name="cat" value={cat} /> : null}
          <button type="submit">Buscar</button>
          <Link href="/database">Limpar</Link>
        </form>
        <div className={styles.categoryTabs}>
          <Link className={!cat ? styles.activeTab : ""} href="/database">Tudo</Link>
          {CATEGORIES.map((category) => (
            <Link
              key={category}
              className={cat === category ? styles.activeTab : ""}
              href={`/database?cat=${encodeURIComponent(category)}`}
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.localPanel}>
        <article>
          <span>Itens locais</span>
          <strong>{counts.tbh_items_full?.ok ? formatNumber(counts.tbh_items_full.count) : "--"}</strong>
        </article>
        <article>
          <span>Drops locais</span>
          <strong>{counts.tbh_stage_drop_items?.ok ? formatNumber(counts.tbh_stage_drop_items.count) : "--"}</strong>
        </article>
        <article>
          <span>Fases locais</span>
          <strong>{counts.tbh_stages_full?.ok ? formatNumber(counts.tbh_stages_full.count) : "--"}</strong>
        </article>
        <article>
          <span>Mercado Steam</span>
          <strong>{counts.tbh_steam_market_items?.ok ? formatNumber(counts.tbh_steam_market_items.count) : "--"}</strong>
        </article>
        <article>
          <span>Preços cache</span>
          <strong>{counts.tbh_market_prices?.ok ? formatNumber(counts.tbh_market_prices.count) : "--"}</strong>
        </article>
      </section>

      <section className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Todos os dados</p>
          <h2>{filtered.length} dataset(s)</h2>
        </div>
        <span>TBH Database + ferramentas BR</span>
      </section>

      <section className={styles.datasetGrid}>
        {filtered.map((item) => {
          const local = item.localTable ? counts[item.localTable] : null;
          const rows = local?.ok ? local.count : item.rows;
          return (
            <article key={item.key} className={`${styles.datasetCard} ${styles[item.status]}`}>
              <div className={styles.datasetTop}>
                <div className={styles.iconBox}>{item.icon ? <img src={item.icon} alt="" /> : null}</div>
                <div>
                  <span>{item.category}</span>
                  <h3>{item.title}</h3>
                </div>
                <em>{statusLabel(item.status)}</em>
              </div>
              <p>{item.description}</p>
              <div className={styles.datasetMeta}>
                <strong>{formatNumber(rows)}</strong>
                <span>{item.localTable && local?.ok ? "linhas no Supabase" : item.rows == null ? "ferramenta" : "linhas referência"}</span>
              </div>
              <div className={styles.tags}>
                {item.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}
              </div>
              <div className={styles.actions}>
                {item.href ? <Link href={item.href}>Abrir</Link> : null}
                <Link href={`/database?q=${encodeURIComponent(item.tags[0] ?? item.title)}`}>Relacionados</Link>
              </div>
            </article>
          );
        })}
      </section>

      <section className={styles.nextPanel}>
        <div>
          <p className={styles.kicker}>Próximo nível</p>
          <h2>Busca global inteligente</h2>
          <p>
            O próximo bloco pode transformar essa central em uma busca única: digitar “Slime”, “Amber”, “Knight” ou “Arcana” e receber itens, drops, fases, monstros, mercado e builds relacionados em uma tela só.
          </p>
        </div>
        <Link href="/database?q=Amber">Testar busca Amber</Link>
      </section>
    </main>
  );
}
