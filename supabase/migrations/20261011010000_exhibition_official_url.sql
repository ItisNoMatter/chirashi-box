-- 展示の詳細から公式ページへリンクするための URL。
-- exhibition_sources は内部の情報（紐づけの根拠、登録者）を含むため非公開のまま、
-- 公開してよいリンク先だけを exhibitions に持たせる。会場か主催者が出したページを入れる（0016）。
alter table public.exhibitions add column official_url text;

update public.exhibitions e
set official_url = (
  select s.url
  from public.exhibition_sources s
  where s.exhibition_id = e.id and s.publisher in ('venue', 'organizer')
  order by (s.publisher = 'venue') desc, s.created_at
  limit 1
);
