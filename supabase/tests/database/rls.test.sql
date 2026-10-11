begin;
select plan(12);

-- 準備（postgres ロールで投入）
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test'),
  ('22222222-2222-2222-2222-222222222222', null);

insert into public.venues (id, place_id, name)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'place-1', 'テスト美術館');

insert into public.exhibitions (id, venue_id, title, normalized_title, start_date, end_date)
values
  ('eeeeeeee-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'A展', 'a展', '2026-10-01', '2026-12-01'),
  ('eeeeeeee-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'B展', 'b展', '2026-10-01', '2026-12-01');

insert into public.interests (user_id, exhibition_id) values
  ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-0000-0000-0000-000000000001'),
  ('22222222-2222-2222-2222-222222222222', 'eeeeeeee-0000-0000-0000-000000000002');

insert into public.blocked_domains (domain) values ('aggregator.example');

insert into public.pending_registrations (user_id, url, content_hash, extraction, publisher) values
  ('11111111-1111-1111-1111-111111111111', 'https://a.example/1', 'h1', '{}', 'venue'),
  ('22222222-2222-2222-2222-222222222222', 'https://b.example/1', 'h2', '{}', 'venue');

-- 未ログイン（anon）
set local role anon;

select is((select count(*) from public.exhibitions
            where venue_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')::int, 2,
  'anon can browse exhibitions');
select is((select count(*) from public.interests)::int, 0,
  'anon cannot see any interests');
select is((select count(*) from public.blocked_domains)::int, 0,
  'anon cannot see blocked domains');

-- ユーザー1（メール紐づけ済み）
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select results_eq(
  'select exhibition_id from public.interests',
  $$values ('eeeeeeee-0000-0000-0000-000000000001'::uuid)$$,
  'a user sees only their own interests');

select lives_ok(
  $$insert into public.interests (user_id, exhibition_id)
    values ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-0000-0000-0000-000000000002')$$,
  'a user can add their own interest');

select throws_ok(
  $$insert into public.interests (user_id, exhibition_id)
    values ('22222222-2222-2222-2222-222222222222', 'eeeeeeee-0000-0000-0000-000000000001')$$,
  '42501', null,
  'a user cannot add an interest for someone else');

select throws_ok(
  $$insert into public.exhibitions (venue_id, title, normalized_title, start_date, end_date)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'X展', 'x展', '2026-10-01', '2026-12-01')$$,
  '42501', null,
  'a user cannot write exhibitions directly');

select results_eq(
  'select url from public.pending_registrations',
  $$values ('https://a.example/1'::text)$$,
  'a user sees only their own pending registrations');

select throws_ok(
  $$insert into public.pending_registrations (user_id, url, content_hash, extraction, publisher)
    values ('11111111-1111-1111-1111-111111111111', 'https://a.example/2', 'h', '{}', 'venue')$$,
  '42501', null,
  'a user cannot create pending registrations directly');

select throws_ok(
  $$insert into public.registration_attempts (user_id) values ('11111111-1111-1111-1111-111111111111')$$,
  '42501', null,
  'a user cannot write registration attempts (rate limit records)');

-- 他人の気になるは消せない（RLS で見えないので 0 行の削除になる）
delete from public.interests
  where user_id = '22222222-2222-2222-2222-222222222222';

-- ユーザー2（匿名）
select set_config('request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated","is_anonymous":true}', true);

select results_eq(
  'select exhibition_id from public.interests',
  $$values ('eeeeeeee-0000-0000-0000-000000000002'::uuid)$$,
  'an anonymous user keeps their interest after another user tried to delete it');

select lives_ok(
  $$delete from public.interests
    where exhibition_id = 'eeeeeeee-0000-0000-0000-000000000002'$$,
  'an anonymous user can remove their own interest');

select * from finish();
rollback;
