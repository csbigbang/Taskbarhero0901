export type HeroKey = "knight" | "ranger" | "sorcerer" | "priest" | "hunter" | "slayer";

export type HeroStat = {
  label: string;
  value: string | number;
  rank?: "best" | "good" | "mid" | "low";
};

export type HeroSkill = {
  name: string;
  kind: "Passiva" | "Ativa";
  tier: number;
  max: number;
  value: string;
  focus: string;
};

export type HeroData = {
  key: HeroKey;
  code: number;
  name: string;
  namePt: string;
  archetype: string;
  style: string;
  role: string;
  mainWeapon: string;
  offHand: string;
  unlock: string;
  short: string;
  description: string;
  color: string;
  accent: string;
  heroIcon: string;
  heroIconLocked: string;
  largeSprite: string;
  midIllustration: string;
  inventoryIllustration: string;
  deadSprite: string;
  stats: HeroStat[];
  skills: HeroSkill[];
  recommended: string[];
};

export const HEROES: HeroData[] = [
  {
    key: "knight",
    code: 101,
    name: "Knight",
    namePt: "Cavaleiro",
    archetype: "Guardião | Corpo a corpo",
    style: "Tanque físico de linha de frente",
    role: "Defesa / Chefe",
    mainWeapon: "Espada",
    offHand: "Escudo",
    unlock: "Inicial",
    short: "Herói resistente, ótimo para segurar avanço e sobreviver em fases difíceis.",
    description: "O Knight é a escolha mais segura para progressão. Tem vida alta, armadura forte e escala muito bem com defesa, redução de dano e escudo.",
    color: "#f2d06b",
    accent: "#7aa8ff",
    heroIcon: "/game-assets/heroes/Hero_101.png",
    heroIconLocked: "/game-assets/heroes/Hero_101_Locked.png",
    largeSprite: "/game-assets/misc/Arrage_ChaAnim_Knight_Large.png",
    midIllustration: "/game-assets/misc/Arrage_ChaIllust_Knight_Mid_Anim.png",
    inventoryIllustration: "/game-assets/items/Inventory_ChaIllust_Knight_Mid_Anim.png",
    deadSprite: "/game-assets/heroes/HeroDead_101.png",
    stats: [
      { label: "HP", value: 130, rank: "best" },
      { label: "DPS base", value: "2.00", rank: "good" },
      { label: "Armadura", value: 45, rank: "best" },
      { label: "Move Speed", value: 700, rank: "mid" },
      { label: "Crit Chance", value: "3.0%", rank: "low" },
      { label: "Cooldown", value: "0%", rank: "mid" },
    ],
    skills: [
      { name: "Attack Damage Enhancement", kind: "Passiva", tier: 1, max: 3, value: "+6", focus: "Dano base" },
      { name: "Escudo Wall", kind: "Ativa", tier: 2, max: 5, value: "+defesa", focus: "Sobrevivência" },
      { name: "Physical Damage Enhancement", kind: "Passiva", tier: 3, max: 10, value: "+150%", focus: "Dano físico" },
      { name: "HP Enhancement", kind: "Passiva", tier: 4, max: 10, value: "+HP", focus: "Tank" },
    ],
    recommended: ["Espada", "Escudo", "Armor", "Helmet", "Ring"],
  },
  {
    key: "ranger",
    code: 201,
    name: "Ranger",
    namePt: "Ranger",
    archetype: "Marksman | Ranged",
    style: "Dano à distância e crítico",
    role: "Farm / DPS",
    mainWeapon: "Bow",
    offHand: "Arrow",
    unlock: "Inicial",
    short: "Classe rápida para limpar waves e escalar com crítico, velocidade e dano físico.",
    description: "A Ranger joga longe do perigo e busca alta velocidade de ataque. Ótima para farm quando equipada com bow forte e acessórios ofensivos.",
    color: "#7ee787",
    accent: "#6fc9ff",
    heroIcon: "/game-assets/heroes/Hero_201.png",
    heroIconLocked: "/game-assets/heroes/Hero_201_Locked.png",
    largeSprite: "/game-assets/misc/Arrage_ChaAnim_Ranger_Large.png",
    midIllustration: "/game-assets/misc/Arrage_ChaIllust_Ranger_Mid_Anim.png",
    inventoryIllustration: "/game-assets/items/Inventory_ChaIllust_Ranger_Mid_Anim.png",
    deadSprite: "/game-assets/heroes/HeroDead_201.png",
    stats: [
      { label: "HP", value: 60, rank: "low" },
      { label: "DPS base", value: "1.00", rank: "mid" },
      { label: "Armadura", value: 8, rank: "low" },
      { label: "Move Speed", value: 780, rank: "good" },
      { label: "Crit Chance", value: "5.0%", rank: "good" },
      { label: "Attack Speed", value: "0.75/s", rank: "best" },
    ],
    skills: [
      { name: "Critical Chance Enhancement", kind: "Passiva", tier: 1, max: 8, value: "+160%", focus: "Crítico" },
      { name: "Rapid Shot", kind: "Ativa", tier: 2, max: 5, value: "+AS", focus: "DPS" },
      { name: "Physical Damage Enhancement", kind: "Passiva", tier: 4, max: 10, value: "+150%", focus: "Dano físico" },
      { name: "Piercing Arrow", kind: "Ativa", tier: 5, max: 5, value: "AOE", focus: "Farm" },
    ],
    recommended: ["Bow", "Arrow", "Ring", "Bracer", "Boots"],
  },
  {
    key: "sorcerer",
    code: 301,
    name: "Sorcerer",
    namePt: "Mago",
    archetype: "Mage | Elemental",
    style: "Dano mágico e área",
    role: "AOE / Elemental",
    mainWeapon: "Staff",
    offHand: "Orb",
    unlock: "Inicial",
    short: "Causa dano elemental alto e limpa grupos com habilidades de área.",
    description: "O Sorcerer é forte quando escala com dano elemental, cooldown e cast speed. Funciona muito bem para limpar waves e bosses vulneráveis.",
    color: "#b77dff",
    accent: "#5ee7ff",
    heroIcon: "/game-assets/heroes/Hero_301.png",
    heroIconLocked: "/game-assets/heroes/Hero_301_Locked.png",
    largeSprite: "/game-assets/monsters/Arrage_ChaAnim_Sorcerer_Large.png",
    midIllustration: "/game-assets/monsters/Arrage_ChaIllust_Sorcerer_Mid_Anim.png",
    inventoryIllustration: "/game-assets/items/Inventory_ChaIllust_Sorcerer_Mid_Anim.png",
    deadSprite: "/game-assets/heroes/HeroDead_301.png",
    stats: [
      { label: "HP", value: 50, rank: "low" },
      { label: "DPS base", value: "2.00", rank: "good" },
      { label: "Armadura", value: 5, rank: "low" },
      { label: "Move Speed", value: 720, rank: "mid" },
      { label: "Cast Speed", value: "1.00x", rank: "good" },
      { label: "Cooldown", value: "0%", rank: "mid" },
    ],
    skills: [
      { name: "Fire Damage Enhancement", kind: "Passiva", tier: 2, max: 10, value: "+150%", focus: "Fogo" },
      { name: "Cold Damage Enhancement", kind: "Passiva", tier: 3, max: 10, value: "+150%", focus: "Gelo" },
      { name: "Lightning Damage Enhancement", kind: "Passiva", tier: 4, max: 10, value: "+150%", focus: "Raio" },
      { name: "Meteor / Burst", kind: "Ativa", tier: 5, max: 5, value: "AOE", focus: "Farm" },
    ],
    recommended: ["Staff", "Orb", "Ring", "Amulet", "Bracer"],
  },
  {
    key: "priest",
    code: 401,
    name: "Priest",
    namePt: "Sacerdote",
    archetype: "Support | Holy",
    style: "Sustentação e dano sagrado",
    role: "Suporte / Sobrevivência",
    mainWeapon: "Scepter",
    offHand: "Tome",
    unlock: "Inicial",
    short: "Boa vida, boa defesa e utilidade alta para manter a composição viva.",
    description: "O Priest é estável e eficiente. Tem perfil defensivo, boas opções de suporte e escala com cooldown, cura, HP e dano mágico.",
    color: "#ffe68a",
    accent: "#ffffff",
    heroIcon: "/game-assets/heroes/Hero_401.png",
    heroIconLocked: "/game-assets/heroes/Hero_401_Locked.png",
    largeSprite: "/game-assets/misc/Arrage_ChaAnim_Priest_Large.png",
    midIllustration: "/game-assets/misc/Arrage_ChaIllust_Priest_Mid_Anim.png",
    inventoryIllustration: "/game-assets/items/Inventory_ChaIllust_Priest_Mid_Anim.png",
    deadSprite: "/game-assets/heroes/HeroDead_401.png",
    stats: [
      { label: "HP", value: 95, rank: "good" },
      { label: "DPS base", value: "1.00", rank: "mid" },
      { label: "Armadura", value: 30, rank: "good" },
      { label: "Move Speed", value: 700, rank: "mid" },
      { label: "Cast Speed", value: "1.00x", rank: "good" },
      { label: "Cooldown", value: "0%", rank: "mid" },
    ],
    skills: [
      { name: "Health Enhancement", kind: "Passiva", tier: 1, max: 10, value: "+HP", focus: "Sustain" },
      { name: "Holy Strike", kind: "Ativa", tier: 2, max: 5, value: "Holy", focus: "Dano" },
      { name: "Cooldown Reduction", kind: "Passiva", tier: 4, max: 10, value: "+CDR", focus: "Suporte" },
      { name: "Blessing", kind: "Ativa", tier: 5, max: 5, value: "Bônus", focus: "Build" },
    ],
    recommended: ["Scepter", "Tome", "Armor", "Amulet", "Ring"],
  },
  {
    key: "hunter",
    code: 501,
    name: "Hunter",
    namePt: "Caçador",
    archetype: "Trapper | Ranged",
    style: "Armadilhas e burst à distância",
    role: "Chefe / Controle",
    mainWeapon: "Crossbow",
    offHand: "Bolt",
    unlock: "500",
    short: "Especialista tático com crossbow e armadilhas. Forte em controle e dano planejado.",
    description: "O Hunter funciona muito bem quando usa crossbow forte, crítico e dano elemental. É excelente para fases em que controlar o ritmo importa.",
    color: "#74d9ff",
    accent: "#ffe16a",
    heroIcon: "/game-assets/heroes/Hero_501.png",
    heroIconLocked: "/game-assets/heroes/Hero_501_Locked.png",
    largeSprite: "/game-assets/misc/Arrage_ChaAnim_Abalist_Large.png",
    midIllustration: "/game-assets/misc/Arrage_ChaIllust_Abalist_Mid_Anim.png",
    inventoryIllustration: "/game-assets/items/Inventory_ChaIllust_Abalist_Mid_Anim.png",
    deadSprite: "/game-assets/heroes/HeroDead_501.png",
    stats: [
      { label: "HP", value: 70, rank: "mid" },
      { label: "DPS base", value: "1.43", rank: "good" },
      { label: "Armadura", value: 15, rank: "mid" },
      { label: "Move Speed", value: 750, rank: "good" },
      { label: "Crit Chance", value: "4.5%", rank: "good" },
      { label: "Attack Speed", value: "0.70/s", rank: "good" },
    ],
    skills: [
      { name: "Explosive Bolt", kind: "Ativa", tier: 1, max: 5, value: "Explosão", focus: "AOE" },
      { name: "Frost Bolt", kind: "Ativa", tier: 1, max: 5, value: "Slow", focus: "Controle" },
      { name: "Charge Trap", kind: "Ativa", tier: 3, max: 5, value: "Armadilha", focus: "Chefe" },
      { name: "Crossbow Turret", kind: "Ativa", tier: 4, max: 5, value: "Turret", focus: "Farm" },
    ],
    recommended: ["Crossbow", "Bolt", "Ring", "Boots", "Bracer"],
  },
  {
    key: "slayer",
    code: 601,
    name: "Slayer",
    namePt: "Slayer",
    archetype: "Executioner | Melee",
    style: "Dano físico pesado",
    role: "DPS / Chefe",
    mainWeapon: "Axe",
    offHand: "Hatchet",
    unlock: "Avançado",
    short: "Classe agressiva de melee, com alto HP e dano pesado para eliminar bosses.",
    description: "O Slayer é feito para bater forte. Usa axe/hatchet, escala bem com dano físico, crítico e sobrevivência para manter pressão em bosses.",
    color: "#ff6b6b",
    accent: "#ffb347",
    heroIcon: "/game-assets/heroes/Hero_601.png",
    heroIconLocked: "/game-assets/heroes/Hero_601_Locked.png",
    largeSprite: "/game-assets/misc/Arrage_ChaAnim_Slayer_Large.png",
    midIllustration: "/game-assets/misc/Arrage_ChaIllust_Slayer_Mid_Anim.png",
    inventoryIllustration: "/game-assets/items/Inventory_ChaIllust_Slayer_Mid_Anim.png",
    deadSprite: "/game-assets/heroes/HeroDead_601.png",
    stats: [
      { label: "HP", value: 115, rank: "good" },
      { label: "DPS base", value: "2.00", rank: "best" },
      { label: "Armadura", value: 40, rank: "good" },
      { label: "Move Speed", value: 710, rank: "mid" },
      { label: "Crit Damage", value: "160%", rank: "best" },
      { label: "Attack Speed", value: "0.55/s", rank: "mid" },
    ],
    skills: [
      { name: "Attack Damage Enhancement", kind: "Passiva", tier: 1, max: 3, value: "+6", focus: "Dano" },
      { name: "Execution", kind: "Ativa", tier: 2, max: 5, value: "Explosão", focus: "Chefe" },
      { name: "Critical Damage Enhancement", kind: "Passiva", tier: 3, max: 10, value: "+80%", focus: "Crítico" },
      { name: "Physical Damage Enhancement", kind: "Passiva", tier: 5, max: 10, value: "+150%", focus: "DPS" },
    ],
    recommended: ["Axe", "Hatchet", "Armor", "Ring", "Amulet"],
  },
];

export function getHero(key: string | number | undefined) {
  const normalized = String(key ?? "").toLowerCase();
  return HEROES.find((hero) => hero.key === normalized || String(hero.code) === normalized || hero.name.toLowerCase() === normalized);
}

export const HERO_MAP = Object.fromEntries(HEROES.map((hero) => [hero.key, hero]));
