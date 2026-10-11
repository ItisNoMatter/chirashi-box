-- ローカル開発用のデータ。会場・展示はすべて架空。
-- 日付は実行日を基準にずらし、開催中・もうすぐ・終了がそろうようにする。

insert into public.venues (id, place_id, name, address, prefecture, municipality, website_url) values
  ('00000000-0000-0000-0000-00000000a001', 'seed-place-1', 'みなと現代美術館', '東京都港区架空1-1', '東京都', '港区', 'https://minato-moca.example'),
  ('00000000-0000-0000-0000-00000000a002', 'seed-place-2', '上野の森ギャラリー', '東京都台東区架空2-2', '東京都', '台東区', 'https://ueno-gallery.example'),
  ('00000000-0000-0000-0000-00000000a003', 'seed-place-3', 'よこはま写真館', '神奈川県横浜市西区架空3-3', '神奈川県', '横浜市', 'https://yokohama-photo.example');

insert into public.exhibitions (venue_id, title, normalized_title, start_date, end_date, official_url) values
  ('00000000-0000-0000-0000-00000000a001', '光と影のあいだ', '光と影のあいだ', current_date - 40, current_date + 3, 'https://minato-moca.example/ex/1'),
  ('00000000-0000-0000-0000-00000000a001', '未来の都市 — 建築と想像力', '未来の都市—建築と想像力', current_date - 10, current_date + 60, 'https://minato-moca.example/ex/2'),
  ('00000000-0000-0000-0000-00000000a002', '浮世絵の青', '浮世絵の青', current_date - 25, current_date + 20, 'https://ueno-gallery.example/ex/1'),
  ('00000000-0000-0000-0000-00000000a002', '春のコレクション展', '春のコレクション展', current_date + 12, current_date + 90, 'https://ueno-gallery.example/ex/2'),
  ('00000000-0000-0000-0000-00000000a003', '港の100年', '港の100年', current_date + 30, current_date + 120, 'https://yokohama-photo.example/ex/1'),
  ('00000000-0000-0000-0000-00000000a003', '夜の街を撮る', '夜の街を撮る', current_date - 90, current_date - 5, 'https://yokohama-photo.example/ex/0');
