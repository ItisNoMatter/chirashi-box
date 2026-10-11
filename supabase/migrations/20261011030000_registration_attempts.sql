-- URL登録を始めた記録。断られた試行も LLM や Places の費用がかかるので、
-- アカウント単位のレート制限（0008）はこの記録で数える。サーバー処理（service_role）だけが読み書きする。
create table public.registration_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index registration_attempts_user_created_idx on public.registration_attempts (user_id, created_at);

alter table public.registration_attempts enable row level security;
