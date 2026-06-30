import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const gameAssets = path.join(root, "public", "game-assets");
const defaultRipperAssets = process.platform === "win32" ? "C:\\imagens-thb\\Assets" : "/mnt/data/Assets";
const extraSource = process.argv[2] ? path.resolve(process.argv[2]) : defaultRipperAssets;
const outDir = path.join(root, "public", "images", "monsters");
const codexPath = path.join(root, "lib", "monster-codex-data.ts");
const componentPath = path.join(root, "components", "MonsterBestiary.tsx");
const reportPath = path.join(outDir, "monster-sprite-report.json");
const IMAGE_EXTS = new Set([".png", ".webp", ".gif", ".jpg", ".jpeg"]);
const FRAME_NAMES = ["idle", "walk", "attack"];

const FALLBACK_ALIASES = {
  10011: ["BasicSlime_Idle_character", "BasicSlime_Walk_character", "BasicSlime_Attack1_merged"],
  10021: ["BasicGoblin_Idle_character", "BasicGoblin_Walk_character", "BasicGoblin_Attack1_character"],
  10022: ["AssassinGoblin_Idle_character", "AssassinGoblin_Walk_character", "AssassinGoblin_Attack1_Merged"],
  10023: ["ShamanGoblin_Idle_character", "ShamanGoblin_Walk_character", "ShamanGoblin_Attack1_character"],
  10031: ["BasicBat_Idle_character", "BasicBat_Walk_character", "BasicBat_Attack1_character"],
  10041: ["BasicOrc_Idle_character", "BasicOrc_Walk_character", "BasicOrc_Attack1_merged"],
  10042: ["ArmoredOrc_Idle_character", "ArmoredOrc_Walk_character", "ArmoredOrc_BaseAttack1_merged"],
  10043: ["EliteOrc_Idle_character", "EliteOrc_Walk_character", "EliteOrc_Attack1_merged"],
  10051: ["Skeleton_Idle_character", "Skeleton_Walk_character", "Skeleton_BaseAttack1_merged"],
  10052: ["SkeletonArcher_Idle_character", "SkeletonArcher_Walk_character", "SkeletonArcher_BaseAttack1_merged"],
  10053: ["SkeletonKnight_Idle_character", "SkeletonKnight_Walk_character", "SkeletonKnight_LightAttack_Merged"],
  10901: ["SkeletonKnight_Idle_character", "SkeletonKnight_Walk_character", "SkeletonKnight_HeavyAttack_character"],
  10902: ["SkeletonKnight_Idle_character", "SkeletonKnight_Walk_character", "SkeletonKnight_HeavyAttack_character"],
  10903: ["SkeletonKnight_Idle_character", "SkeletonKnight_Walk_character", "SkeletonKnight_HeavyAttack_character"],
  10904: ["SkeletonKnight_Idle_character", "SkeletonKnight_Walk_character", "SkeletonKnight_HeavyAttack_character"],
  20011: ["Scorpion_Idle_character", "Scorpion_Walk_character", "Scorpion_Attack_character"],
  20021: ["WarriorRatRace_Idle_character", "WarriorRatRace_Walk_character", "WarriorRatRace_Attack1_character"],
  20022: ["RangerRatRace_Idle_character", "RangerRatRace_Walk_character", "RangerRatRace_Attack_character"],
  20023: ["ZombieRatRace_Idle_character", "ZombieRatRace_Walk_character", "ZombieRatRace_Attack1_character"],
  20024: ["BerserkerRatRace_Idle_character", "BerserkerRatRace_Walk_character", "BerserkerRatRace_Attack1_character"],
  20031: ["Cobra_Idle_character", "Cobra_Walk_character", "Cobra_Attack_character"],
  20041: ["PoisonInsect_Idle_character", "PoisonInsect_Walk_character", "PoisonInsect_Attack_character"],
  20042: ["RedExplosionInsect_Idle_character", "RedExplosionInsect_Walk_character", "RedExplosionInsect_Attack_character"],
  20051: ["GiantFly_Idle_character", "GiantFly_Walk_character", "GiantFly_Attack_character"],
  20061: ["SpearKobolt_Idle_character", "SpearKobolt_Walk_character", "SpearKobolt_Attack_character"],
  20062: ["SlingerKobolt_Idle_character", "SlingerKobolt_Walk_character", "SlingerKobolt_Attack_character"],
  20071: ["Homunculus_Idle_character", "Homunculus_Walk_character", "Homunculus_Attack_character"],
  20081: ["Ghoul_Idle_character", "Ghoul_Walk_character", "Ghoul_Attack_character"],
  20091: ["FireElemental_Idle_character", "FireElemental_Walk_character", "FireElemental_Attack_character"],
  20111: ["SmallMummy_Idle_character", "SmallMummy_Walk_character", "SmallMummy_Attack_character"],
  20121: ["GiantTick_Idle_character", "GiantTick_Walk_character", "GiantTick_Attack1_character"],
  20901: ["Sibuna_Idle_Character", "Sibuna_Walk_Character", "Sibuna_leftStrike_character"],
  20902: ["Sibuna_Idle_Character", "Sibuna_Walk_Character", "Sibuna_rightStrike_character"],
  20903: ["Sibuna_Idle_Character", "Sibuna_Walk_Character", "Sibuna_leftStrike_character"],
  20904: ["Sibuna_Idle_Character", "Sibuna_Walk_Character", "Sibuna_rightStrike_character"],
  30011: ["Gremlin_Idle_character", "Gremlin_Walk_character", "Gremlin_Attack_character"],
  30012: ["Geonid_Idle_character", "Geonid_Walk_character", "Geonid_Attack_character"],
  30013: ["AngelicHelm_Idle_character", "AngelicHelm_Walk_character", "AngelicHelm_Attack_character"],
  30021: ["Yeti_Idle_character", "Yeti_Walk_character", "Yeti_Attack1_character"],
  30031: ["DragonHatchling_Idle_character", "DragonHatchling_Walk_character", "DragonHatchling_Attack_character"],
  30041: ["FrozenWarrior_Idle_character", "FrozenWarrior_Walk_character", "FrozenWarrior_Attack_character"],
  30042: ["FrozenArcher_Idle_character", "FrozenArcher_Walk_character", "FrozenArcher_Attack1_character"],
  30043: ["FrozenSpearman_Idle_character", "FrozenSpearman_Walk_character", "FrozenSpearman_Attack1_character"],
  30044: ["FrozenWizard_Idle_character", "FrozenWizard_Walk_character", "FrozenWizard_Attack1_character"],
  30051: ["Ghost_Idle_character", "Ghost_Walk_character", "Ghost_Attack_character"],
  30061: ["MagmaHuman_Idle_character", "MagmaHuman_Walk_character", "MagmaHuman_Attack_character"],
  30071: ["BloodBender_Idle_character", "BloodBender_Walk_character", "BloodBender_Attack1_character"],
  30081: ["FireImp_Idle_character", "FireImp_Walk_character", "FireImp_Attack1_character"],
  30082: ["FireDemonTormentor_Idle_character", "FireDemonTormentor_Walk_character", "FireDemonTormentor_Attack1_character"],
  30083: ["FireDemoness_Idle_character", "FireDemoness_Walk_character", "FireDemoness_Attack1_character"],
  30084: ["FirePiglet_Idle_character", "FirePiglet_Walk_character", "FirePiglet_Attack_character"],
  30091: ["FireGolem_Idle_character", "FireGolem_Walk_character", "FireGolem_Attack1_character"],
  30101: ["Lich_Idle_character", "Lich_Walk_character", "Lich_ChaosAttack1_character"],
  30102: ["Lich_Idle_character", "Lich_Walk_character", "Lich_ChaosAttack1_character"],
  30103: ["Lich_Idle_character", "Lich_Walk_character", "Lich_ChaosAttack1_character"],
  30104: ["Lich_Idle_character", "Lich_Walk_character", "Lich_ChaosAttack1_character"],
  30111: ["UndeadHand_Idle_character", "UndeadHand_Walk_character", "UndeadHand_Attack_character"],
  30901: ["Sorcerer_Idle_Full", "Sorcerer_Walk_Full", "Sorcerer_Landing_merged"],
  30902: ["Sorcerer_Idle_Full", "Sorcerer_Walk_Full", "Sorcerer_Landing_merged"],
  30903: ["Sorcerer_Idle_Full", "Sorcerer_Walk_Full", "Sorcerer_Landing_merged"],
  30904: ["Sorcerer_Idle_Full", "Sorcerer_Walk_Full", "Sorcerer_Landing_merged"],
};

function existsDir(p) { return fs.existsSync(p) && fs.statSync(p).isDirectory(); }
function normalize(value) {
  return String(value).replaceAll("\\", "/").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function compact(value) { return normalize(value).replace(/ /g, ""); }
function walk(dir, out = []) {
  if (!existsDir(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (IMAGE_EXTS.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}
function readMonsters() {
  if (!fs.existsSync(codexPath)) return [];
  const text = fs.readFileSync(codexPath, "utf8");
  const re = /\{\n\s+"key"\s*:\s*(\d+),\n\s+"namePt"\s*:\s*"([^"]+)",\n\s+"nameEn"\s*:\s*"([^"]+)"/g;
  return Array.from(text.matchAll(re)).map((m) => ({ key: Number(m[1]), namePt: m[2], nameEn: m[3] })).sort((a, b) => a.key - b.key);
}
function readComponentAliases() {
  if (!fs.existsSync(componentPath)) return {};
  const text = fs.readFileSync(componentPath, "utf8");
  const aliases = {};
  const re = /\n\s*(\d+)\s*:\s*\[([^\]]+)\]/g;
  for (const m of text.matchAll(re)) {
    const values = Array.from(m[2].matchAll(/"([^"]+)"/g)).map((x) => x[1]);
    if (values.length) aliases[Number(m[1])] = values;
  }
  return aliases;
}
function buildFileIndex(files) {
  const exact = new Map();
  const byCompact = new Map();
  for (const file of files) {
    const base = path.basename(file, path.extname(file));
    const c = compact(base);
    if (!exact.has(c)) exact.set(c, []);
    exact.get(c).push(file);
    for (const token of c.split(/(?=idle|walk|attack|dead|character|merged)/g)) {
      if (!token) continue;
      if (!byCompact.has(token)) byCompact.set(token, []);
      byCompact.get(token).push(file);
    }
  }
  return { exact, byCompact };
}
function preferFile(files) {
  if (!files?.length) return null;
  return [...files].sort((a, b) => {
    const ap = a.replaceAll("\\", "/");
    const bp = b.replaceAll("\\", "/");
    const score = (p) => (p.includes("/heroes/") ? 30 : 0) + (p.includes("/monsters/") ? 25 : 0) + (p.includes("/items/") ? 10 : 0) + (p.endsWith(".png") ? 8 : 0) - (p.toLowerCase().includes("dead") ? 50 : 0) - (p.toLowerCase().includes("effect") ? 40 : 0);
    return score(bp) - score(ap) || ap.length - bp.length;
  })[0];
}
function findByAlias(index, alias) {
  const c = compact(alias);
  if (!c) return null;
  const exact = preferFile(index.exact.get(c));
  if (exact) return exact;
  // fallback controlado: começa com o nome, mas não escolhe efeito/projétil solto.
  const candidates = [];
  for (const [key, files] of index.exact.entries()) {
    if (key.startsWith(c) || key.includes(c)) candidates.push(...files);
  }
  return preferFile(candidates);
}
function scoreFile(file, monster) {
  const baseName = path.basename(file, path.extname(file));
  const base = normalize(baseName);
  const baseCompact = compact(baseName);
  const aliases = (FALLBACK_ALIASES[monster.key] ?? []).map(compact);
  let score = 0;
  if (baseCompact === `monster${monster.key}`) score += 160;
  for (const a of aliases) {
    if (baseCompact === a) score += 150;
    if (baseCompact.startsWith(a)) score += 120;
    if (baseCompact.includes(a)) score += 100;
  }
  const nameTokens = normalize(monster.nameEn).split(" ").filter((t) => t.length > 2);
  if (nameTokens.length && nameTokens.every((t) => base.includes(t))) score += 90;
  if (base.includes("idle")) score += 30;
  if (base.includes("character")) score += 10;
  if (base.includes("dead") || base.includes("effect") || base.includes("projectile") || base.includes("slider") || base.includes("button")) score -= 80;
  return score;
}
function bestFallback(files, monster) {
  return files.map((file) => ({ file, score: scoreFile(file, monster) })).filter((x) => x.score >= 80).sort((a, b) => b.score - a.score)[0]?.file ?? null;
}
function copyAsPng(source, dest) {
  fs.copyFileSync(source, dest);
}

fs.mkdirSync(outDir, { recursive: true });
const monsters = readMonsters();
if (!monsters.length) {
  console.error("ERRO: não encontrei os monstros em lib/monster-codex-data.ts");
  process.exit(1);
}
const sources = [gameAssets, extraSource].filter((p, i, arr) => existsDir(p) && arr.indexOf(p) === i);
if (!sources.length) {
  console.error("ERRO: nenhuma pasta de assets encontrada. Primeiro rode: npm run assets:import:win");
  process.exit(1);
}
const files = sources.flatMap((source) => walk(source));
const index = buildFileIndex(files);
const componentAliases = readComponentAliases();
let copiedMain = 0;
let copiedFrames = 0;
const missing = [];
const report = { generatedAt: new Date().toISOString(), mode: "17.7 deterministic no-404 monster frames", sources, totalFilesScanned: files.length, totalMonsters: monsters.length, copied: 0, copiedFrames: 0, missing, sprites: {} };

for (const monster of monsters) {
  const aliases = componentAliases[monster.key] ?? FALLBACK_ALIASES[monster.key] ?? [];
  const frameFiles = [];
  for (let i = 0; i < FRAME_NAMES.length; i++) {
    const frame = FRAME_NAMES[i];
    const primaryAlias = aliases[i] ?? aliases[0];
    let found = primaryAlias ? findByAlias(index, primaryAlias) : null;
    if (!found && i > 0 && aliases[0]) found = findByAlias(index, aliases[0]);
    if (!found) found = bestFallback(files, monster);
    if (found) {
      const dest = path.join(outDir, `Monster_${monster.key}_${frame}.png`);
      copyAsPng(found, dest);
      frameFiles.push({ frame, source: found, url: `/images/monsters/Monster_${monster.key}_${frame}.png` });
      copiedFrames++;
    }
  }
  if (frameFiles.length) {
    const idle = frameFiles.find((f) => f.frame === "idle") ?? frameFiles[0];
    fs.copyFileSync(path.join(outDir, `Monster_${monster.key}_${idle.frame}.png`), path.join(outDir, `Monster_${monster.key}.png`));
    copiedMain++;
    report.sprites[monster.key] = { copied: true, frames: frameFiles, main: `/images/monsters/Monster_${monster.key}.png`, namePt: monster.namePt, nameEn: monster.nameEn };
  } else {
    missing.push({ key: monster.key, namePt: monster.namePt, nameEn: monster.nameEn });
    report.sprites[monster.key] = { copied: false, aliases };
  }
}
report.copied = copiedMain;
report.copiedFrames = copiedFrames;
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
console.log(`Sprites principais vinculados: ${copiedMain}/${monsters.length}`);
console.log(`Frames de animação gerados: ${copiedFrames}/${monsters.length * 3}`);
console.log(`Assets escaneados: ${files.length}`);
console.log(`Saída: ${outDir}`);
console.log(`Relatório: ${reportPath}`);
if (missing.length) {
  console.log(`Sem sprite encontrado: ${missing.length}`);
  console.log(missing.map((m) => `${m.key} ${m.nameEn}`).join(", "));
}
