-- BLOCO 3 - Mercado, ranking e farm value
-- Execute no Supabase SQL Editor depois do schema principal.
-- Este bloco NÃO coloca chave secreta no front-end. O site só lê dados cacheados.

create table if not exists public.tbh_market_item_map (
  item_key text primary key references public.tbh_items_full(item_key) on delete cascade,
  market_hash_name text not null,
  enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tbh_market_prices (
  item_key text primary key references public.tbh_items_full(item_key) on delete cascade,
  market_hash_name text not null,
  appid integer not null default 3678970,
  currency integer not null default 7,
  success boolean not null default false,
  lowest_price_text text,
  median_price_text text,
  volume text,
  lowest_price_brl numeric,
  median_price_brl numeric,
  last_error text,
  last_success_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.tbh_market_price_history (
  id bigserial primary key,
  item_key text references public.tbh_items_full(item_key) on delete cascade,
  market_hash_name text not null,
  currency integer not null default 7,
  lowest_price_text text,
  median_price_text text,
  volume text,
  lowest_price_brl numeric,
  median_price_brl numeric,
  success boolean not null default false,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_tbh_market_map_hash on public.tbh_market_item_map using gin (market_hash_name gin_trgm_ops);
create index if not exists idx_tbh_market_prices_lowest on public.tbh_market_prices (lowest_price_brl desc nulls last);
create index if not exists idx_tbh_market_prices_updated on public.tbh_market_prices (updated_at desc);
create index if not exists idx_tbh_market_history_item_created on public.tbh_market_price_history (item_key, created_at desc);

-- Seed inicial: usa os itens marcados como Steam/marketable no banco extraído.
-- Caso alguns nomes não batam com o Market Hash Name da Steam, edite manualmente tbh_market_item_map.market_hash_name.
insert into public.tbh_market_item_map (item_key, market_hash_name, notes)
select
  item_key,
  coalesce(nullif(name_en_us, ''), nullif(name_pt_br, ''), item_key) as market_hash_name,
  'seed automático pelo Bloco 3'
from public.tbh_items_full
where
  coalesce(is_steam_item, '') ~* 'true|1|yes'
  or coalesce(is_can_exchange_marketable, '') ~* 'true|1|yes'
on conflict (item_key) do nothing;

create or replace view public.tbh_market_items_view as
with drop_stats as (
  select
    resolved_item_key as item_key,
    count(*)::integer as drop_count,
    max(weight_percent_within_dropkey) as max_drop_weight_percent,
    avg(weight_percent_within_dropkey) as avg_drop_weight_percent
  from public.tbh_stage_drop_items
  where resolved_item_key is not null
  group by resolved_item_key
), scored as (
  select
    i.item_key,
    i.item_type,
    i.grade,
    i.parts,
    i.gear_type,
    i.gear_group,
    i.level,
    i.is_steam_item,
    i.is_can_exchange_marketable,
    i.icon_path,
    i.name_pt_br,
    i.name_en_us,
    coalesce(map.market_hash_name, p.market_hash_name, i.name_en_us, i.name_pt_br, i.item_key) as market_hash_name,
    coalesce(map.enabled, true) as market_enabled,
    p.appid,
    p.currency,
    p.success as price_success,
    p.lowest_price_text,
    p.median_price_text,
    p.volume,
    p.lowest_price_brl,
    p.median_price_brl,
    p.last_error,
    p.last_success_at,
    p.updated_at as price_updated_at,
    coalesce(ds.drop_count, 0) as drop_count,
    ds.max_drop_weight_percent,
    ds.avg_drop_weight_percent,
    case upper(coalesce(i.grade,''))
      when 'COMMON' then 10
      when 'UNCOMMON' then 18
      when 'RARE' then 28
      when 'LEGENDARY' then 42
      when 'IMMORTAL' then 56
      when 'ARCANA' then 68
      when 'BEYOND' then 78
      when 'CELESTIAL' then 86
      when 'DIVINE' then 94
      when 'COSMIC' then 100
      else 8
    end::numeric as rarity_score
  from public.tbh_items_full i
  left join public.tbh_market_item_map map on map.item_key = i.item_key
  left join public.tbh_market_prices p on p.item_key = i.item_key
  left join drop_stats ds on ds.item_key = i.item_key
)
select
  *,
  round(
    rarity_score
    + least(coalesce(lowest_price_brl, 0), 100) * 1.2
    + case when coalesce(volume, '') <> '' then 8 else 0 end
    + least(drop_count, 50) * 0.25
  , 2) as market_score,
  round(
    rarity_score * 0.65
    + least(drop_count, 80) * 0.35
    + coalesce(max_drop_weight_percent, 0) * 0.2
    + case when lowest_price_brl between 0.30 and 10 then 20 when lowest_price_brl > 10 then 10 else 0 end
  , 2) as cost_benefit_score,
  round(
    case
      when coalesce(lowest_price_brl, 0) <= 0 then rarity_score + least(drop_count, 30)
      else (rarity_score * 1.5 + least(drop_count, 50) * 0.4) / greatest(lowest_price_brl, 0.20)
    end
  , 2) as opportunity_score
from scored;

create or replace view public.tbh_farm_market_view as
select
  d.stage_key,
  d.stage_name_pt_br,
  d.stage_name_en_us,
  d.act,
  d.stage_no,
  d.stage_level,
  d.stage_type,
  d.source_type,
  count(*)::integer as drop_items_count,
  count(*) filter (where v.lowest_price_brl is not null)::integer as priced_items_count,
  round(sum(coalesce(v.lowest_price_brl, 0) * greatest(coalesce(d.weight_percent_within_dropkey, 0), 0) / 100.0), 4) as estimated_value_brl,
  round(max(coalesce(v.lowest_price_brl, 0)), 2) as best_single_price_brl,
  round(avg(nullif(v.lowest_price_brl, 0)), 2) as avg_priced_item_brl,
  round(max(coalesce(v.market_score, 0)), 2) as best_market_score,
  round(avg(coalesce(v.market_score, 0)), 2) as avg_market_score,
  max(v.name_pt_br) filter (where v.lowest_price_brl = (select max(v2.lowest_price_brl) from public.tbh_market_items_view v2 join public.tbh_stage_drop_items d2 on d2.resolved_item_key = v2.item_key where d2.stage_key = d.stage_key and d2.source_type = d.source_type)) as best_item_name_pt_br
from public.tbh_stage_drop_items d
left join public.tbh_market_items_view v on v.item_key = d.resolved_item_key
where d.stage_key is not null
  and d.resolved_item_key is not null
group by d.stage_key, d.stage_name_pt_br, d.stage_name_en_us, d.act, d.stage_no, d.stage_level, d.stage_type, d.source_type;

alter table public.tbh_market_item_map enable row level security;
alter table public.tbh_market_prices enable row level security;
alter table public.tbh_market_price_history enable row level security;

-- Leitura pública: o site pode mostrar preços cacheados.
do $$ begin
  create policy "public read tbh_market_item_map" on public.tbh_market_item_map for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public read tbh_market_prices" on public.tbh_market_prices for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public read tbh_market_price_history" on public.tbh_market_price_history for select using (true);
exception when duplicate_object then null; end $$;
