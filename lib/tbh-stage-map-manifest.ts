export type StageNodePosition = {
  stageNo: number;
  x: number;
  y: number;
};

export const STAGE_TEST_ASSETS = {
  actMaps: {
    1: "/game-assets/stages/Act1_Bg.png",
    2: "/game-assets/stages/Act2_Bg.png",
    3: "/game-assets/stages/Act3_Bg.png",
  },
  icons: {
    base: "/game-assets/stages/StageIcon_Occupied_Base.png",
    flag: "/game-assets/stages/StageIcon_Occupied_Flag.png",
    hover: "/game-assets/stages/StageIcon_Hover.png",
    locked: "/game-assets/stages/StageIcon_Locked_Normal.png",
    tooltipBg: "/game-assets/stages/StageTooltip_Bg_Normal.png",
  },
  ui: {
    tabActive: "/game-assets/stages/TabButton_Large_Active.png",
    tabInactive: "/game-assets/stages/TabButton_Large_DeActive_Active.png",
    difficultyNormal: "/game-assets/stages/Button_Difficulty_Normal_Downward_Active.png",
    difficultyNightmare: "/game-assets/stages/Button_Difficulty_Nightmare_Downward_Active.png",
    difficultyHell: "/game-assets/stages/Button_Difficulty_Hell_Downward_Active.png",
    difficultyTorment: "/game-assets/stages/Button_Difficulty_Torment_Downward_Active.png",
  },
} as const;

// Posições percentuais. Ajuste fino fica concentrado aqui, sem mexer no CSS.
const SINGLE_COLUMN_NODES: StageNodePosition[] = [
  { stageNo: 1, x: 51.7, y: 88.9 },
  { stageNo: 2, x: 51.7, y: 79.7 },
  { stageNo: 3, x: 51.7, y: 70.5 },
  { stageNo: 4, x: 51.7, y: 61.3 },
  { stageNo: 5, x: 51.7, y: 52.1 },
  { stageNo: 6, x: 51.7, y: 42.9 },
  { stageNo: 7, x: 51.7, y: 33.7 },
  { stageNo: 8, x: 51.7, y: 24.5 },
  { stageNo: 9, x: 51.7, y: 15.3 },
  { stageNo: 10, x: 51.7, y: 6.6 },
];

export const STAGE_NODE_POSITIONS: Record<number, StageNodePosition[]> = {
  1: SINGLE_COLUMN_NODES,
  2: SINGLE_COLUMN_NODES,
  3: SINGLE_COLUMN_NODES,
};
