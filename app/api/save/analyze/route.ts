import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FALLBACK_ES3_PASSWORD = "emuMqG3bLYJ938ZDCfieWJ";
const MAX_FILE_BYTES = 8 * 1024 * 1024;

type AnyRecord = Record<string, any>;

type ParsedSave = {
  ok: true;
  fileName: string;
  fileSize: number;
  version: string;
  savedAt: string | null;
  playTimeHours: number;
  steamIdMasked: string;
  heroes: Array<{
    heroKey: number;
    level: number;
    unlocked: boolean;
    abilityPoint: number;
    allocatedAbilityPoint: number;
    skillKeys: number[];
    equipped: Array<{
      slotIndex: number;
      slotLabel: string;
      uniqueId: string;
      itemKey: number | null;
      found: boolean;
      isChaotic?: boolean;
      isBlocked?: boolean;
      enchantCount?: number[];
    }>;
  }>;
  currencies: Array<{ key: number; quantity: number }>;
  inventoryItems: Array<{ slotIndex: number; uniqueId: string; itemKey: number | null }>;
  stashItems: Array<{ slotIndex: number; uniqueId: string; itemKey: number | null }>;
  tradingStashItems: Array<{ slotIndex: number; uniqueId: string; itemKey: number | null }>;
  itemCount: number;
  equippedCount: number;
  inventoryCount: number;
  stashCount: number;
  itemKeys: number[];
  notes: string[];
};

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function decryptEasySave3(buffer: Buffer) {
  if (buffer.length < 32) throw new Error("Arquivo muito pequeno para ser um save ES3 válido.");

  const password = process.env.TBH_ES3_PASSWORD || FALLBACK_ES3_PASSWORD;
  const iv = buffer.subarray(0, 16);
  const cipherText = buffer.subarray(16);
  const key = crypto.pbkdf2Sync(Buffer.from(password, "utf8"), iv, 100, 16, "sha1");

  const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
  decipher.setAutoPadding(true);
  const plain = Buffer.concat([decipher.update(cipherText), decipher.final()]);
  return plain.toString("utf8");
}

function readOuterSave(text: string) {
  const outer = JSON.parse(text) as AnyRecord;
  const playerRaw = outer?.PlayerSaveData?.value;
  const accountRaw = outer?.AccountSaveData?.value;

  if (typeof playerRaw !== "string") {
    throw new Error("PlayerSaveData não foi encontrado no save.");
  }

  return {
    player: JSON.parse(playerRaw) as AnyRecord,
    account: typeof accountRaw === "string" ? JSON.parse(accountRaw) as AnyRecord : {},
  };
}

function dotNetTicksToIso(ticks: unknown) {
  if (typeof ticks !== "number" || !Number.isFinite(ticks)) return null;
  const ms = (ticks - 621355968000000000) / 10000;
  if (!Number.isFinite(ms)) return null;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function safeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function idString(value: unknown) {
  if (value === null || value === undefined) return "0";
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value).toString();
  if (typeof value === "string") return value;
  return String(value);
}

function maskSteamId(value: unknown) {
  const raw = idString(value);
  if (!raw || raw === "0") return "-";
  if (raw.length <= 8) return raw;
  return `${raw.slice(0, 6)}...${raw.slice(-4)}`;
}

function slotLabel(index: number) {
  const labels = [
    "Slot 1",
    "Slot 2",
    "Slot 3",
    "Slot 4",
    "Slot 5",
    "Slot 6",
    "Slot 7",
    "Slot 8",
    "Slot 9",
    "Slot 10",
  ];
  return labels[index] || `Slot ${index + 1}`;
}

function itemUniqueIdFromSlot(row: AnyRecord) {
  return idString(row?.ItemUniqueId ?? row?.itemUniqueId ?? row?.UniqueId ?? row?.uniqueId ?? 0);
}

function buildSlotItems(rows: unknown, itemByUniqueId: Map<string, AnyRecord>) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row: AnyRecord) => {
      const uniqueId = itemUniqueIdFromSlot(row);
      if (!uniqueId || uniqueId === "0") return null;
      const item = itemByUniqueId.get(uniqueId);
      return {
        slotIndex: safeNumber(row?.Index ?? row?.SlotIndex ?? row?.slotIndex, 0),
        uniqueId,
        itemKey: item ? safeNumber(item.ItemKey ?? item.itemKey, 0) || null : null,
      };
    })
    .filter(Boolean) as Array<{ slotIndex: number; uniqueId: string; itemKey: number | null }>;
}

function parseSave(fileName: string, fileSize: number, decryptedText: string): ParsedSave {
  const { player, account } = readOuterSave(decryptedText);
  const itemSaveDatas: AnyRecord[] = Array.isArray(player.itemSaveDatas) ? player.itemSaveDatas : [];
  const itemByUniqueId = new Map<string, AnyRecord>();

  for (const item of itemSaveDatas) {
    const uniqueId = idString(item?.UniqueId ?? item?.uniqueId ?? item?.ItemUniqueId);
    if (uniqueId && uniqueId !== "0") itemByUniqueId.set(uniqueId, item);
  }

  const heroes = (Array.isArray(player.heroSaveDatas) ? player.heroSaveDatas : []).map((hero: AnyRecord) => {
    const equippedIds = Array.isArray(hero.equippedItemIds) ? hero.equippedItemIds : [];
    const equipped = equippedIds
      .map((value: unknown, index: number) => {
        const uniqueId = idString(value);
        if (!uniqueId || uniqueId === "0") return null;
        const item = itemByUniqueId.get(uniqueId);
        return {
          slotIndex: index,
          slotLabel: slotLabel(index),
          uniqueId,
          itemKey: item ? safeNumber(item.ItemKey ?? item.itemKey, 0) || null : null,
          found: Boolean(item),
          isChaotic: item?.IsChaotic,
          isBlocked: item?.IsBlocked,
          enchantCount: Array.isArray(item?.EnchantCount) ? item.EnchantCount : undefined,
        };
      })
      .filter(Boolean) as ParsedSave["heroes"][number]["equipped"];

    return {
      heroKey: safeNumber(hero.heroKey ?? hero.HeroKey ?? hero.Key, 0),
      level: safeNumber(hero.HeroLevel ?? hero.Level, 0),
      unlocked: Boolean(hero.IsUnLock ?? hero.IsUnlock ?? hero.isUnlock),
      abilityPoint: safeNumber(hero.AbilityPoint, 0),
      allocatedAbilityPoint: safeNumber(hero.AllocatedHeroAbilityPoint, 0),
      skillKeys: Array.isArray(hero.equippedSKillKey) ? hero.equippedSKillKey.filter((key: number) => key && key > 0) : [],
      equipped,
    };
  });

  const inventoryItems = buildSlotItems(player.inventorySaveDatas, itemByUniqueId);
  const stashItems = buildSlotItems(player.stashSaveDatas, itemByUniqueId);
  const tradingStashItems = buildSlotItems(player.remakeTradingStashSaveDatas, itemByUniqueId);
  const currencies = (Array.isArray(player.currenySaveDatas) ? player.currenySaveDatas : []).map((row: AnyRecord) => ({
    key: safeNumber(row.Key, 0),
    quantity: safeNumber(row.Quantity, 0),
  }));

  const itemKeys = new Set<number>();
  for (const item of itemSaveDatas) {
    const key = safeNumber(item.ItemKey ?? item.itemKey, 0);
    if (key) itemKeys.add(key);
  }

  const common = player.commonSaveData || {};
  const version = String(common.version || account.version || "-");
  const savedAt = dotNetTicksToIso(common.lastSavedTime ?? account.lastSavedTime);
  const playTimeHours = Math.round((safeNumber(common.playTime ?? account.playTime, 0) / 3600) * 10) / 10;
  const steamIdMasked = maskSteamId(account.ownerSteamId || common.ownerSteamId);
  const equippedCount = heroes.reduce((sum, hero) => sum + hero.equipped.length, 0);

  const notes: string[] = [];
  if (equippedCount > 0) notes.push("Equipamentos dos personagens encontrados no save.");
  if (itemSaveDatas.length > 0) notes.push("Lista de itens únicos encontrada e ligada aos slots.");
  if (!equippedCount) notes.push("Nenhum equipamento ativo foi encontrado nos personagens desbloqueados.");

  return {
    ok: true,
    fileName,
    fileSize,
    version,
    savedAt,
    playTimeHours,
    steamIdMasked,
    heroes,
    currencies,
    inventoryItems,
    stashItems,
    tradingStashItems,
    itemCount: itemSaveDatas.length,
    equippedCount,
    inventoryCount: inventoryItems.length,
    stashCount: stashItems.length,
    itemKeys: Array.from(itemKeys),
    notes,
  };
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) return fail("Envie o arquivo SaveFile_Live.es3.");
    if (!file.name.toLowerCase().endsWith(".es3") && !file.name.toLowerCase().endsWith(".bak")) {
      return fail("Envie um arquivo .es3 ou .bak do Task Bar Hero.");
    }
    if (file.size > MAX_FILE_BYTES) return fail("Arquivo muito grande para analisar no site.");

    const buffer = Buffer.from(await file.arrayBuffer());
    const decrypted = decryptEasySave3(buffer);
    const parsed = parseSave(file.name, file.size, decrypted);

    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao analisar save.";
    return fail(`Não foi possível ler esse save: ${message}`);
  }
}
