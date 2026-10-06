-- Sepetdaş: ilan ömrü 15 dakika, son 2 dakikada +15 dk uzatma, sipariş saati kaldırıldı.
-- Süresi dolan / kapanan ilanlar kullanıcılara hiç görünmez (sahibi dahil); yönetici tüm geçmişi görür.

-- ---------------------------------------------------------------------------
-- Sipariş saati kaldırılıyor (bağlı indeks ve sütun yetkileri sütunla birlikte düşer).
-- ---------------------------------------------------------------------------
alter table public.listings drop column order_time;
create index listings_board_idx on public.listings (dorm_id, status, expires_at);

-- ---------------------------------------------------------------------------
-- Görünürlük: kullanıcılar sadece yaşayan (aktif + süresi dolmamış) ilanları görür.
-- ---------------------------------------------------------------------------
drop policy "listings: aynı yurttaki aktif kullanıcılar, sahibi ve yönetici görür" on public.listings;

create policy "listings: yaşayan ilanları sahibi ve aynı yurttaki aktif kullanıcılar, hepsini yönetici görür"
  on public.listings
  for select to authenticated
  using (
    (select public.is_admin())
    or (
      status = 'active'
      and expires_at > now()
      and (
        owner_id = (select auth.uid())
        or (dorm_id = (select public.my_dorm_id()) and (select public.is_active_user()))
      )
    )
  );

-- Yönetici numara açma kayıtlarını görebilir (kötüye kullanım incelemesi).
grant select on public.phone_reveals to authenticated;
create policy "phone_reveals: yönetici okur" on public.phone_reveals
  for select to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- listings trigger'ı: süre artık oluşturulduktan 15 dk sonra; istemci süreyi değiştiremez.
-- ---------------------------------------------------------------------------
create or replace function public.listings_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_profile public.profiles%rowtype;
  v_active_count integer;
begin
  if current_user <> 'authenticated' then
    return new;
  end if;

  select * into v_profile from public.profiles where id = auth.uid();

  if tg_op = 'UPDATE' then
    -- Değişmez alanlar. Süre sadece extend_listing() ile uzar.
    new.owner_id := old.owner_id;
    new.dorm_id := old.dorm_id;
    new.created_at := old.created_at;
    new.expires_at := old.expires_at;

    if old.status <> 'active' or old.expires_at <= now() then
      raise exception 'listing_not_editable';
    end if;
    if new.status not in ('active', 'matched', 'closed') then
      raise exception 'invalid_status';
    end if;
    if new.status <> 'active' then
      return new;
    end if;
  else
    new.status := 'active';
    new.created_at := now();
    new.expires_at := now() + interval '15 minutes';
    if new.dorm_id is distinct from v_profile.dorm_id then
      raise exception 'wrong_dorm';
    end if;
  end if;

  if v_profile.status is distinct from 'active' then
    raise exception 'account_not_active';
  end if;

  if new.type <> 'min_basket' then
    new.missing_amount := null;
  end if;
  if new.type <> 'shared_menu' then
    new.price_per_person := null;
  end if;

  if tg_op = 'INSERT' then
    -- Aynı anda en fazla 2 aktif ilan.
    perform pg_advisory_xact_lock(hashtextextended('listings:' || new.owner_id::text, 0));
    select count(*) into v_active_count
      from public.listings
     where owner_id = new.owner_id
       and status = 'active'
       and expires_at > now();
    if v_active_count >= 2 then
      raise exception 'active_listing_limit';
    end if;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- extend_listing: ilan sahibi, sürenin son 2 dakikasında +15 dk ekler.
-- Toplam ömür oluşturulduktan en fazla 6 saat.
-- ---------------------------------------------------------------------------
create function public.extend_listing(p_listing_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_listing public.listings%rowtype;
  v_new_expiry timestamptz;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_active_user() then
    raise exception 'account_not_active';
  end if;

  select * into v_listing from public.listings where id = p_listing_id for update;
  if not found or v_listing.owner_id <> auth.uid() then
    raise exception 'listing_not_found';
  end if;
  if v_listing.status <> 'active' or v_listing.expires_at <= now() then
    raise exception 'listing_not_active';
  end if;
  if v_listing.expires_at > now() + interval '2 minutes' then
    raise exception 'extend_too_early';
  end if;

  v_new_expiry := v_listing.expires_at + interval '15 minutes';
  if v_new_expiry > v_listing.created_at + interval '6 hours' then
    raise exception 'extend_limit';
  end if;

  update public.listings set expires_at = v_new_expiry where id = p_listing_id;
  return v_new_expiry;
end;
$$;

revoke execute on function public.extend_listing(uuid) from public, anon;
grant execute on function public.extend_listing(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- close_listing: "Eşleştim" / "İlanı kapat". Kapanan ilan sahibine de görünmez olduğu için
-- doğrudan UPDATE RLS'e takılır (yeni satır SELECT politikasını geçemez); bu yüzden fonksiyonla.
-- ---------------------------------------------------------------------------
create function public.close_listing(p_listing_id uuid, p_status public.listing_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_listing public.listings%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if p_status not in ('matched', 'closed') then
    raise exception 'invalid_status';
  end if;

  select * into v_listing from public.listings where id = p_listing_id for update;
  if not found or v_listing.owner_id <> auth.uid() then
    raise exception 'listing_not_found';
  end if;
  if v_listing.status <> 'active' or v_listing.expires_at <= now() then
    raise exception 'listing_not_active';
  end if;

  update public.listings set status = p_status where id = p_listing_id;
end;
$$;

revoke execute on function public.close_listing(uuid, public.listing_status) from public, anon;
grant execute on function public.close_listing(uuid, public.listing_status) to authenticated;

-- Durum artık istemciden doğrudan değiştirilemez; sadece close_listing() ile.
revoke update (status) on public.listings from authenticated;
