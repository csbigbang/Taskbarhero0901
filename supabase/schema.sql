-- TBH Database BR - Supabase/PostgreSQL
-- 1) Supabase > SQL Editor > New query > cole tudo > Run.
-- 2) Depois importe os CSVs desta pasta em cada tabela com o mesmo nome.

create extension if not exists pg_trgm;

create table if not exists public.tbh_items_full (
  item_key text primary key,
  item_type text,
  grade text,
  parts text,
  gear_type text,
  gear_group text,
  item_synthesis_type text,
  name_key text,
  description_key text,
  gear_key text,
  drop_key text,
  drop_cooldown text,
  level text,
  is_steam_item text,
  icon_path text,
  is_bucket_box text,
  is_deleted_in_server text,
  is_can_exchange_marketable text,
  is_temp_marketable_false text,
  name_pt_br text,
  name_en_us text,
  description_pt_br text,
  description_en_us text
);

create table if not exists public.tbh_stages_full (
  stage_key text primary key,
  stage_name_key text,
  stage_type text,
  stage_difficulty text,
  act text,
  stage_no text,
  stage_level text,
  next_stage_key text,
  wave_amount text,
  wave_monster_amount text,
  monsters text,
  monster_drop_item_key text,
  monster_drop_item_rate text,
  boss_drop_item_key text,
  boss_drop_item_rate text,
  first_clear_drop_key text,
  boss_monster_key text,
  boss_damage_multiplier text,
  boss_hp_multiplier text,
  boss_gold_multiplier text,
  boss_exp_multiplier text,
  boss_scale text,
  soulstone_item_key text,
  soulstone_amount text,
  is_demo text,
  bgm_sound_key text,
  name_pt_br text,
  name_en_us text
);

create table if not exists public.tbh_stage_drop_items (
  id bigserial primary key,
  stage_key text,
  stage_name_pt_br text,
  stage_name_en_us text,
  act text,
  stage_no text,
  stage_level text,
  stage_type text,
  source_type text,
  source_item_key text,
  source_item_name_pt_br text,
  source_rate text,
  drop_key text,
  drop_type text,
  reward_type text,
  reward_key text,
  hero_key_condition text,
  weight text,
  weight_percent_within_dropkey numeric,
  resolved_item_key text,
  resolved_from_group_key text,
  item_name_pt_br text,
  item_name_en_us text,
  item_type text,
  grade text,
  level text,
  gear_type text,
  parts text
);

create index if not exists idx_tbh_items_name_pt on public.tbh_items_full using gin (name_pt_br gin_trgm_ops);
create index if not exists idx_tbh_items_name_en on public.tbh_items_full using gin (name_en_us gin_trgm_ops);
create index if not exists idx_tbh_items_grade on public.tbh_items_full (grade);
create index if not exists idx_tbh_items_type on public.tbh_items_full (item_type);

create index if not exists idx_tbh_stages_act_stage on public.tbh_stages_full (act, stage_no);
create index if not exists idx_tbh_stages_name_pt on public.tbh_stages_full using gin (name_pt_br gin_trgm_ops);

create index if not exists idx_tbh_drop_stage_key on public.tbh_stage_drop_items (stage_key);
create index if not exists idx_tbh_drop_item_key on public.tbh_stage_drop_items (resolved_item_key);
create index if not exists idx_tbh_drop_grade on public.tbh_stage_drop_items (grade);
create index if not exists idx_tbh_drop_item_name_pt on public.tbh_stage_drop_items using gin (item_name_pt_br gin_trgm_ops);
create index if not exists idx_tbh_drop_stage_name_pt on public.tbh_stage_drop_items using gin (stage_name_pt_br gin_trgm_ops);

alter table public.tbh_items_full enable row level security;
alter table public.tbh_stages_full enable row level security;
alter table public.tbh_stage_drop_items enable row level security;

-- Leitura pública para o site.
do $$ begin
  create policy "public read tbh_items_full" on public.tbh_items_full for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public read tbh_stages_full" on public.tbh_stages_full for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public read tbh_stage_drop_items" on public.tbh_stage_drop_items for select using (true);
exception when duplicate_object then null; end $$;
