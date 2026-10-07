-- Sepetdaş: yönetici için çevrim içi durumu ("son görülme").
-- Ayrı tabloda durur: profiles'ı aynı yurttakiler okuyabiliyor, son görülme onlara görünmemeli.
-- Çevrim içi = last_seen_at son 2 dakika içinde (eşik uygulamada, lib/admin.ts).

create table public.user_activity (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

create index user_activity_last_seen_at_idx on public.user_activity (last_seen_at desc);

alter table public.user_activity enable row level security;

-- Sadece yönetici okur; kimse doğrudan yazamaz (yazma touch_last_seen() ile).
revoke all on public.user_activity from public, anon, authenticated;
grant select on public.user_activity to authenticated;

create policy "user_activity: yönetici okur" on public.user_activity
  for select to authenticated
  using ((select public.is_admin()));

-- Açık sekme dakikada bir çağırır. Sık çağrıda veritabanına en fazla ~dakikada bir yazar.
-- Profili tamamlanmamış kullanıcı için hiçbir şey yapmaz.
create function public.touch_last_seen()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.user_activity as a (user_id, last_seen_at)
  select p.id, now() from public.profiles p where p.id = auth.uid()
  on conflict (user_id) do update
    set last_seen_at = excluded.last_seen_at
    where a.last_seen_at < now() - interval '50 seconds';
end;
$$;

revoke execute on function public.touch_last_seen() from public, anon;
grant execute on function public.touch_last_seen() to authenticated;
