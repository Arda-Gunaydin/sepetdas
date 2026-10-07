-- Sepetdaş: yönetici, kullanıcı detayında e-posta adresini görebilir (iletişim için).
-- E-posta auth.users'ta kalır; profiles'a kopyalanmaz (aynı yurttakiler profiles'ı okuyabiliyor).
-- Tek kullanıcı için döner; toplu e-posta listesi veren bir fonksiyon bilinçli olarak yok.

create function public.admin_user_email(p_user_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_email text;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  select u.email into v_email from auth.users u where u.id = p_user_id;
  return v_email;
end;
$$;

revoke execute on function public.admin_user_email(uuid) from public, anon;
grant execute on function public.admin_user_email(uuid) to authenticated;
