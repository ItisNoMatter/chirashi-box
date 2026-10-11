-- 初期スキーマ。設計の経緯は docs/any-decision-record/ を参照。

-- 会場。同一性は Google Places の place_id で決める（0005）。
-- address / prefecture / municipality を保存してよい範囲は、Places の規約確認が済むまで暫定（0005, 0014）。
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  place_id text not null unique,
  name text not null,
  address text,
  prefecture text,
  municipality text,
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 巡回対象。設定ファイルではなく DB で管理する（0009）。
create table public.crawl_targets (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  listing_url text not null unique,
  enabled boolean not null default true,
  -- 一覧ページの主要部分のハッシュ。前回と同じならその会場の巡回を終える（0010）。
  last_listing_hash text,
  last_crawled_at timestamptz,
  -- 巡回対象に加える前に、人が利用規約を確認した日時（0016）。
  terms_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text
);

-- 展示 = 1つの会場 × 1つの会期（CONTEXT.md）。
-- 解説文を入れる列はあえて作らない（0016）。
create table public.exhibitions (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete restrict,
  title text not null,
  -- 重複候補の照合（0003）と、後から足す検索（0014）に使う。
  normalized_title text not null,
  start_date date not null,
  end_date date not null,
  -- 館の画像URL。保存せず直接表示する（0007）。
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exhibitions_period_valid check (start_date <= end_date)
);

create index exhibitions_venue_period_idx
  on public.exhibitions (venue_id, start_date, end_date);
create index exhibitions_end_date_idx on public.exhibitions (end_date);
create index exhibitions_start_date_idx on public.exhibitions (start_date);

create type public.source_origin as enum ('crawl', 'user');
create type public.source_publisher as enum ('venue', 'organizer', 'third_party');

-- 展示の取得元。1つの展示は複数の URL を持てる（0003）。
create table public.exhibition_sources (
  id uuid primary key default gen_random_uuid(),
  exhibition_id uuid not null references public.exhibitions (id) on delete cascade,
  url text not null unique,
  origin public.source_origin not null,
  publisher public.source_publisher not null,
  -- 個別ページの主要部分のハッシュ（0010）。
  content_hash text,
  -- LLM が抜き出した会場名の生の文字列。紐づけの根拠を後から追うため（0005）。
  raw_venue_name text,
  -- 名前が一致しない候補に統合したときの根拠（0006）。
  match_reason text,
  registered_by uuid references auth.users (id) on delete set null,
  fetched_at timestamptz,
  created_at timestamptz not null default now()
);

create index exhibition_sources_exhibition_idx
  on public.exhibition_sources (exhibition_id);

-- 気になる（CONTEXT.md）。
create table public.interests (
  user_id uuid not null references auth.users (id) on delete cascade,
  exhibition_id uuid not null references public.exhibitions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, exhibition_id)
);

create index interests_exhibition_idx on public.interests (exhibition_id);

-- URL登録で即座に断るまとめサイトのドメイン（0016）。
create table public.blocked_domains (
  domain text primary key,
  note text,
  created_at timestamptz not null default now()
);

-- RLS ----------------------------------------------------------------------
-- 書き込みは巡回とURL登録のサーバー処理（service_role）だけが行う。
-- クライアントに見せるのは venues / exhibitions の閲覧と、自分の interests だけ。

alter table public.venues enable row level security;
alter table public.crawl_targets enable row level security;
alter table public.exhibitions enable row level security;
alter table public.exhibition_sources enable row level security;
alter table public.interests enable row level security;
alter table public.blocked_domains enable row level security;

-- 閲覧はログイン不要（0008）。
create policy "venues are readable by everyone"
  on public.venues for select
  to anon, authenticated
  using (true);

create policy "exhibitions are readable by everyone"
  on public.exhibitions for select
  to anon, authenticated
  using (true);

-- 気になるは本人だけが見て、付けて、外せる（匿名ユーザーを含む、0008 / 0015）。
create policy "users can read their own interests"
  on public.interests for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "users can add their own interests"
  on public.interests for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "users can remove their own interests"
  on public.interests for delete
  to authenticated
  using ((select auth.uid()) = user_id);
