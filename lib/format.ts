export function clean(value?: string | number | null, fallback = "-") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text.length ? text : fallback;
}

export function prettyCode(value?: string | null) {
  return clean(value).replaceAll("_", " ");
}

export function compactNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function itemTitle(row: { name_pt_br?: string | null; name_en_us?: string | null; item_key?: string | null }) {
  return clean(row.name_pt_br || row.name_en_us || row.item_key, "Item sem nome");
}

export function stageTitle(row: { name_pt_br?: string | null; name_en_us?: string | null; stage_key?: string | null; act?: string | null; stage_no?: string | null }) {
  const name = row.name_pt_br || row.name_en_us;
  if (name) return name;
  if (row.act && row.stage_no) return `Ato ${row.act}-${row.stage_no}`;
  return clean(row.stage_key, "Fase sem nome");
}

export function gradeLabel(grade?: string | null) {
  return clean(grade).toUpperCase();
}

export function inferIconPath(iconPath?: string | null, itemKey?: string | null) {
  const explicit = clean(iconPath, "");
  if (explicit && explicit !== "-") return explicit;
  const key = clean(itemKey, "");
  return key ? `Item_${key}` : "";
}

export function moneyBRL(value?: number | string | null) {
  const n = typeof value === "string" ? Number(value) : value;
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n));
}

export function percent(value?: number | string | null, digits = 2) {
  if (value === null || value === undefined || value === "") return "-";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(Number(n))) return String(value);
  return `${Number(n).toFixed(digits)}%`;
}

export function dateBR(value?: string | null) {
  if (!value) return "Nunca";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Nunca";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(d);
}
