import Link from "next/link";
import { getStage, getStageDrops } from "@/lib/data";
import { clean, prettyCode } from "@/lib/format";
import styles from "./stage-detail.module.css";
import { OFFICIAL_MONSTER_NAMES_PT, OFFICIAL_STAGES } from "@/lib/tbh-official-stage-data";

type Props = { params: Promise<{ stageKey: string }> };
export const dynamic = "force-dynamic";

type Row = Record<string, any>;

const DIFFICULTY_BY_CODE: Record<string, string> = {
  "1": "Normal",
  "2": "Pesadelo",
  "3": "Inferno",
  "4": "Tormento",
};

const STAGE_NAMES_PT: Record<number, string[]> = {
  1: ["Pasto", "Prado Sombrio", "Terra Devastada", "Desfiladeiro Sinistro", "Entrada da Vila em Chamas", "Praça Rumstreet", "Arredores da Cidade", "Cemitério", "Terra Amaldiçoada", "Trono das Trevas"],
  2: ["Caminho do Oásis", "Vale da Tempestade de Areia", "Caverna Subterrânea do Deserto", "Ninho de Insetos", "Dunas Escaldantes", "Ruínas do Pôr do Sol", "Areias da Meia-Noite", "Túmulo Sagrado", "Cripta do Faraó", "Canal Subterrâneo do Faraó"],
  3: ["Posto Avançado Nevado", "Campo de Batalha Congelado", "Entrada da Caverna Glacial", "Caverna Glacial Congelada", "Portão do Inferno", "Desfiladeiro Ardente", "Planícies do Tormento", "Cidadela da Ruína", "Núcleo do Abismo", "Sala de Comando do Inferno"],
};


const STAGE_MONSTER_FALLBACK: Record<number, Record<number, string[]>> = {
  1: {
    1: ["10011", "10021"],
    2: ["10021", "10031"],
    3: ["10042", "10043"],
    4: ["10042", "10051"],
    5: ["10051", "10052"],
    6: ["10021", "10042", "10052"],
    7: ["10043", "10051"],
    8: ["10051", "10052", "10053"],
    9: ["10052", "10053", "10901"],
    10: ["10901", "10902", "10903", "10904"],
  },
  2: {
    1: ["20011", "20021"],
    2: ["20021", "20022"],
    3: ["20031", "20041"],
    4: ["20041", "20042"],
    5: ["20051", "20061"],
    6: ["20061", "20062"],
    7: ["20071", "20081"],
    8: ["20081", "20091"],
    9: ["20091", "20111"],
    10: ["20901", "20902", "20903", "20904"],
  },
  3: {
    1: ["20111", "30041"],
    2: ["30041", "30042"],
    3: ["30042", "30043"],
    4: ["30043", "30044"],
    5: ["30061", "30071"],
    6: ["30071", "30081"],
    7: ["30081", "30082"],
    8: ["30082", "30083"],
    9: ["30101", "30102", "30103", "30104"],
    10: ["30111", "30082", "30083"],
  },
};


const CHEST_NAMES: Record<string, string> = {
  NORMAL_MONSTER_BOX: "Baú de Monstro",
  NORMAL_BOSS_BOX: "Baú de Chefe",
  STAGE_BOSS_BOX: "Baú de Chefe",
  ACT_BOSS_BOX: "Baú de Chefe do Ato",
  FIRST_CLEAR: "Primeira conclusão",
};

const MONSTER_NAMES: Record<string, string> = {
  "10011": "Slime",
  "10021": "Goblin",
  "10022": "Chefe Goblin",
  "10031": "Mago Goblin",
  "10042": "Guerreiro Orc",
  "10043": "Orc de Elite",
  "10051": "Esqueleto",
  "10052": "Arqueiro Esqueleto",
  "10053": "Cavaleiro Esqueleto",
  "10901": "Mago Antigo",
  "10902": "Chefe Orc",
  "10903": "Rei Goblin",
  "10904": "Rei Esqueleto",
  "20021": "Guerreiro Ratuno",
  "20022": "Arqueiro Ratuno",
  "20901": "Soberano do Deserto",
  "30041": "Guerreiro da Montanha",
  "30042": "Arqueiro da Montanha",
  "30082": "Comandante da Legião",
};

function pick(row: Row | null | undefined, keys: string[], fallback: any = "") {
  if (!row) return fallback;
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
  }
  return fallback;
}

function onlyKey(value: string) {
  return decodeURIComponent(value).match(/\d+/)?.[0] ?? decodeURIComponent(value);
}

function asNumber(value: any, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function actFromKey(key: string) {
  return asNumber(key.replace(/\D/g, "")[0], 1) || 1;
}

function difficultyFromKey(key: string) {
  return DIFFICULTY_BY_CODE[key.replace(/\D/g, "")[1] || "1"] ?? "Normal";
}

function stageNoFromKey(key: string) {
  const raw = key.replace(/\D/g, "");
  if (raw.length >= 4) return asNumber(raw.slice(-2), 1);
  return asNumber(raw.slice(-1), 1);
}

function fallbackStage(key: string): Row {
  const act = actFromKey(key);
  const stageNo = stageNoFromKey(key);
  const difficulty = difficultyFromKey(key);
  return {
    stage_key: key,
    act: String(act),
    stage_no: String(stageNo),
    stage_level: String(stageNo),
    stage_difficulty: difficulty,
    wave_amount: "10",
    wave_monster_amount: "1",
    monsters: (STAGE_MONSTER_FALLBACK[act]?.[stageNo] ?? []).join("|"),
    boss_monster_key: stageNo === 10 ? (act === 1 ? "10904" : act === 2 ? "20904" : "30111") : "",
    name_pt_br: STAGE_NAMES_PT[act]?.[stageNo - 1] ?? `Ato ${act}-${stageNo}`,
    name_en_us: "Dados extraídos do jogo.",
  };
}

function difficultyLabel(stage: Row, key: string) {
  const raw = String(pick(stage, ["stage_difficulty", "difficulty", "mode"], difficultyFromKey(key)));
  const lower = raw.toLowerCase();
  if (lower.includes("night")) return "Pesadelo";
  if (lower.includes("hell")) return "Inferno";
  if (lower.includes("torment")) return "Tormento";
  return raw || difficultyFromKey(key);
}

function stageTitle(stage: Row, key: string) {
  const direct = pick(stage, ["name_pt_br", "stage_name_pt_br", "name_pt", "display_name_pt_br"], "");
  if (direct) return String(direct);
  const act = asNumber(pick(stage, ["act"], actFromKey(key)), actFromKey(key));
  const no = asNumber(pick(stage, ["stage_no"], stageNoFromKey(key)), stageNoFromKey(key));
  return STAGE_NAMES_PT[act]?.[no - 1] ?? `Ato ${act}-${no}`;
}

function extractMonsterIds(value: any) {
  const raw = String(value ?? "").trim();
  if (!raw) return [];
  const ids: string[] = [];
  for (const token of raw.split(/[\s,;|]+/)) {
    const beforeWeight = token.trim().split("_")[0];
    if (/^\d{4,}$/.test(beforeWeight)) ids.push(beforeWeight);
  }
  return Array.from(new Set(ids));
}

function fallbackMonsterIds(stage: Row, key: string) {
  const act = asNumber(pick(stage, ["act"], actFromKey(key)), actFromKey(key));
  const no = asNumber(pick(stage, ["stage_no"], stageNoFromKey(key)), stageNoFromKey(key));
  return STAGE_MONSTER_FALLBACK[act]?.[no] ?? [];
}

function monsterIds(stage: Row, key: string) {
  const ids = extractMonsterIds(pick(stage, ["monsters", "monster_keys", "mobs", "mob_keys"], ""));
  return ids.length ? ids.slice(0, 8) : fallbackMonsterIds(stage, key).slice(0, 8);
}

function monsterName(id: string) {
  return OFFICIAL_MONSTER_NAMES_PT[id] ?? MONSTER_NAMES[id] ?? `Monstro #${id}`;
}

function monsterSprite(id: string) {
  return `/images/monsters/Monster_${id}.png`;
}

function sourceType(row: Row) {
  return String(pick(row, ["source_type", "SourceType", "type", "drop_type"], "DROP"));
}

function dropKey(row: Row) {
  return String(pick(row, ["drop_key", "item_key", "reward_key", "source_item_key", "key"], ""));
}

function dropRate(row: Row) {
  return String(pick(row, ["source_rate", "rate", "weight", "drop_rate", "chance"], ""));
}

function uniqueLoot(stage: Row, drops: Row[]) {
  const base: Row[] = [
    { source_type: "NORMAL_MONSTER_BOX", drop_key: pick(stage, ["monster_drop_item_key"], ""), source_rate: pick(stage, ["monster_drop_item_rate"], "") },
    { source_type: "STAGE_BOSS_BOX", drop_key: pick(stage, ["boss_drop_item_key"], ""), source_rate: pick(stage, ["boss_drop_item_rate"], "") },
    { source_type: "FIRST_CLEAR", drop_key: pick(stage, ["first_clear_drop_key"], ""), source_rate: "1x" },
  ].filter((row) => dropKey(row));

  const map = new Map<string, Row>();
  for (const row of [...base, ...drops]) {
    const id = `${sourceType(row)}:${dropKey(row)}:${dropRate(row)}`;
    if (!map.has(id)) map.set(id, row);
  }
  return Array.from(map.values()).slice(0, 30);
}

function officialStageByKey(key: string) {
  return OFFICIAL_STAGES.find((row) => String(row.stage_key) === key) ?? null;
}

export default async function StagePage({ params }: Props) {
  const { stageKey } = await params;
  const key = onlyKey(stageKey);

  let stage: Row | null = officialStageByKey(key);
  let drops: Row[] = [];

  if (!stage) {
    try {
      stage = await getStage(key) as Row | null;
    } catch {}
  }

  if (!stage) stage = fallbackStage(key);

  try {
    drops = await getStageDrops(key) as Row[];
  } catch {}

  const act = asNumber(pick(stage, ["act"], actFromKey(key)), actFromKey(key));
  const no = asNumber(pick(stage, ["stage_no"], stageNoFromKey(key)), stageNoFromKey(key));
  const level = pick(stage, ["stage_level", "level", "required_level"], no);
  const waves = pick(stage, ["wave_amount", "waves", "wave_count"], 10);
  const mobsWave = pick(stage, ["wave_monster_amount", "mobs_per_wave"], "—");
  const mobs = monsterIds(stage, key);
  const stageType = String(pick(stage, ["stage_type", "type"], "")).toUpperCase();
  const isBossStage = no === 10 || stageType.includes("BOSS") || stageType.includes("ACTBOSS");
  const boss = isBossStage ? String(pick(stage, ["boss_monster_key", "boss_key", "boss"], no === 10 ? `${act}090${act}` : "")) : "";
  const loot = uniqueLoot(stage, drops);

  return (
    <main className={styles.wrap}>
      <Link className={styles.back} href="/stages">← Voltar para fases</Link>

      <section className={styles.hero}>
        <div>
          <span className={styles.kicker}>ATO {act}-{no} | {difficultyLabel(stage, key)} | Nv.{level}</span>
          <h1>{stageTitle(stage, key)}</h1>
          <p>Monstros, chefes, ondas e tabela de saque desta fase.</p>
        </div>
        <Link className={styles.button} href={`/drops?stage=${encodeURIComponent(key)}`}>Ver drops ↗</Link>
      </section>

      <section className={styles.metrics}>
        <div><span>Ondas</span><strong>{waves}</strong></div>
        <div><span>Mobs / onda</span><strong>{mobsWave || "—"}</strong></div>
        <div><span>Tipos de mobs</span><strong>{mobs.length || "—"}</strong></div>
        {boss ? <div><span>Chefe</span><strong>{boss}</strong></div> : null}
      </section>

      <section className={styles.grid}>
        <article className={styles.panel}>
          <h2>Monstros da fase</h2>
          {mobs.length ? (
            <div className={styles.monsters}>
              {mobs.map((id) => (
                <Link className={styles.monsterCard} href={`/monsters/${id}`} key={id}>
                  <img src={monsterSprite(id)} alt={monsterName(id)} />
                  <div>
                    <strong>{monsterName(id)}</strong>
                    <span>Monstro #{id}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>Nenhum monstro cadastrado para esta fase.</p>
          )}
        </article>

        <article className={styles.panel}>
          <h2>Baús e saque</h2>
          {loot.length ? (
            <div className={styles.loot}>
              {loot.map((row, index) => {
                const type = sourceType(row).toUpperCase();
                const name = CHEST_NAMES[type] ?? prettyCode(type);
                const dKey = dropKey(row);
                const rate = dropRate(row);
                return (
                  <Link className={styles.lootRow} href={`/drops?stage=${encodeURIComponent(key)}&drop=${encodeURIComponent(dKey)}`} key={`${type}-${dKey}-${index}`}>
                    <span>▣</span>
                    <div>
                      <strong>{name}</strong>
                      <small>Chave {clean(dKey)}{rate ? ` · taxa ${rate}` : ""}</small>
                    </div>
                    <em>abrir ↗</em>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className={styles.empty}>Nenhuma tabela de saque encontrada no cache local.</p>
          )}
        </article>
      </section>
    </main>
  );
}
