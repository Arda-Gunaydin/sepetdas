-- Sepetdaş: temel şema (tablolar, tipler, kısıtlar, indeksler)

create type public.profile_status as enum ('active', 'suspended', 'banned');
create type public.listing_type as enum ('min_basket', 'shared_menu', 'delivery_fee');
create type public.listing_platform as enum ('yemeksepeti', 'getir', 'trendyol', 'migros', 'phone_order', 'other');
create type public.listing_status as enum ('active', 'matched', 'closed', 'hidden');
create type public.report_reason as enum ('wrong_number', 'not_their_number', 'spam', 'inappropriate', 'other');
create type public.report_status as enum ('open', 'resolved');
create type public.request_status as enum ('pending', 'approved', 'rejected');

-- Yurtlar: supabase/seed/dorms.csv'den yüklenir, yönetici onayıyla eklenir.
create table public.dorms (
  id bigint generated always as identity primary key,
  city text not null check (char_length(city) between 2 and 40),
  name text not null check (char_length(name) between 2 and 150),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (city, name)
);

-- Aynı yurttakilere görünen profil.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 3 and 60),
  dorm_id bigint not null references public.dorms (id),
  block text check (block is null or char_length(block) <= 30),
  status public.profile_status not null default 'active',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
create index profiles_dorm_id_idx on public.profiles (dorm_id);

-- Sadece sahibinin erişebildiği özel bilgiler. Telefon ilan sorgularına asla karışmasın diye ayrı tabloda.
create table public.profile_private (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  phone text not null unique check (phone ~ '^\+905[0-9]{9}$'),
  phone_verified boolean not null default false,
  phone_changed_at timestamptz,
  consent_at timestamptz not null default now()
);

-- "Yurdum listede yok" talepleri. Profil tamamlanmadan da gönderilebildiği için auth.users'a bağlı.
create table public.dorm_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  city text not null check (char_length(city) between 2 and 40),
  dorm_name text not null check (char_length(dorm_name) between 3 and 150),
  status public.request_status not null default 'pending',
  created_at timestamptz not null default now()
);
create index dorm_requests_status_idx on public.dorm_requests (status, created_at);

-- "Bu numara başka bir hesapta kayıtlı, numara bana ait" talepleri.
create table public.phone_claims (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  phone text not null check (phone ~ '^\+905[0-9]{9}$'),
  note text check (note is null or char_length(note) <= 500),
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  unique (user_id, phone)
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  dorm_id bigint not null references public.dorms (id),
  type public.listing_type not null,
  platform public.listing_platform not null,
  restaurant text not null check (char_length(restaurant) between 2 and 80),
  description text check (description is null or char_length(description) <= 300),
  missing_amount integer check (missing_amount is null or missing_amount between 1 and 10000),
  price_per_person integer check (price_per_person is null or price_per_person between 1 and 10000),
  people_needed smallint not null default 1 check (people_needed between 1 and 5),
  order_time timestamptz not null,
  expires_at timestamptz not null,
  status public.listing_status not null default 'active',
  created_at timestamptz not null default now(),
  constraint listings_min_basket_amount check (type <> 'min_basket' or missing_amount is not null)
);
create index listings_board_idx on public.listings (dorm_id, status, order_time);
create index listings_owner_idx on public.listings (owner_id, status);

-- Numarayı kimin açtığının kaydı (hız sınırı ve kötüye kullanım incelemesi).
create table public.phone_reveals (
  id bigint generated always as identity primary key,
  listing_id uuid not null references public.listings (id) on delete cascade,
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index phone_reveals_viewer_idx on public.phone_reveals (viewer_id, created_at);

create table public.reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete set null,
  reported_user_id uuid not null references public.profiles (id) on delete cascade,
  reason public.report_reason not null,
  note text check (note is null or char_length(note) <= 500),
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  unique (reporter_id, reported_user_id),
  check (reporter_id <> reported_user_id)
);
create index reports_reported_user_idx on public.reports (reported_user_id, status);
