export type GameAsset = {
  id: string;
  name: string;
  category: string;
  url: string;
  originalPath: string;
  sizeBytes: number;
};

export type GameAssetManifest = {
  generatedAt: string | null;
  sourceRoot: string | null;
  total: number;
  counts: Record<string, number>;
  assets: GameAsset[];
};

export const assetCategoryLabels: Record<string, string> = {
  items: "Itens / Equipamentos",
  skills: "Skills / Buffs",
  heroes: "Heróis / Pets",
  monsters: "Monstros",
  stages: "Fases / Mapas",
  ui: "Interface",
  branding: "Branding",
  misc: "Outros"
};

const ALL_CATEGORIES = ["items", "skills", "heroes", "monsters", "stages", "ui", "branding", "misc"];
const IMG_EXTS = ["png", "webp", "jpg", "jpeg"];

export function assetBaseName(value?: string | null) {
  if (!value) return "";
  const normalized = String(value)
    .replaceAll("\\", "/")
    .split("?")[0]
    .split("#")[0]
    .split("/")
    .filter(Boolean)
    .pop() || "";

  return normalized
    .replace(/\.(png|jpg|jpeg|webp|gif)$/i, "")
    .trim()
    .replace(/[^a-zA-Z0-9_\-.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function itemIconName(iconPath?: string | null, itemKey?: string | null) {
  const explicit = assetBaseName(iconPath);
  if (explicit) return explicit;

  const key = assetBaseName(itemKey);
  return key ? `Item_${key}` : "";
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function directUrl(value?: string | null) {
  const v = String(value || "").trim();
  return v.startsWith("/") || v.startsWith("http://") || v.startsWith("https://") ? v : "";
}

export function candidateImageUrls(options: {
  name?: string | null;
  fallbackName?: string | null;
  categories?: string[];
  extraUrls?: string[];
}) {
  const urls: string[] = [];

  for (const url of options.extraUrls || []) {
    if (url) urls.push(url);
  }

  for (const value of [options.name, options.fallbackName]) {
    const direct = directUrl(value);
    if (direct) urls.push(direct);
  }

  const name = assetBaseName(options.name);
  const fallback = assetBaseName(options.fallbackName);
  const names = unique([name, fallback]);
  const preferred = options.categories?.length ? options.categories : [];
  const categories = unique([...preferred, ...ALL_CATEGORIES]);

  for (const candidateName of names) {
    for (const category of categories) {
      for (const ext of IMG_EXTS) {
        urls.push(`/game-assets/${category}/${candidateName}.${ext}`);
      }
    }

    urls.push(`/images/items/${candidateName}.png`);
    urls.push(`/images/bg/${candidateName}.png`);
  }

  return unique(urls);
}

export function normalizeAssetKey(value?: string | null) {
  return assetBaseName(value).toLowerCase();
}

export function createAssetNameSet(manifest: GameAssetManifest) {
  const names = new Set<string>();
  const urls = new Set<string>();

  for (const asset of manifest.assets || []) {
    names.add(normalizeAssetKey(asset.name));
    names.add(normalizeAssetKey(asset.url));
    names.add(normalizeAssetKey(asset.originalPath));
    urls.add(asset.url.toLowerCase());
  }

  return { names, urls };
}

export function itemHasAsset(
  manifest: GameAssetManifest,
  item: { item_key?: string | null; icon_path?: string | null }
) {
  const { names, urls } = createAssetNameSet(manifest);
  const icon = itemIconName(item.icon_path, item.item_key);
  const fallback = item.item_key ? `Item_${item.item_key}` : "";
  const wanted = [icon, fallback].map(normalizeAssetKey).filter(Boolean);

  for (const value of wanted) {
    if (names.has(value)) return true;
    for (const category of ALL_CATEGORIES) {
      if (urls.has(`/game-assets/${category}/${value}.png`)) return true;
    }
  }

  return false;
}

export function findItemAsset(
  manifest: GameAssetManifest,
  item: { item_key?: string | null; icon_path?: string | null }
) {
  const icon = normalizeAssetKey(itemIconName(item.icon_path, item.item_key));
  const fallback = normalizeAssetKey(item.item_key ? `Item_${item.item_key}` : "");

  return (manifest.assets || []).find((asset) => {
    const name = normalizeAssetKey(asset.name);
    return name === icon || name === fallback;
  }) || null;
}
