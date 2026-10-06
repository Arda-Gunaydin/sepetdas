-- Sepetdaş: RPC fonksiyonları

-- ---------------------------------------------------------------------------
-- reveal_phone: telefon numarası SADECE buradan döner.
-- ---------------------------------------------------------------------------
create function public.reveal_phone(p_listing_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_viewer public.profiles%rowtype;
  v_listing public.listings%rowtype;
  v_owner_status public.profile_status;
  v_day_start timestamptz;
  v_count integer;
  v_phone text;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_viewer from public.profiles where id = v_uid;
  if not found then
    raise exception 'profile_incomplete';
  end if;
  if v_viewer.status <> 'active' then
    raise exception 'account_not_active';
  end if;

  select * into v_listing from public.listings where id = p_listing_id;
  if not found or v_listing.dorm_id <> v_viewer.dorm_id or v_listing.status = 'hidden' then
    raise exception 'listing_not_found';
  end if;
  if v_listing.owner_id = v_uid then
    raise exception 'own_listing';
  end if;

  select status into v_owner_status from public.profiles where id = v_listing.owner_id;
  if v_listing.status <> 'active' or v_listing.expires_at <= now() or v_owner_status <> 'active' then
    raise exception 'listing_not_active';
  end if;

  -- Günlük sınır: İstanbul saatine göre bugün en fazla 20 farklı ilan. Aynı ilanı tekrar açmak sayılmaz.
  perform pg_advisory_xact_lock(hashtextextended('reveals:' || v_uid::text, 0));
  v_day_start := date_trunc('day', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul';

  if not exists (
    select 1 from public.phone_reveals
     where viewer_id = v_uid and listing_id = p_listing_id and created_at >= v_day_start
  ) then
    select count(distinct listing_id) into v_count
      from public.phone_reveals
     where viewer_id = v_uid and created_at >= v_day_start;
    if v_count >= 20 then
      raise exception 'daily_reveal_limit';
    end if;
  end if;

  insert into public.phone_reveals (listing_id, viewer_id) values (p_listing_id, v_uid);

  select phone into v_phone from public.profile_private where user_id = v_listing.owner_id;
  return v_phone;
end;
$$;

-- ---------------------------------------------------------------------------
-- complete_profile: profil + özel bilgiler tek işlemde (RLS ve trigger'lar geçerli).
-- Numara kayıtlıysa unique ihlali (23505, profile_private_phone_key) döner.
-- ---------------------------------------------------------------------------
create function public.complete_profile(
  p_full_name text,
  p_dorm_id bigint,
  p_block text,
  p_phone text,
  p_consent boolean
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if p_consent is not true then
    raise exception 'consent_required';
  end if;

  insert into public.profiles (id, full_name, dorm_id, block)
  values (auth.uid(), p_full_name, p_dorm_id, nullif(p_block, ''));

  insert into public.profile_private (user_id, phone)
  values (auth.uid(), p_phone);
end;
$$;

-- ---------------------------------------------------------------------------
-- delete_my_account: hesabı ve ona bağlı her şeyi kalıcı olarak siler (FK'ler CASCADE).
-- ---------------------------------------------------------------------------
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

-- ---------------------------------------------------------------------------
-- Yönetici işlemleri
-- ---------------------------------------------------------------------------
create function public.admin_set_user_status(p_user_id uuid, p_status public.profile_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'cannot_change_self';
  end if;

  update public.profiles set status = p_status where id = p_user_id;

  -- Hesap yeniden açılınca eski şikayetler kapanır; yoksa ilk yeni şikayette yeniden askıya alınır.
  if p_status = 'active' then
    update public.reports set status = 'resolved'
     where reported_user_id = p_user_id and status = 'open';
  end if;

  -- Banlanan kullanıcının açık ilanları gizlenir.
  if p_status <> 'active' then
    update public.listings set status = 'hidden'
     where owner_id = p_user_id and status = 'active';
  end if;
end;
$$;

create function public.admin_resolve_report(p_report_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  update public.reports set status = 'resolved' where id = p_report_id;
end;
$$;

create function public.admin_review_dorm_request(
  p_request_id bigint,
  p_approve boolean,
  p_city text default null,
  p_name text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.dorm_requests%rowtype;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  select * into v_request from public.dorm_requests where id = p_request_id for update;
  if not found or v_request.status <> 'pending' then
    raise exception 'request_not_found';
  end if;

  if p_approve then
    insert into public.dorms (city, name)
    values (coalesce(nullif(trim(p_city), ''), v_request.city),
            coalesce(nullif(trim(p_name), ''), v_request.dorm_name))
    on conflict (city, name) do update set is_active = true;
  end if;

  update public.dorm_requests
     set status = case when p_approve then 'approved'::public.request_status
                       else 'rejected'::public.request_status end
   where id = p_request_id;
end;
$$;

create function public.admin_resolve_phone_claim(p_claim_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  update public.phone_claims set status = 'resolved' where id = p_claim_id;
end;
$$;

revoke execute on function
  public.reveal_phone(uuid),
  public.complete_profile(text, bigint, text, text, boolean),
  public.delete_my_account(),
  public.admin_set_user_status(uuid, public.profile_status),
  public.admin_resolve_report(bigint),
  public.admin_review_dorm_request(bigint, boolean, text, text),
  public.admin_resolve_phone_claim(bigint)
from public, anon;

grant execute on function
  public.reveal_phone(uuid),
  public.complete_profile(text, bigint, text, text, boolean),
  public.delete_my_account(),
  public.admin_set_user_status(uuid, public.profile_status),
  public.admin_resolve_report(bigint),
  public.admin_review_dorm_request(bigint, boolean, text, text),
  public.admin_resolve_phone_claim(bigint)
to authenticated;
