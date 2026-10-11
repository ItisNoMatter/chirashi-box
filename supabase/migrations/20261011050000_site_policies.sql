-- サイト（ドメイン）ごとの、リンクと画像の表示の制限（0025）。
-- 表示するときに当てはめるので、許可が取れたら行を更新するだけで本来の表示に戻る。
create table public.site_policies (
  domain text primary key,
  allow_links boolean not null default true,
  allow_images boolean not null default true,
  note text,
  updated_at timestamptz not null default now()
);

alter table public.site_policies enable row level security;

create policy "site policies are readable by everyone"
  on public.site_policies for select
  to anon, authenticated
  using (true);
