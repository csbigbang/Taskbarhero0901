"use client";

import { useEffect, useMemo, useState } from "react";
import { assetBaseName } from "@/lib/asset-resolver";

type AssetEntry = {
  id?: string;
  name: string;
  category: string;
  url: string;
  originalPath?: string;
  sizeBytes?: number;
};

type AssetManifest = {
  generatedAt?: string | null;
  total?: number;
  counts?: Record<string, number>;
  assets?: AssetEntry[];
};

type AssetCatalog = {
  byName: Map<string, AssetEntry[]>;
  byCategoryName: Map<string, AssetEntry>;
};

type Props = {
  name?: string | null;
  fallbackName?: string | null;
  alt: string;
  categories?: string[];
  className?: string;
  imgClassName?: string;
  extraUrls?: string[];
  eager?: boolean;
};

const DEFAULT_CATEGORIES = ["items", "ui", "branding", "heroes", "monsters", "stages", "skills", "misc"];
let catalogPromise: Promise<AssetCatalog> | null = null;

function normalizeKey(value?: string | null) {
  return assetBaseName(value)
    .toLowerCase()
    .replace(/\.(png|webp|jpg|jpeg|gif)$/i, "");
}

function isTrustedUrl(url: string) {
  return (
    url.startsWith("/images/items/") ||
    url.startsWith("/images/item-sprites/") ||
    url.startsWith("/images/monsters/") ||
    url.startsWith("/images/rarities/") ||
    url.startsWith("/images/ui/") ||
    url.startsWith("/images/bg/") ||
    url.startsWith("/game-assets/")
  );
}

function pushName(map: Map<string, AssetEntry[]>, key: string, asset: AssetEntry) {
  if (!key) return;
  const list = map.get(key) || [];
  list.push(asset);
  map.set(key, list);
}

async function loadCatalog(): Promise<AssetCatalog> {
  if (catalogPromise) return catalogPromise;

  catalogPromise = fetch("/game-assets/manifest.json", { cache: "force-cache" })
    .then(async (res) => {
      if (!res.ok) throw new Error("manifest not found");
      const manifest = (await res.json()) as AssetManifest;
      const assets = manifest.assets || [];
      const byName = new Map<string, AssetEntry[]>();
      const byCategoryName = new Map<string, AssetEntry>();

      for (const asset of assets) {
        if (!asset?.url || !isTrustedUrl(asset.url)) continue;

        const keys = new Set<string>([
          normalizeKey(asset.name),
          normalizeKey(asset.url),
          normalizeKey(asset.originalPath || "")
        ]);

        for (const key of keys) {
          pushName(byName, key, asset);
          byCategoryName.set(`${asset.category}:${key}`, asset);
        }
      }

      return { byName, byCategoryName };
    })
    .catch(() => ({ byName: new Map(), byCategoryName: new Map() }));

  return catalogPromise;
}

function resolveFromCatalog(catalog: AssetCatalog, options: { names: string[]; categories?: string[] }) {
  const categories = options.categories?.length ? options.categories : DEFAULT_CATEGORIES;
  const names = options.names.map(normalizeKey).filter(Boolean);

  for (const name of names) {
    for (const category of categories) {
      const exact = catalog.byCategoryName.get(`${category}:${name}`);
      if (exact?.url) return exact.url;
    }
  }

  for (const name of names) {
    const list = catalog.byName.get(name) || [];
    const preferred = list.find((asset) => categories.includes(asset.category));
    if (preferred?.url) return preferred.url;
    if (list[0]?.url) return list[0].url;
  }

  return "";
}

export function GameAssetImage({
  name,
  fallbackName,
  alt,
  categories,
  className = "game-asset-image",
  imgClassName,
  extraUrls,
  eager = false
}: Props) {
  const names = useMemo(() => [name || "", fallbackName || ""], [name, fallbackName]);
  const trustedExtraUrls = useMemo(
    () => (extraUrls || []).map((x) => String(x || "").trim()).filter(isTrustedUrl),
    [extraUrls]
  );

  const initialDirectUrl = trustedExtraUrls[0] || "";
  const [src, setSrc] = useState<string>(initialDirectUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setFailed(false);

    if (trustedExtraUrls[0]) {
      setSrc(trustedExtraUrls[0]);
      return () => {
        alive = false;
      };
    }

    setSrc("");

    if (!names.some(Boolean)) {
      return () => {
        alive = false;
      };
    }

    loadCatalog().then((catalog) => {
      if (!alive) return;
      const resolved = resolveFromCatalog(catalog, { names, categories });
      setSrc(resolved || "");
    });

    return () => {
      alive = false;
    };
  }, [names, categories, trustedExtraUrls]);

  // Regra final: sem asset real = não renderiza nada.
  if (!src || failed) return null;

  return (
    <span className={className} title={alt}>
      <img
        className={imgClassName}
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
