"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./StageWikiBrowser.module.css";

export type StageWikiRow = {
  stage_key: string;
  stage_name_key?: string | null;
  stage_type?: string | null;
  stage_difficulty?: string | null;
  act?: string | null;
  stage_no?: string | null;
  stage_level?: string | null;
  next_stage_key?: string | null;
  wave_amount?: string | null;
  wave_monster_amount?: string | null;
  monsters?: string | null;
  monster_drop_item_key?: string | null;
  monster_drop_item_rate?: string | null;
  boss_drop_item_key?: string | null;
  boss_drop_item_rate?: string | null;
  first_clear_drop_key?: string | null;
  boss_monster_key?: string | null;
  boss_damage_multiplier?: string | null;
  boss_hp_multiplier?: string | null;
  boss_gold_multiplier?: string | null;
  boss_exp_multiplier?: string | null;
  boss_scale?: string | null;
  soulstone_item_key?: string | null;
  soulstone_amount?: string | null;
  bgm_sound_key?: string | null;
  name_pt_br?: string | null;
  name_en_us?: string | null;
};

type Difficulty = "NORMAL" | "NIGHTMARE" | "HELL" | "TORMENT";

type DifficultyMeta = {
  key: Difficulty;
  label: string;
  asset: string;
  color: string;
  short: string;
};

const DIFFICULTIES: DifficultyMeta[] = [
  { key: "NORMAL", label: "Normal", short: "N", color: "#c07a29", asset: "/game-assets/stages/Ui_Portal_Bg_Decor_Normal.png" },
  { key: "NIGHTMARE", label: "Nightmare", short: "NM", color: "#1890a4", asset: "/game-assets/stages/Ui_Portal_Bg_Decor_Nightmare.png" },
  { key: "HELL", label: "Hell", short: "H", color: "#e05c20", asset: "/game-assets/stages/Ui_Portal_Bg_Decor_Hell.png" },
  { key: "TORMENT", label: "Torment", short: "T", color: "#c22a34", asset: "/game-assets/stages/Ui_Portal_Bg_Decor_Torment_Lock.png" },
];

const ACT_LABELS: Record<string, string> = { "1": "Ato 1", "2": "Ato 2", "3": "Ato 3" };
const ACT_BG: Record<string, string> = {
  "1": "/game-assets/stages/Act1_Bg.png",
  "2": "/game-assets/stages/Act2_Bg.png",
  "3": "/game-assets/stages/Act3_Bg.png",
};

const NODE_POSITIONS: Array<{ left: string; top: string }> = [
  { left: "49%", top: "86%" },
  { left: "46%", top: "76%" },
  { left: "52%", top: "67%" },
  { left: "47%", top: "58%" },
  { left: "54%", top: "49%" },
  { left: "49%", top: "40%" },
  { left: "56%", top: "31%" },
  { left: "51%", top: "22%" },
  { left: "59%", top: "14%" },
  { left: "54%", top: "6%" },
];

const SCENE_PREFIX_BY_ACT_STAGE: Record<string, string> = {
  "1-1": "1101", "1-2": "1102", "1-3": "1103", "1-4": "1104", "1-5": "1101", "1-6": "1102", "1-7": "1103", "1-8": "1108", "1-9": "1108", "1-10": "1110",
  "2-1": "1201", "2-2": "1201", "2-3": "1203", "2-4": "1203", "2-5": "1205", "2-6": "1206", "2-7": "1207", "2-8": "1208", "2-9": "1208", "2-10": "1210",
  "3-1": "1301", "3-2": "1301", "3-3": "1303", "3-4": "1303", "3-5": "1305", "3-6": "1306", "3-7": "1306", "3-8": "1308", "3-9": "1308", "3-10": "1310",
};

const SCENE_ASSETS: Record<string, string[]> = {
  "1101": ["1101_Layer3_Castle1_sheet.png", "1101_Layer3_Castle2_sheet.png", "1101_Layer2_House1_sheet.png", "1101_Layer2_House5_sheet.png", "1101_Layer1_House2_sheet.png", "1101_Layer1_House8_sheet.png"],
  "1102": ["1102_Layer3_Castle1_sheet.png", "1102_Layer3_Castle2_sheet.png", "1102_Layer2_Tree1.png", "1102_Layer1_House2.png", "1102_Layer1_House8.png", "1102_Layer1_House10.png"],
  "1103": ["1103_Layer3_Forest1.png", "1103_Layer3_Forest2.png", "1103_Layer3_Mt1.png", "1103_Layer2_Tree1.png", "1103_Layer2_Bush1.png", "1103_Layer1_Stone1.png"],
  "1104": ["1104_Layer2_Mt1.png", "1104_Layer2_Mt2.png", "1104_Layer2_Mt5.png", "1104_Layer1_Stone1.png", "1104_Layer1_Stone4.png", "1104_Layer0_Stone5.png"],
  "1108": ["1108_Layer2_Tomb1.png", "1108_Layer2_Tomb3.png", "1108_Layer2_Tree8.png", "1108_Layer1_Tomb1.png", "1108_Layer1_Tree4.png", "1108_Layer0_Tomb5.png"],
  "1110": ["1110_Layer2_Castle3.png", "1110_Layer2_Castle4.png", "1110_Layer1_Castle1.png", "1110_Layer1_Castle2.png", "1110_Layer0_Pillar1.png", "1110_Layer0_Wall2.png"],
  "1201": ["1201_Layer3_01.png", "1201_Layer3_04.png", "1201_Layer2_01.png", "1201_Layer2_03.png", "1201_Layer1_02.png", "1201_Layer1_08.png"],
  "1203": ["1203_Layer3_01.png", "1203_Layer3_04.png", "1203_Layer2_02.png", "1203_Layer2_05.png", "1203_Layer1_01.png", "1203_Layer1_09.png"],
  "1205": ["1205_Layer3_01.png", "1205_Layer3_05.png", "1205_Layer2_01.png", "1205_Layer2_07.png", "1205_Layer1_01.png", "1205_Layer1_10.png"],
  "1206": ["1206_Layer3_02.png", "1206_Layer3_07.png", "1206_Layer2_01.png", "1206_Layer2_08.png", "1206_Layer1_01.png", "1206_Layer1_10.png"],
  "1207": ["1207_Layer3_01.png", "1207_Layer3_07.png", "1207_Layer2_01.png", "1207_Layer2_08.png", "1207_Layer1_02.png", "1207_Layer1_10.png"],
  "1208": ["1208_Layer3_01.png", "1208_Layer3_07.png", "1208_Layer2_01.png", "1208_Layer2_08.png", "1208_Layer1_01.png", "1208_Layer1_09.png"],
  "1210": ["1210_Layer3_01.png", "1210_Layer3_05.png", "1210_Layer2_01.png", "1210_Layer2_06.png", "1210_Layer1_01.png", "1210_Layer1_07.png"],
  "1301": ["1301_Layer3_01.png", "1301_Layer3_07.png", "1301_Layer2_01.png", "1301_Layer2_08.png", "1301_Layer1_01.png", "1301_Layer1_09.png"],
  "1303": ["1303_Layer3_01.png", "1303_Layer3_07.png", "1303_Layer2_01.png", "1303_Layer2_08.png", "1303_Layer1_01.png", "1303_Layer1_08.png"],
  "1305": ["1305_Layer3_01.png", "1305_Layer3_07.png", "1305_Layer2_01.png", "1305_Layer2_08.png", "1305_Layer1_02.png", "1305_Layer1_10.png"],
  "1306": ["1306_Layer3_01.png", "1306_Layer3_07.png", "1306_Layer2_01.png", "1306_Layer2_08.png", "1306_Layer1_01.png", "1306_Layer1_10.png"],
  "1308": ["1308_Layer3_01.png", "1308_Layer3_07.png", "1308_Layer2_01.png", "1308_Layer2_08.png", "1308_Layer1_01.png", "1308_Layer1_10.png"],
  "1310": ["1310_Layer3_01.png", "1310_Layer3_05.png", "1310_Layer2_01.png", "1310_Layer2_06.png", "1310_Layer1_01.png", "1310_Layer1_07.png"],
};

function asText(value: unknown, fallback = "-") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function asNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function stageName(stage: StageWikiRow | null | undefined) {
  if (!stage) return "Fase";
  return stage.name_pt_br || stage.name_en_us || `Fase ${stage.stage_key}`;
}

function normalizeDifficulty(value?: string | null): Difficulty {
  const v = String(value ?? "NORMAL").toUpperCase();
  if (v === "NIGHTMARE" || v === "HELL" || v === "TORMENT") return v;
  return "NORMAL";
}

function mobEntries(stage: StageWikiRow | null) {
  const raw = stage?.monsters ?? "";
  return raw.split(/\s+/).map((part) => {
    const [key, weight] = part.split("_");
    return { key, weight: asNumber(weight) };
  }).filter((entry) => entry.key);
}

function mobTypeCount(stage: StageWikiRow | null) {
  return mobEntries(stage).length;
}

function scenePrefix(stage: StageWikiRow | null) {
  if (!stage) return "1101";
  return SCENE_PREFIX_BY_ACT_STAGE[`${stage.act}-${stage.stage_no}`] ?? `1${stage.act}${String(stage.stage_no ?? "1").padStart(2, "0")}`;
}

function StageAssetImage(props: { src: string; className?: string; alt?: string }) {
  return <img src={props.src} alt={props.alt ?? ""} className={props.className} onError={(event) => { event.currentTarget.style.display = "none"; }} />;
}

function StageScene({ stage }: { stage: StageWikiRow | null }) {
  const prefix = scenePrefix(stage);
  const files = SCENE_ASSETS[prefix] ?? SCENE_ASSETS["1101"];
  return (
    <div className={styles.stageScene}>
      <div className={styles.sceneSky} />
      {files.map((file, index) => (
        <StageAssetImage
          key={`${prefix}-${file}`}
          src={`/game-assets/misc/${file}`}
          className={`${styles.sceneLayer} ${styles[`layer${Math.min(index, 5)}`] ?? ""}`}
          alt=""
        />
      ))}
      <div className={styles.sceneGlow} />
    </div>
  );
}

function DifficultyButton({ meta, active, onClick }: { meta: DifficultyMeta; active: boolean; onClick: () => void }) {
  return (
    <button className={`${styles.difficultyBtn} ${active ? styles.difficultyActive : ""}`} style={{ ["--mode-color" as string]: meta.color }} onClick={onClick} type="button">
      <StageAssetImage src={meta.asset} className={styles.difficultyDecor} alt="" />
      <span>{meta.label}</span>
      <b>{active ? "▲" : "▼"}</b>
    </button>
  );
}

function StageNode({ stage, active, onClick, index }: { stage?: StageWikiRow; active: boolean; onClick: () => void; index: number }) {
  const pos = NODE_POSITIONS[index] ?? { left: "50%", top: "50%" };
  const isBoss = stage?.stage_type === "ACTBOSS" || String(stage?.stage_no) === "10";
  return (
    <button
      type="button"
      className={`${styles.stageNode} ${active ? styles.nodeActive : ""} ${isBoss ? styles.nodeBoss : ""}`}
      style={{ left: pos.left, top: pos.top }}
      onClick={onClick}
      title={stage ? `${stageName(stage)} [${stage.act}-${stage.stage_no}]` : "Fase"}
    >
      <StageAssetImage src={isBoss ? "/game-assets/monsters/StageIcon_Locked_ActBoss.png" : "/game-assets/stages/StageIcon_Occupied_Base.png"} alt="" />
      <span>{stage ? `[${stage.act}-${stage.stage_no}]` : index + 1}</span>
    </button>
  );
}

function LootPanel({ stage }: { stage: StageWikiRow | null }) {
  const entries = [
    { label: "Baú de Monstro", key: stage?.monster_drop_item_key, rate: stage?.monster_drop_item_rate, icon: "/game-assets/monsters/Chest_NormalBoss.png" },
    { label: "Baú de Chefe", key: stage?.boss_drop_item_key, rate: stage?.boss_drop_item_rate, icon: "/game-assets/monsters/Chest_ActBoss.png" },
    { label: "Primeira Conclusão", key: stage?.first_clear_drop_key, rate: "1x", icon: "/game-assets/monsters/Icon_BossSoulstone.png" },
  ].filter((entry) => entry.key);

  if (!entries.length) {
    return <p className={styles.emptyText}>Drops especiais não listados diretamente nessa fase.</p>;
  }

  return (
    <div className={styles.lootList}>
      {entries.map((entry) => (
        <Link key={`${entry.label}-${entry.key}`} href={`/drops?q=${entry.key}`} className={styles.lootRow}>
          <span className={styles.lootIcon}><StageAssetImage src={entry.icon} alt="" /></span>
          <span>
            <b>{entry.label}</b>
            <small>Key {entry.key} {entry.rate ? `· rate ${entry.rate}` : ""}</small>
          </span>
          <em>abrir →</em>
        </Link>
      ))}
    </div>
  );
}

function MonsterPanel({ stage }: { stage: StageWikiRow | null }) {
  const entries = mobEntries(stage).slice(0, 8);
  if (!entries.length && !stage?.boss_monster_key) {
    return <p className={styles.emptyText}>Esta é uma fase de boss/ato sem lista de wave no banco.</p>;
  }

  return (
    <div className={styles.monsterTable}>
      {entries.map((entry) => (
        <Link href={`/monsters/${entry.key}`} key={entry.key} className={styles.monsterLine}>
          <span><StageAssetImage src="/game-assets/monsters/OndaSlider_DemonIcon_NormalMonster.png" alt="" /></span>
          <b>Monstro {entry.key}</b>
          <em>{entry.weight ? `${(entry.weight / 10).toFixed(0)}% peso` : "wave"}</em>
        </Link>
      ))}
      {stage?.boss_monster_key && (
        <Link href={`/monsters/${stage.boss_monster_key}`} className={`${styles.monsterLine} ${styles.bossLine}`}>
          <span><StageAssetImage src="/game-assets/monsters/OndaSlider_DemonIcon_ActBossAnim.png" alt="" /></span>
          <b>Chefe {stage.boss_monster_key}</b>
          <em>abrir boss →</em>
        </Link>
      )}
    </div>
  );
}

export default function StageWikiBrowser({ stages }: { stages: StageWikiRow[] }) {
  const [difficulty, setDifficulty] = useState<Difficulty>("NORMAL");
  const [act, setAct] = useState("1");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const byKey = new Map(stages.map((stage) => [String(stage.stage_key), stage]));
    const list = stages.slice().sort((a, b) => asNumber(a.stage_key) - asNumber(b.stage_key));
    return { byKey, list };
  }, [stages]);

  const activeStages = useMemo(() => grouped.list.filter((stage) => normalizeDifficulty(stage.stage_difficulty) === difficulty && String(stage.act) === act), [grouped.list, difficulty, act]);

  const selected = useMemo(() => {
    const existing = selectedKey ? grouped.byKey.get(selectedKey) : null;
    if (existing && normalizeDifficulty(existing.stage_difficulty) === difficulty && String(existing.act) === act) return existing;
    return activeStages[0] ?? grouped.list[0] ?? null;
  }, [selectedKey, activeStages, grouped.byKey, grouped.list, difficulty, act]);

  const selectedMeta = DIFFICULTIES.find((item) => item.key === difficulty) ?? DIFFICULTIES[0];

  return (
    <main className={styles.shell}>
      <section className={styles.heroPanel}>
        <div>
          <span className={styles.kicker}>Fases e Rotas</span>
          <h1>Fases</h1>
          <p>Mapa de fases no padrão wiki, com todos os modos, atos, nodes clicáveis, informações de waves, boss e drops usando assets reais do jogo.</p>
        </div>
        <div className={styles.heroStats}>
          <div><strong>3</strong><span>acts</span></div>
          <div><strong>4</strong><span>modos</span></div>
          <div><strong>{stages.length}</strong><span>stages</span></div>
        </div>
      </section>

      <section className={styles.stageBoard}>
        <div className={styles.leftColumn}>
          <div className={styles.modeStack}>
            {DIFFICULTIES.map((meta) => (
              <DifficultyButton key={meta.key} meta={meta} active={difficulty === meta.key} onClick={() => { setDifficulty(meta.key); setSelectedKey(null); }} />
            ))}
          </div>

          <div className={styles.actTabs}>
            {["1", "2", "3"].map((item) => (
              <button type="button" key={item} onClick={() => { setAct(item); setSelectedKey(null); }} className={act === item ? styles.actActive : ""}>{ACT_LABELS[item]}</button>
            ))}
          </div>

          <div className={styles.mapFrame} style={{ ["--mode-color" as string]: selectedMeta.color }}>
            <StageAssetImage src={ACT_BG[act]} className={styles.actBg} alt={`Mapa do ato ${act}`} />
            <div className={styles.nodeLayer}>
              {Array.from({ length: 10 }).map((_, index) => {
                const stage = activeStages.find((entry) => String(entry.stage_no) === String(index + 1));
                return (
                  <StageNode
                    key={`${difficulty}-${act}-${index}`}
                    stage={stage}
                    index={index}
                    active={String(stage?.stage_key) === String(selected?.stage_key)}
                    onClick={() => stage && setSelectedKey(stage.stage_key)}
                  />
                );
              })}
            </div>
          </div>
          <small className={styles.mapHint}>{ACT_LABELS[act]} | {selectedMeta.label} - clique em uma fase para inspecionar.</small>
        </div>

        <aside className={styles.detailPanel}>
          <div className={styles.detailTop}>
            <div>
              <span className={styles.stageTag}>ATO {asText(selected?.act)}-{asText(selected?.stage_no)} | Nível {asText(selected?.stage_level)}</span>
              <h2>{stageName(selected)}</h2>
              <p>{selected?.name_en_us && selected?.name_en_us !== selected?.name_pt_br ? selected.name_en_us : "Dados extraídos do jogo."}</p>
            </div>
            <Link href={`/drops?q=${selected?.stage_key ?? ""}`} className={styles.fullPage}>Drops ↗</Link>
          </div>

          <div className={styles.previewWrap}>
            <StageScene stage={selected} />
          </div>

          <div className={styles.infoGrid}>
            <div><span>Ondas</span><strong>{asText(selected?.wave_amount)}</strong></div>
            <div><span>Mobs / Onda</span><strong>{asText(selected?.wave_monster_amount)}</strong></div>
            <div><span>Mob Types</span><strong>{mobTypeCount(selected)}</strong></div>
            <div><span>Chefe</span><strong>{asText(selected?.boss_monster_key)}</strong></div>
          </div>

          <div className={styles.sectionTitle}>Monsters</div>
          <MonsterPanel stage={selected} />

          <div className={styles.sectionTitle}>Chests & Loot</div>
          <LootPanel stage={selected} />

          <div className={styles.quickActions}>
            <Link href={`/drops?q=${selected?.stage_key ?? ""}`}>Ver drops</Link>
            <Link href={`/farm/optimizer?q=${selected?.stage_key ?? ""}`}>Farmar</Link>
            <Link href={`/monsters?q=${selected?.boss_monster_key ?? ""}`}>Chefe</Link>
          </div>
        </aside>
      </section>
    </main>
  );
}
