-- Sepetdaş: iş kuralları (trigger'lar)
--
-- Kural: kullanıcıdan gelen istekler `authenticated` rolüyle çalışır. Trigger'lar SECURITY INVOKER
-- olduğu için current_user'a bakarak sadece istemci isteklerinde kural uygular; sistemin kendi
-- SECURITY DEFINER fonksiyonları (otomatik askıya alma, yurt değişince ilan kapatma vb.) ve
-- yönetici scriptleri (postgres) kontrolsüz geçer.
-- Hatalar `P0001` koduyla ve makinece okunur mesajla atılır; uygulama Türkçe metne çevirir.

-- ---------------------------------------------------------------------------
-- profiles: seçilen yurt aktif olmalı
-- ---------------------------------------------------------------------------
create function public.profiles_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user <> 'authenticated' then
    return new;
  end if;

  if tg_op = 'INSERT' or new.dorm_id is distinct from old.dorm_id then
    if not exists (select 1 from public.dorms where id = new.dorm_id and is_active) then
      raise exception 'dorm_not_found';
    end if;
  end if;

  return new;
end;
$$;

create trigger profiles_before_write
  before insert or update on public.profiles
  for each row execute function public.profiles_before_write();

-- Yurt değişince açık ilanlar kapanır.
create function public.profiles_after_dorm_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.listings
     set status = 'closed'
   where owner_id = new.id
     and status = 'active';
  return null;
end;
$$;

create trigger profiles_after_dorm_change
  after update of dorm_id on public.profiles
  for each row
  when (old.dorm_id is distinct from new.dorm_id)
  execute function public.profiles_after_dorm_change();

-- ---------------------------------------------------------------------------
-- profile_private: numara 30 günde en fazla bir kez değişir
-- ---------------------------------------------------------------------------
create function public.profile_private_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.phone is distinct from old.phone then
    if current_user = 'authenticated'
       and old.phone_changed_at is not null
       and old.phone_changed_at > now() - interval '30 days' then
      raise exception 'phone_change_too_soon';
    end if;
    new.phone_changed_at := now();
    new.phone_verified := false;
  end if;
  return new;
end;
$$;

create trigger profile_private_before_update
  before update on public.profile_private
  for each row execute function public.profile_private_before_update();

-- ---------------------------------------------------------------------------
-- listings
-- ---------------------------------------------------------------------------
create function public.listings_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_profile public.profiles%rowtype;
  v_active_count integer;
  v_created_at timestamptz;
begin
  if current_user <> 'authenticated' then
    return new;
  end if;

  select * into v_profile from public.profiles where id = auth.uid();

  if tg_op = 'UPDATE' then
    -- Değişmez alanlar (sütun yetkileri zaten engelliyor, burada da garanti altına alıyoruz).
    new.owner_id := old.owner_id;
    new.dorm_id := old.dorm_id;
    new.created_at := old.created_at;

    if old.status <> 'active' then
      raise exception 'listing_not_editable';
    end if;
    if new.status not in ('active', 'matched', 'closed') then
      raise exception 'invalid_status';
    end if;
    -- Kapatma / eşleşti işaretleme her zaman serbest.
    if new.status <> 'active' then
      return new;
    end if;
    v_created_at := old.created_at;
  else
    new.status := 'active';
    new.created_at := now();
    v_created_at := new.created_at;
    if new.dorm_id is distinct from v_profile.dorm_id then
      raise exception 'wrong_dorm';
    end if;
  end if;

  if v_profile.status is distinct from 'active' then
    raise exception 'account_not_active';
  end if;

  -- Türe ait olmayan alanları temizle.
  if new.type <> 'min_basket' then
    new.missing_amount := null;
  end if;
  if new.type <> 'shared_menu' then
    new.price_per_person := null;
  end if;

  if new.order_time < now() - interval '5 minutes'
     or new.order_time > v_created_at + interval '6 hours' then
    raise exception 'invalid_order_time';
  end if;

  new.expires_at := least(new.order_time + interval '30 minutes', v_created_at + interval '6 hours');

  -- Aynı anda en fazla 2 aktif ilan. Eşzamanlı isteklerde sınırı aşmamak için kullanıcı bazlı kilit.
  perform pg_advisory_xact_lock(hashtextextended('listings:' || new.owner_id::text, 0));
  select count(*) into v_active_count
    from public.listings
   where owner_id = new.owner_id
     and status = 'active'
     and expires_at > now()
     and id <> new.id;
  if v_active_count >= 2 then
    raise exception 'active_listing_limit';
  end if;

  return new;
end;
$$;

create trigger listings_before_write
  before insert or update on public.listings
  for each row execute function public.listings_before_write();

-- ---------------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------------
create function public.reports_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_owner uuid;
begin
  new.status := 'open';
  new.created_at := now();

  if current_user <> 'authenticated' then
    return new;
  end if;

  -- Şikayet bir ilan üzerinden yapılır; ilanı görebiliyor olmalı (RLS: aynı yurt).
  if new.listing_id is null then
    raise exception 'listing_not_found';
  end if;
  select owner_id into v_owner from public.listings where id = new.listing_id;
  if v_owner is null then
    raise exception 'listing_not_found';
  end if;
  new.reported_user_id := v_owner;
  if v_owner = auth.uid() then
    raise exception 'cannot_report_self';
  end if;

  return new;
end;
$$;

create trigger reports_before_insert
  before insert on public.reports
  for each row execute function public.reports_before_insert();

-- 3 farklı kişiden açık "yanlış numara / numara onun değil" şikayeti → ilanlar gizlenir, hesap askıya alınır.
create function public.reports_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reporters integer;
begin
  if new.reason not in ('wrong_number', 'not_their_number') then
    return null;
  end if;

  select count(distinct reporter_id) into v_reporters
    from public.reports
   where reported_user_id = new.reported_user_id
     and reason in ('wrong_number', 'not_their_number')
     and status = 'open';

  if v_reporters >= 3 then
    update public.profiles
       set status = 'suspended'
     where id = new.reported_user_id
       and status = 'active';
    update public.listings
       set status = 'hidden'
     where owner_id = new.reported_user_id
       and status = 'active';
  end if;

  return null;
end;
$$;

create trigger reports_after_insert
  after insert on public.reports
  for each row execute function public.reports_after_insert();

-- ---------------------------------------------------------------------------
-- dorm_requests / phone_claims: durum istemciden belirlenemez, bekleyen talep sınırı
-- ---------------------------------------------------------------------------
create function public.dorm_requests_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.status := 'pending';
  new.created_at := now();
  if current_user = 'authenticated'
     and (select count(*) from public.dorm_requests
           where user_id = new.user_id and status = 'pending') >= 3 then
    raise exception 'too_many_requests';
  end if;
  return new;
end;
$$;

create trigger dorm_requests_before_insert
  before insert on public.dorm_requests
  for each row execute function public.dorm_requests_before_insert();

create function public.phone_claims_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.status := 'open';
  new.created_at := now();
  return new;
end;
$$;

create trigger phone_claims_before_insert
  before insert on public.phone_claims
  for each row execute function public.phone_claims_before_insert();

revoke execute on function
  public.profiles_before_write(),
  public.profiles_after_dorm_change(),
  public.profile_private_before_update(),
  public.listings_before_write(),
  public.reports_before_insert(),
  public.reports_after_insert(),
  public.dorm_requests_before_insert(),
  public.phone_claims_before_insert()
from public, anon, authenticated;
