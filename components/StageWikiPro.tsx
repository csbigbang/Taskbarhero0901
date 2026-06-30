"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import styles from "./StageWikiPro.module.css";
import { OFFICIAL_MONSTERS, OFFICIAL_MONSTER_NAMES_PT, OFFICIAL_STAGES } from "@/lib/tbh-official-stage-data";

type AnyRow = Record<string, any>;

type Props = {
  stages?: AnyRow[];
  drops?: AnyRow[];
  dropRows?: AnyRow[];
  monsters?: AnyRow[];
};

const DIFFICULTIES = ["Normal", "Nightmare", "Hell", "Torment"] as const;
const ACTS = [1, 2, 3] as const;

const ACT_MAPS: Record<number, string> = {
  1: "/game-assets/stages/Act1_Bg.png",
  2: "/game-assets/stages/Act2_Bg.png",
  3: "/game-assets/stages/Act3_Bg.png",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  Normal: "Normal",
  Nightmare: "Pesadelo",
  Hell: "Inferno",
  Torment: "Tormento",
};

const STAGE_NAMES_PT: Record<number, string[]> = {
  1: ["Pasto", "Prado Sombrio", "Terra Devastada", "Desfiladeiro Sinistro", "Entrada da Vila em Chamas", "Praça Rumstreet", "Arredores da Cidade", "Cemitério", "Terra Amaldiçoada", "Trono das Trevas"],
  2: ["Caminho do Oásis", "Vale da Tempestade de Areia", "Caverna Subterrânea do Deserto", "Ninho de Insetos", "Dunas Escaldantes", "Ruínas do Pôr do Sol", "Areias da Meia-Noite", "Túmulo Sagrado", "Cripta do Faraó", "Canal Subterrâneo do Faraó"],
  3: ["Posto Avançado Nevado", "Campo de Batalha Congelado", "Entrada da Caverna Glacial", "Caverna Glacial Congelada", "Portão do Inferno", "Desfiladeiro Ardente", "Planícies do Tormento", "Cidadela da Ruína", "Núcleo do Abismo", "Sala de Comando do Inferno"],
};

const NODE_POSITIONS = [
  { x: 47, y: 91 },
  { x: 47, y: 80 },
  { x: 48, y: 69 },
  { x: 48, y: 58 },
  { x: 52, y: 47 },
  { x: 52, y: 36 },
  { x: 60, y: 26 },
  { x: 55, y: 17 },
  { x: 43, y: 10 },
  { x: 50, y: 5 },
];


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
  "20011": "Morcego",
  "20021": "Guerreiro Ratuno",
  "20022": "Arqueiro Ratuno",
  "20023": "Rato da Peste",
  "20024": "Berserker Ratuno",
  "20031": "Cobra",
  "20041": "Inseto Venenoso",
  "20042": "Lorde Venenoso",
  "20051": "Escorpião",
  "20061": "Guarda Kobold",
  "20062": "Atirador Kobold",
  "20071": "Gremlin",
  "20081": "Múmia Pequena",
  "20091": "Geonid",
  "20111": "Yeti",
  "20901": "Soberano do Deserto",
  "20902": "Soberano do Deserto",
  "20903": "Soberano do Deserto",
  "20904": "Soberano do Deserto",
  "30013": "Elmo do Anjo Caído",
  "30041": "Guerreiro da Montanha",
  "30042": "Arqueiro da Montanha",
  "30043": "Guarda da Montanha",
  "30044": "Mago da Montanha",
  "30061": "Ser de Lava",
  "30071": "Sacerdote de Sangue",
  "30081": "Soldado Demoníaco",
  "30082": "Comandante da Legião",
  "30083": "Tropa de Choque Demoníaca",
  "30101": "Sacerdote Infernal do Fogo",
  "30102": "Sacerdote Infernal do Gelo",
  "30103": "Sacerdote Infernal Elétrico",
  "30104": "Sacerdote Infernal do Caos",
  "30111": "Dedo da Morte",
};

const CHEST_NAMES: Record<string, string> = {
  NORMAL_MONSTER_BOX: "Baú de Monstro",
  NORMAL_BOSS_BOX: "Baú de Chefe",
  STAGE_BOSS_BOX: "Baú de Chefe",
  FIRST_CLEAR: "Primeira conclusão",
  ACT_BOSS_BOX: "Baú de Chefe do ato",
};

function pick(row: AnyRow | undefined, keys: string[], fallback: any = undefined) {
  if (!row) return fallback;
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
  }
  return fallback;
}

function asNumber(value: any, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeDifficulty(value: any) {
  const raw = String(value ?? "").toLowerCase();
  if (raw.includes("torment") || raw.includes("tormento") || raw === "4") return "Torment";
  if (raw.includes("hell") || raw.includes("inferno") || raw === "3") return "Hell";
  if (raw.includes("night") || raw.includes("pesadelo") || raw === "2") return "Nightmare";
  return "Normal";
}

function difficultyLabel(value: string) {
  return DIFFICULTY_LABELS[value] ?? value;
}

function stageNamePt(row: AnyRow) {
  const act = getStageAct(row);
  const no = getStageNo(row);
  return STAGE_NAMES_PT[act]?.[no - 1] ?? `Ato ${act}-${no}`;
}

function stageKey(row: AnyRow) {
  return String(pick(row, ["stage_key", "StageKey", "stageKey", "key", "Key", "id", "ID", "stage_id", "StageID"], ""));
}

function getStageAct(row: AnyRow) {
  const direct = asNumber(pick(row, ["act", "Act", "act_no", "ActNo"]), 0);
  if (direct) return direct;
  const key = stageKey(row);
  if (key.length >= 3) return asNumber(key.slice(0, 1), 1);
  return 1;
}

function getStageNo(row: AnyRow) {
  const direct = asNumber(pick(row, ["stage_no", "StageNo", "no", "No", "stage", "Stage"]), 0);
  if (direct) return direct;
  const key = stageKey(row).replace(/\D/g, "");
  if (key.length >= 4) return asNumber(key.slice(-2), 1);
  const m = key.match(/(\d)$/);
  return m ? asNumber(m[1], 1) : 1;
}

function getStageLevel(row: AnyRow) {
  const direct = asNumber(pick(row, ["stage_level", "StageLevel", "required_level", "RequiredLevel", "level", "Level", "lv", "Lv"]), 0);
  if (direct) return direct;
  return getStageNo(row);
}

function getStageDifficulty(row: AnyRow) {
  const direct = pick(row, ["stage_difficulty", "StageDifficulty", "difficulty", "Difficulty", "mode", "Mode", "difficulty_name", "DifficultyName"], "");
  if (direct) return normalizeDifficulty(direct);
  const key = stageKey(row).replace(/\D/g, "");
  const mode = key.length >= 2 ? key[1] : "";
  if (mode === "4") return "Torment";
  if (mode === "3") return "Hell";
  if (mode === "2") return "Nightmare";
  return "Normal";
}

function getStageTitle(row: AnyRow) {
  const ptName = pick(row, ["name_pt_br", "stage_name_pt_br", "name_pt", "display_name_pt_br", "name_ptbr"], "");
  if (ptName) return String(ptName);

  const raw = String(pick(row, ["name", "Name", "stage_name", "StageName", "title", "Title", "name_en_us", "stage_name_en_us"], "") ?? "").trim();
  if (!raw || /^act\s*\d+[-–]\d+$/i.test(raw) || /^stage\s*\d+/i.test(raw)) return stageNamePt(row);
  return raw;
}

function monsterName(id: any) {
  const key = String(id ?? "");
  return OFFICIAL_MONSTER_NAMES_PT[key] ?? MONSTER_NAMES[key] ?? `Monstro #${key}`;
}

function monsterSprite(id: any) {
  const key = String(id ?? "");
  return `/images/monsters/Monster_${key}.png`;
}

function findMonster(monsters: AnyRow[], id: any) {
  const key = String(id ?? "");
  return (
    monsters.find((m) => String(pick(m, ["monster_key", "MonsterKey", "key", "Key", "id", "ID"], "")) === key) ??
    OFFICIAL_MONSTERS.find((m) => String(m.monster_key) === key)
  );
}

function extractMonsterIds(value: any) {
  const raw = String(value ?? "").trim();
  if (!raw) return [];
  const ids: string[] = [];
  for (const token of raw.split(/[\s,;|]+/)) {
    const cleaned = token.trim();
    if (!cleaned) continue;
    const beforeWeight = cleaned.split("_")[0];
    if (/^\d{4,}$/.test(beforeWeight)) ids.push(beforeWeight);
  }
  return Array.from(new Set(ids));
}

function fallbackMonsterIds(stage: AnyRow) {
  const act = getStageAct(stage);
  const no = getStageNo(stage);
  return STAGE_MONSTER_FALLBACK[act]?.[no] ?? [];
}

function getMonsterIds(stage: AnyRow, drops: AnyRow[]) {
  const raw = pick(stage, ["monsters", "Monsters", "monster_keys", "MonsterKeys", "mobs", "Mobs", "mob_keys", "MobKeys", "monster_list", "MonsterList"], "");
  let ids = extractMonsterIds(raw);

  if (!ids.length) {
    ids = drops.flatMap((d) => extractMonsterIds(pick(d, ["monster_key", "MonsterKey", "mob_key", "MobKey", "source_key", "SourceKey"], "")));
  }

  if (!ids.length) {
    ids = fallbackMonsterIds(stage);
  }

  return Array.from(new Set(ids)).slice(0, 8);
}

function getBossId(stage: AnyRow) {
  const no = getStageNo(stage);
  const type = String(pick(stage, ["stage_type", "StageType", "type", "Type"], "")).toUpperCase();
  const isBossStage = no === 10 || type.includes("BOSS") || type.includes("ACTBOSS");
  if (!isBossStage) return "";

  const boss = pick(stage, ["boss_monster_key", "BossMonsterKey", "boss_key", "BossKey", "boss", "Boss", "boss_id", "BossID"], "");
  if (boss) return String(boss);

  const act = getStageAct(stage);
  return `${act}090${act}`;
}

function dropStageKey(row: AnyRow) {
  return String(pick(row, ["stage_key", "StageKey", "stageKey", "stage_id", "StageID"], ""));
}

function sourceType(row: AnyRow) {
  return String(pick(row, ["source_type", "SourceType", "type", "Type", "drop_type", "DropType"], "DROP"));
}

function dropKey(row: AnyRow) {
  return String(pick(row, ["drop_key", "DropKey", "item_key", "ItemKey", "reward_key", "RewardKey", "key", "Key"], ""));
}

function getRate(row: AnyRow) {
  return pick(row, ["source_rate", "SourceRate", "rate", "Rate", "weight", "Weight", "drop_rate", "DropRate", "chance", "Chance"], "");
}

function uniqueDrops(rows: AnyRow[]) {
  const map = new Map<string, AnyRow>();
  for (const row of rows) {
    const id = `${sourceType(row)}:${dropKey(row)}:${getRate(row)}`;
    if (!map.has(id)) map.set(id, row);
  }
  return Array.from(map.values());
}

function stageIndexFromLevel(level: number) {
  return Math.max(0, Math.min(9, level - 1));
}

function localStagesForActMode(stages: AnyRow[], act: number, difficulty: string) {
  return stages
    .filter((s) => getStageAct(s) === act && getStageDifficulty(s) === difficulty)
    .sort((a, b) => getStageNo(a) - getStageNo(b));
}

function fallbackStages() {
  const rows: AnyRow[] = [];
  for (const act of ACTS) {
    for (const difficulty of DIFFICULTIES) {
      for (let lv = 1; lv <= 10; lv++) {
        rows.push({
          stage_key: `${act}${DIFFICULTIES.indexOf(difficulty) + 1}${String(lv).padStart(2, "0")}`,
          act,
          difficulty,
          stage_no: lv,
          stage_level: lv,
          name: STAGE_NAMES_PT[act]?.[lv - 1] ?? `Ato ${act}-${lv}`,
          wave_count: 10,
          mobs_per_wave: 1,
          mob_types: 2,
          monsters: (STAGE_MONSTER_FALLBACK[act]?.[lv] ?? []).join("|"),
          boss_monster_key: lv === 10 ? (act === 1 ? "10904" : act === 2 ? "20904" : "30111") : "",
        });
      }
    }
  }
  return rows;
}

function stageLootRows(stage: AnyRow) {
  const rows: AnyRow[] = [
    {
      source_type: "NORMAL_MONSTER_BOX",
      drop_key: pick(stage, ["monster_drop_item_key", "MonsterDropItemKey"], ""),
      source_rate: pick(stage, ["monster_drop_item_rate", "MonsterDropItemRate"], ""),
    },
    {
      source_type: "STAGE_BOSS_BOX",
      drop_key: pick(stage, ["boss_drop_item_key", "BossDropItemKey"], ""),
      source_rate: pick(stage, ["boss_drop_item_rate", "BossDropItemRate"], ""),
    },
    {
      source_type: "FIRST_CLEAR",
      drop_key: pick(stage, ["first_clear_drop_key", "FirstClearDropKey"], ""),
      source_rate: "1x",
    },
  ];
  return rows.filter((row) => dropKey(row));
}

function translateElement(value: any) {
  const raw = String(value ?? "").toLowerCase();
  if (raw.includes("fire") || raw.includes("fogo")) return "Fogo";
  if (raw.includes("ice") || raw.includes("gelo")) return "Gelo";
  if (raw.includes("light") || raw.includes("thunder") || raw.includes("raio")) return "Raio";
  if (raw.includes("poison") || raw.includes("veneno")) return "Veneno";
  if (raw.includes("chaos") || raw.includes("caos")) return "Caos";
  if (raw.includes("dark") || raw.includes("sombra")) return "Sombrio";
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "Físico";
}

function RealImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}

function MonsterIcon({ id, large = false }: { id: any; large?: boolean }) {
  return (
    <div className={large ? styles.monsterIconLarge : styles.monsterIcon}>
      <RealImage src={monsterSprite(id)} alt={monsterName(id)} className={styles.monsterSprite} />
    </div>
  );
}

export default function StageWikiPro(props: Props) {
  const [stages, setStages] = useState<AnyRow[]>(OFFICIAL_STAGES);
  const [drops, setDrops] = useState<AnyRow[]>(props.drops ?? props.dropRows ?? []);
  const [monsters, setMonsters] = useState<AnyRow[]>(props.monsters?.length ? props.monsters : OFFICIAL_MONSTERS);
  const [difficulty, setDifficulty] = useState<string>("Normal");
  const [act, setAct] = useState<number>(1);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [hoverKey, setHoverKey] = useState<string>("");

  useEffect(() => {
    // Dados oficiais embutidos extraídos do jogo.
    // Só aceita dados externos se vierem completos, para evitar cache incompleto.
    if ((props.stages?.length ?? 0) >= 120) setStages(props.stages ?? OFFICIAL_STAGES);
  }, [props.stages]);

  const visibleStages = useMemo(() => {
    const live = localStagesForActMode(stages.length ? stages : fallbackStages(), act, difficulty);
    return live.length ? live : localStagesForActMode(fallbackStages(), act, difficulty);
  }, [stages, act, difficulty]);

  const selected = useMemo(() => {
    const byKey = visibleStages.find((s) => stageKey(s) === selectedKey);
    return byKey ?? visibleStages[0] ?? null;
  }, [visibleStages, selectedKey]);

  const previewStage = useMemo(() => {
    return visibleStages.find((s) => stageKey(s) === hoverKey) ?? selected;
  }, [visibleStages, hoverKey, selected]);

  useEffect(() => {
    if (selected) setSelectedKey(stageKey(selected));
  }, [act, difficulty, selected?.stage_key]);

  useEffect(() => {
    if (!selected) return;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return;
    const key = stageKey(selected);
    if (!key) return;
    const hasLocal = drops.some((d) => dropStageKey(d) === key);
    if (hasLocal) return;
    const supabase = createClient(url, anon, { auth: { persistSession: false } });
    let cancelled = false;
    async function run() {
      const { data } = await supabase.from("tbh_stage_drop_items").select("*").eq("stage_key", key).limit(500);
      if (!cancelled && data?.length) setDrops((old) => [...old.filter((d) => dropStageKey(d) !== key), ...data]);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [selectedKey]);

  const stageDrops = useMemo(() => (selected ? drops.filter((d) => dropStageKey(d) === stageKey(selected)) : []), [drops, selected]);
  const lootRows = useMemo(() => (selected ? uniqueDrops([...stageLootRows(selected), ...stageDrops]).slice(0, 8) : []), [selected, stageDrops]);
  const monsterIds = useMemo(() => (selected ? getMonsterIds(selected, stageDrops) : []), [selected, stageDrops]);
  const bossId = selected ? getBossId(selected) : "";

  if (!selected) {
    return (
      <section className={styles.stageWrap}>
        <div className={styles.heroPanel}>
          <p>Não foi possível carregar as fases.</p>
        </div>
      </section>
    );
  }

  const selectedNo = getStageNo(selected);
  const selectedLevel = getStageLevel(selected);
  const waves = pick(selected, ["wave_amount", "WaveAmount", "waves", "Ondas", "wave_count", "OndaCount", "Onda", "wave"], 10);
  const mobsPerOnda = pick(selected, ["wave_monster_amount", "WaveMonsterAmount", "mobs_per_wave", "MobsPerOnda", "mob_per_wave", "MobPerOnda"], 1);
  const mobTypes = pick(selected, ["mob_types", "MobTypes", "monster_types", "MonsterTypes"], monsterIds.length || 2);

  const previewNo = previewStage ? getStageNo(previewStage) : selectedNo;
  const previewLevel = previewStage ? getStageLevel(previewStage) : selectedLevel;
  const previewWaves = previewStage ? pick(previewStage, ["wave_amount", "WaveAmount", "waves", "Ondas", "wave_count", "OndaCount", "Onda", "wave"], 10) : waves;
  const previewMobs = previewStage ? pick(previewStage, ["wave_monster_amount", "WaveMonsterAmount", "mobs_per_wave", "MobsPerOnda", "mob_per_wave", "MobPerOnda"], 1) : mobsPerOnda;
  const previewMobIds = previewStage ? getMonsterIds(previewStage, stageDrops) : monsterIds;
  const previewMob = previewMobIds[0] || "";
  const previewPos = NODE_POSITIONS[stageIndexFromLevel(previewNo)];

  return (
    <section className={styles.stageWrap}>
      <div className={styles.heroPanel}>
        <div>
          <span className={styles.kicker}>Fases e Rotas</span>
          <h1>Fases</h1>
          <p>3 atos | 4 dificuldades | 120 fases — monstros, chefes e tabelas de saque.</p>
        </div>
        <div className={styles.statSummary}>
          <div><strong>3</strong><span>Atos</span></div>
          <div><strong>4</strong><span>Modos</span></div>
          <div><strong>120</strong><span>Fases</span></div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <aside className={styles.mapPanel}>
          <label className={styles.modeSelector}>
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
              {DIFFICULTIES.map((mode) => (
                <option key={mode} value={mode}>{difficultyLabel(mode)}</option>
              ))}
            </select>
            <b>▼</b>
          </label>

          <div className={styles.actTabs}>
            {ACTS.map((n) => (
              <button key={n} type="button" className={act === n ? styles.actActive : ""} onClick={() => setAct(n)}>ATO {n}</button>
            ))}
          </div>

          <div className={styles.mapBox}>
            <RealImage src={ACT_MAPS[act]} alt={`Ato ${act}`} className={styles.actMapImage} />
            {visibleStages.map((stage) => {
              const no = getStageNo(stage);
              const pos = NODE_POSITIONS[stageIndexFromLevel(no)];
              const active = stageKey(stage) === stageKey(selected);
              return (
                <button
                  key={stageKey(stage)}
                  type="button"
                  title={`Ato ${act}-${no}`}
                  className={`${styles.stageNode} ${active ? styles.stageNodeActive : ""} ${no === 10 ? styles.stageNodeBoss : ""}`}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  onMouseEnter={() => setHoverKey(stageKey(stage))}
                  onMouseLeave={() => setHoverKey("")}
                  onFocus={() => setHoverKey(stageKey(stage))}
                  onBlur={() => setHoverKey("")}
                  onClick={() => setSelectedKey(stageKey(stage))}
                >
                  <span>{act}-{no}</span>
                </button>
              );
            })}
            {previewStage && (
              <div
                className={styles.stageTooltip}
                style={{
                  left: `${Math.min(70, Math.max(28, previewPos.x + 18))}%`,
                  top: `${Math.min(72, Math.max(18, previewPos.y - 8))}%`,
                }}
              >
                <strong>{getStageTitle(previewStage)}</strong>
                <div className={styles.tooltipBody}>
                  {previewMob ? <MonsterIcon id={previewMob} large /> : null}
                  <div>
                    <b>ATO {act} | FASE {previewNo}</b>
                    <span>{difficultyLabel(difficulty)} | Nv.{previewLevel}</span>
                    <em>{previewMob ? monsterName(previewMob) : "Dados da fase"}</em>
                  </div>
                </div>
                <div className={styles.tooltipStats}>
                  <span>Ondas <b>{previewWaves}</b></span>
                  <span>Mobs / onda <b>{previewMobs || "—"}</b></span>
                  <span>Tipos <b>{previewMobIds.length || 2}</b></span>
                </div>
              </div>
            )}
          </div>
          <p className={styles.mapHint}>Ato {act} | {difficultyLabel(difficulty)} — clique em um nó para inspecionar.</p>
        </aside>

        <article className={styles.detailPanel}>
          <div className={styles.detailHead}>
            <div>
              <span className={styles.kicker}>ATO {act}-{selectedNo} | Nv. {selectedLevel}</span>
              <h2>{getStageTitle(selected)}</h2>
              <p>{String(pick(selected, ["name_en", "NameEN", "desc", "description", "Description"], "Dados extraídos do jogo."))}</p>
            </div>
            <a className={styles.smallButton} href={`/stages/${encodeURIComponent(stageKey(selected))}`}>Página completa ↗</a>
          </div>

          <div className={styles.metrics}>
            <div><span>Ondas</span><strong>{waves}</strong></div>
            <div><span>Mobs / onda</span><strong>{mobsPerOnda || "—"}</strong></div>
            <div><span>Tipos de mobs</span><strong>{mobTypes}</strong></div>
            {bossId ? <div><span>Chefe</span><strong>{bossId}</strong></div> : null}
          </div>

          <section className={styles.block}>
            <h3>Monstros</h3>
            <div className={styles.monsterTable}>
              <div className={styles.tableHeader}><span>Monstro</span><span>Aparição</span><span>Elemento</span><span>Chave</span></div>
              {monsterIds.length ? monsterIds.map((id, index) => {
                const mob = findMonster(monsters, id);
                const element = translateElement(pick(mob, ["element", "Element", "damage_type", "DamageType"], "Físico"));
                return (
                  <a href={`/monsters/${id}`} className={styles.monsterRow} key={`${id}-${index}`}>
                    <span className={styles.mobIdentity}><MonsterIcon id={id} /> {monsterName(id)}</span>
                    <span>100%</span>
                    <span className={styles.badge}>{String(element).toUpperCase()}</span>
                    <span>{id}</span>
                  </a>
                );
              }) : <p className={styles.empty}>Nenhum monstro encontrado para esta fase.</p>}
            </div>
          </section>

          {bossId && (
            <section className={styles.block}>
              <h3>Chefe</h3>
              <a href={`/monsters/${bossId}`} className={styles.bossCard}>
                <MonsterIcon id={bossId} large />
                <div>
                  <strong>{monsterName(bossId)}</strong>
                  <span>Chefe · Monstro #{bossId}</span>
                </div>
                <em>abrir chefe ↗</em>
              </a>
            </section>
          )}

          <section className={styles.block}>
            <h3>Baús e Saque</h3>
            <div className={styles.lootList}>
              {lootRows.length ? lootRows.map((row, index) => {
                const type = sourceType(row).toUpperCase();
                const key = dropKey(row);
                const name = CHEST_NAMES[type] ?? type.replace(/_/g, " ");
                const rate = getRate(row);
                return (
                  <a key={`${type}-${key}-${index}`} className={styles.lootRow} href={`/drops?stage=${encodeURIComponent(stageKey(selected))}&drop=${encodeURIComponent(key)}`}>
                    <span className={styles.lootIcon}>▣</span>
                    <span><strong>{name}</strong><small>Chave {key}{rate ? ` · taxa ${rate}` : ""}</small></span>
                    <em>abrir ↗</em>
                  </a>
                );
              }) : <p className={styles.empty}>Drops desta fase não encontrados no cache local.</p>}
            </div>
          </section>

          <div className={styles.actions}>
            <a href={`/drops?stage=${encodeURIComponent(stageKey(selected))}`}>Ver drops</a>
            <a href={`/farm/optimizer?stage=${encodeURIComponent(stageKey(selected))}`}>Farmar</a>
            {bossId && <a href={`/monsters/${bossId}`}>Chefe</a>}
          </div>
        </article>
      </div>
    </section>
  );
}
