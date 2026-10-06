-- Sepetdaş: yönetici yurt yönetimi (ekle / düzenle / pasifleştir / sil).

-- Pasif yurttaki kullanıcı kendi yurdunu görmeye devam etsin (profil ve başlıkta adı boş kalmasın).
drop policy "dorms: aktif yurtları herkes görür" on public.dorms;
create policy "dorms: aktif yurtları herkes, kendi yurdunu sahibi, hepsini yönetici görür" on public.dorms
  for select to authenticated
  using (is_active or id = (select public.my_dorm_id()) or (select public.is_admin()));

-- Yurt ekler (p_id null) veya adını / ilini düzeltir. Aynı il + ad varsa hata.
create function public.admin_save_dorm(p_id bigint, p_city text, p_name text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
  v_city text := regexp_replace(trim(coalesce(p_city, '')), '\s+', ' ', 'g');
  v_name text := regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g');
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if char_length(v_city) < 2 or char_length(v_name) < 2 then
    raise exception 'invalid_dorm';
  end if;

  begin
    if p_id is null then
      insert into public.dorms (city, name) values (v_city, v_name) returning id into v_id;
    else
      update public.dorms set city = v_city, name = v_name where id = p_id returning id into v_id;
      if v_id is null then
        raise exception 'dorm_not_found';
      end if;
    end if;
  exception when unique_violation then
    raise exception 'dorm_exists';
  end;

  return v_id;
end;
$$;

create function public.admin_set_dorm_active(p_id bigint, p_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  update public.dorms set is_active = p_active where id = p_id;
  if not found then
    raise exception 'dorm_not_found';
  end if;
end;
$$;

-- Sadece hiç kullanıcısı / ilanı / talebi olmayan yurt kalıcı silinir; diğerleri pasifleştirilir.
create function public.admin_delete_dorm(p_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if exists (select 1 from public.profiles where dorm_id = p_id)
     or exists (select 1 from public.listings where dorm_id = p_id) then
    raise exception 'dorm_in_use';
  end if;
  delete from public.dorms where id = p_id;
  if not found then
    raise exception 'dorm_not_found';
  end if;
end;
$$;

revoke execute on function
  public.admin_save_dorm(bigint, text, text),
  public.admin_set_dorm_active(bigint, boolean),
  public.admin_delete_dorm(bigint)
from public, anon;

grant execute on function
  public.admin_save_dorm(bigint, text, text),
  public.admin_set_dorm_active(bigint, boolean),
  public.admin_delete_dorm(bigint)
to authenticated;
