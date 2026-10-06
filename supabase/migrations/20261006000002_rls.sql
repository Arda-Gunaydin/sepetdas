-- Sepetdaş: yardımcı fonksiyonlar, yetkiler ve RLS politikaları

-- RLS içinde kullanılan yardımcılar. SECURITY DEFINER: profiles'ın kendi politikalarında
-- özyinelemeye girmemek için.
create function public.my_dorm_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select dorm_id from public.profiles where id = auth.uid()
$$;

create function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select status = 'active' from public.profiles where id = auth.uid()), false)
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

revoke execute on function public.my_dorm_id(), public.is_active_user(), public.is_admin() from public, anon;
grant execute on function public.my_dorm_id(), public.is_active_user(), public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Tablo yetkileri. Supabase varsayılan olarak anon/authenticated'a her şeyi verir;
-- önce geri alıp sadece gerekeni (gerekirse sütun bazında) veriyoruz.
-- ---------------------------------------------------------------------------
revoke all on
  public.dorms, public.profiles, public.profile_private, public.dorm_requests,
  public.phone_claims, public.listings, public.phone_reveals, public.reports
from anon, authenticated;

grant select on public.dorms to authenticated;

grant select on public.profiles to authenticated;
grant insert (id, full_name, dorm_id, block) on public.profiles to authenticated;
grant update (full_name, dorm_id, block) on public.profiles to authenticated;

grant select on public.profile_private to authenticated;
grant insert (user_id, phone) on public.profile_private to authenticated;
grant update (phone) on public.profile_private to authenticated;

grant select on public.dorm_requests to authenticated;
grant insert (user_id, city, dorm_name) on public.dorm_requests to authenticated;

grant select on public.phone_claims to authenticated;
grant insert (user_id, phone, note) on public.phone_claims to authenticated;

grant select, delete on public.listings to authenticated;
grant insert (owner_id, dorm_id, type, platform, restaurant, description, missing_amount,
              price_per_person, people_needed, order_time)
  on public.listings to authenticated;
grant update (type, platform, restaurant, description, missing_amount, price_per_person,
              people_needed, order_time, status)
  on public.listings to authenticated;

-- phone_reveals istemciye hiç açık değil; sadece reveal_phone() yazar.

grant select on public.reports to authenticated;
grant insert (reporter_id, listing_id, reported_user_id, reason, note) on public.reports to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.dorms enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.dorm_requests enable row level security;
alter table public.phone_claims enable row level security;
alter table public.listings enable row level security;
alter table public.phone_reveals enable row level security;
alter table public.reports enable row level security;

-- dorms
create policy "dorms: aktif yurtları herkes görür" on public.dorms
  for select to authenticated
  using (is_active or (select public.is_admin()));

-- profiles
create policy "profiles: kendisi, aynı yurt, yönetici görür" on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select public.is_admin())
    or (dorm_id = (select public.my_dorm_id()) and (select public.is_active_user()))
  );

create policy "profiles: kendi profilini oluşturur" on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

create policy "profiles: kendi profilini günceller" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- profile_private: sadece sahibi
create policy "profile_private: sahibi okur" on public.profile_private
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "profile_private: sahibi ekler" on public.profile_private
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "profile_private: sahibi günceller" on public.profile_private
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- dorm_requests
create policy "dorm_requests: kendi talebini veya yönetici hepsini görür" on public.dorm_requests
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "dorm_requests: kendi adına talep açar" on public.dorm_requests
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- phone_claims
create policy "phone_claims: kendi talebini veya yönetici hepsini görür" on public.phone_claims
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "phone_claims: kendi adına talep açar" on public.phone_claims
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- listings
create policy "listings: aynı yurttaki aktif kullanıcılar, sahibi ve yönetici görür" on public.listings
  for select to authenticated
  using (
    owner_id = (select auth.uid())
    or (select public.is_admin())
    or (
      dorm_id = (select public.my_dorm_id())
      and (select public.is_active_user())
      and status <> 'hidden'
    )
  );

create policy "listings: sahibi ekler" on public.listings
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "listings: sahibi günceller" on public.listings
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "listings: sahibi siler" on public.listings
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- phone_reveals: politika yok → istemci hiçbir satırı göremez/yazamaz.

-- reports: kullanıcı sadece ekler, yönetici okur
create policy "reports: aktif kullanıcı kendi adına şikayet eder" on public.reports
  for insert to authenticated
  with check (reporter_id = (select auth.uid()) and (select public.is_active_user()));

create policy "reports: yönetici okur" on public.reports
  for select to authenticated
  using ((select public.is_admin()));
