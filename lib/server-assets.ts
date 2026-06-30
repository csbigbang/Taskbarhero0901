import fs from "node:fs";
import path from "node:path";
import type { GameAssetManifest } from "@/lib/asset-resolver";

export function emptyAssetManifest(): GameAssetManifest {
  return {
    generatedAt: null,
    sourceRoot: null,
    total: 0,
    counts: {},
    assets: []
  };
}

export function loadGameAssetManifest(): GameAssetManifest {
  const manifestPath = path.join(process.cwd(), "public", "game-assets", "manifest.json");

  if (!fs.existsSync(manifestPath)) return emptyAssetManifest();

  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8")) as GameAssetManifest;
  } catch {
    return emptyAssetManifest();
  }
}
