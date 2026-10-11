-- URL登録の確認待ちの間、抽出結果を保存する（0021）。
-- 書き込みはサーバー処理（service_role）だけ。本人は自分の登録待ちを読める。
create table public.pending_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  url text not null,
  content_hash text not null,
  image_url text,
  extraction jsonb not null,
  publisher public.source_publisher not null,
  created_at timestamptz not null default now(),
  constraint pending_registrations_publisher_not_third_party check (publisher <> 'third_party')
);

create index pending_registrations_user_idx on public.pending_registrations (user_id);
create index pending_registrations_created_at_idx on public.pending_registrations (created_at);

alter table public.pending_registrations enable row level security;

create policy "users can read their own pending registrations"
  on public.pending_registrations for select
  to authenticated
  using ((select auth.uid()) = user_id);
