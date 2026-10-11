-- 巡回で「展示ではない」と判定したページ。ページが変わらない限り、次からは抽出しない。
-- サーバー処理（service_role）だけが読み書きする。
create table public.crawled_pages (
  url text primary key,
  content_hash text not null,
  checked_at timestamptz not null default now()
);

alter table public.crawled_pages enable row level security;

-- 個別ページの URL パターン。あれば LLM を使わずにこれで選ぶ（0022、MVP では未使用）。
alter table public.crawl_targets add column detail_url_pattern text;
