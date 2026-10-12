-- 複数の展示で同じになっている館の画像（0029）。サイト共通のロゴなどで、展示のチラシとしては出さない。
create view public.shared_image_urls
  with (security_invoker = true)
as
select image_url
from public.exhibitions
where image_url is not null
group by image_url
having count(*) > 1;

grant select on public.shared_image_urls to anon, authenticated;
