-- ============================================================
--  Jolu — схема БД (Supabase / PostgreSQL)
--  Фаза 1 (MVP): пользователи, компании, направления, туры,
--  выезды, заявки. Чаты/отзывы/геймификация — Фаза 2.
--  Запуск: Supabase SQL Editor → выполнить целиком.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── enums ───────────────────────────────────────────────────
do $$ begin
  create type user_role        as enum ('tourist', 'company', 'admin');
  create type tour_type        as enum ('trekking','horse','jeep','camping','cultural','gastro','ski');
  create type difficulty_level as enum ('easy','medium','hard');
  create type tour_status      as enum ('draft','moderation','published','archived');
  create type departure_status as enum ('gathering','confirmed','cancelled');
  create type booking_status   as enum ('pending','confirmed','prepaid','completed','cancelled');
  create type company_status   as enum ('pending','verified','rejected');
exception when duplicate_object then null; end $$;

-- ── users ───────────────────────────────────────────────────
create table if not exists users (
  id          uuid primary key default uuid_generate_v4(),
  role        user_role not null default 'tourist',
  name        text,
  phone       text unique,
  email       text unique,
  tg_chat_id  bigint,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- ── companies ───────────────────────────────────────────────
create table if not exists companies (
  id             uuid primary key default uuid_generate_v4(),
  owner_user_id  uuid references users(id) on delete set null,
  name           text not null,
  slug           text unique not null,
  logo_url       text,
  description    text,
  phone          text,
  instagram      text,
  is_verified    boolean not null default false,
  rating         numeric(2,1) default 0,
  status         company_status not null default 'pending',
  created_at     timestamptz not null default now()
);

-- ── destinations ────────────────────────────────────────────
create table if not exists destinations (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  name_en      text,
  slug         text unique not null,
  region       text,
  lat          double precision,
  lng          double precision,
  cover_url    text,
  season_from  int check (season_from between 1 and 12),
  season_to    int check (season_to between 1 and 12),
  description  text
);

-- ── tours ───────────────────────────────────────────────────
create table if not exists tours (
  id              uuid primary key default uuid_generate_v4(),
  company_id      uuid not null references companies(id) on delete cascade,
  destination_id  uuid references destinations(id) on delete set null,
  title           text not null,
  slug            text unique not null,
  type            tour_type not null,
  difficulty      difficulty_level not null default 'easy',
  duration_days   int not null default 1,
  price           numeric not null,
  price_child     numeric,
  currency        text not null default 'KGS',
  guide_langs     text[] default '{}',
  small_group     boolean default false,
  kids_friendly   boolean default false,
  all_inclusive   boolean default false,
  included        jsonb default '[]',
  excluded        jsonb default '[]',
  program         jsonb default '[]',
  packing_list    jsonb default '[]',
  meeting_point   text,
  meeting_lat     double precision,
  meeting_lng     double precision,
  status          tour_status not null default 'draft',
  rating          numeric(3,2) default 0,
  views_count     int default 0,
  created_at      timestamptz not null default now()
);

create table if not exists tour_media (
  id          uuid primary key default uuid_generate_v4(),
  tour_id     uuid not null references tours(id) on delete cascade,
  url         text not null,
  type        text not null default 'image',  -- image | video
  sort_order  int default 0
);

-- ── departures ──────────────────────────────────────────────
create table if not exists departures (
  id              uuid primary key default uuid_generate_v4(),
  tour_id         uuid not null references tours(id) on delete cascade,
  date_start      date not null,
  date_end        date,
  seats_total     int not null default 10,
  seats_taken     int not null default 0,
  min_group_size  int not null default 1,
  status          departure_status not null default 'gathering'
);

-- ── bookings ────────────────────────────────────────────────
create table if not exists bookings (
  id            uuid primary key default uuid_generate_v4(),
  departure_id  uuid not null references departures(id) on delete cascade,
  user_id       uuid references users(id) on delete set null,
  adults        int not null default 1,
  children      int not null default 0,
  total_price   numeric,
  status        booking_status not null default 'pending',
  contact_name  text,
  contact_phone text,
  note          text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_tours_company    on tours(company_id);
create index if not exists idx_tours_dest       on tours(destination_id);
create index if not exists idx_departures_tour  on departures(tour_id);
create index if not exists idx_bookings_dep     on bookings(departure_id);
create index if not exists idx_bookings_status  on bookings(status);

-- ── Индексы под фильтры каталога (мгновенное открытие выдачи) ──
-- Каталог фильтрует по направлению, типу, цене и ближайшей дате выезда.
create index if not exists idx_tours_price      on tours(price);
create index if not exists idx_tours_type       on tours(type);
-- Частичный индекс: каталог почти всегда листает только опубликованные туры
create index if not exists idx_tours_published  on tours(status) where status = 'published';
-- Сортировка/фильтр по ближайшему выезду и набору группы
create index if not exists idx_departures_date  on departures(date_start);
create index if not exists idx_departures_status on departures(status);
-- Композитный индекс под типичный запрос «активные будущие выезды тура»
create index if not exists idx_departures_tour_date on departures(tour_id, date_start);

-- ============================================================
--  RLS (Row Level Security) — Фаза 1
-- ============================================================
alter table tours       enable row level security;
alter table departures  enable row level security;
alter table bookings    enable row level security;
alter table companies   enable row level security;

-- Публичный каталог: видны только опубликованные туры
create policy "public read published tours" on tours
  for select using (status = 'published');

create policy "public read departures" on departures
  for select using (true);

create policy "public read companies" on companies
  for select using (true);

-- Компания управляет своими турами
create policy "company manages own tours" on tours
  for all using (
    company_id in (select id from companies where owner_user_id = auth.uid())
  );

-- Заявку может создать любой (в т.ч. гость через service role на сервере)
create policy "anyone can create booking" on bookings
  for insert with check (true);

-- Турист видит свои заявки; компания — заявки на свои выезды
create policy "tourist reads own bookings" on bookings
  for select using (user_id = auth.uid());

create policy "company reads its bookings" on bookings
  for select using (
    departure_id in (
      select d.id from departures d
      join tours t on t.id = d.tour_id
      join companies c on c.id = t.company_id
      where c.owner_user_id = auth.uid()
    )
  );

-- ============================================================
--  Триггер: при новой заявке — нотификация боту.
--  Реализация отправки в Telegram — на стороне бота/Edge Function.
--  Здесь только увеличиваем счётчик занятых мест.
-- ============================================================
create or replace function on_booking_created() returns trigger as $$
begin
  update departures
    set seats_taken = seats_taken + new.adults + new.children
    where id = new.departure_id;
  -- pg_notify слушает бот или Edge Function для отправки уведомления
  perform pg_notify('new_booking', new.id::text);
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_booking_created on bookings;
create trigger trg_booking_created
  after insert on bookings
  for each row execute function on_booking_created();
