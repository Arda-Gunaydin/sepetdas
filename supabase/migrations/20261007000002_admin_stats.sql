-- Sepetdaş: yönetici paneli için yurt bazlı özet (PostgREST gruplama yapamadığı için fonksiyon).

create function public.admin_dorm_stats(p_limit integer default 10)
returns table (
  dorm_id bigint,
  city text,
  name text,
  user_count bigint,
  listing_count bigint,
  active_listing_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  return query
  select d.id,
         d.city,
         d.name,
         (select count(*) from public.profiles p where p.dorm_id = d.id),
         (select count(*) from public.listings l where l.dorm_id = d.id),
         (select count(*) from public.listings l
           where l.dorm_id = d.id and l.status = 'active' and l.expires_at > now())
    from public.dorms d
   where exists (select 1 from public.profiles p where p.dorm_id = d.id)
   order by 4 desc, 5 desc, d.name
   limit least(greatest(p_limit, 1), 100);
end;
$$;

revoke execute on function public.admin_dorm_stats(integer) from public, anon;
grant execute on function public.admin_dorm_stats(integer) to authenticated;
