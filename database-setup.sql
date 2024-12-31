-- Удаляем существующие таблицы, если они есть
drop table if exists public.purchased_cards;
drop table if exists public.game_progress;
drop table if exists public.cards;
drop table if exists public.users;

-- Создание таблицы для пользователей
create table public.users (
    id uuid default uuid_generate_v4() primary key,
    username text not null,
    telegram_id text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(username),
    unique(telegram_id)
);

-- Создание таблицы для игрового прогресса
create table public.game_progress (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade,
    balance bigint default 0,
    energy integer default 100,
    hourly_rate integer default 10,
    last_collect_time timestamp with time zone default timezone('utc'::text, now()),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Создание таблицы для карточек
create table public.cards (
    id serial primary key,
    title text not null,
    description text not null,
    image_url text not null,
    price bigint not null,
    per_hour integer not null,
    is_new boolean default false
);

-- Создание таблицы для купленных карточек
create table public.purchased_cards (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade,
    card_id integer references public.cards(id) on delete cascade,
    purchased_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, card_id)
);

-- Вставка начальных карточек
insert into public.cards (title, description, image_url, price, per_hour, is_new) values
    ('Начало пути', 'Коала только начинает своё путешествие. Даёт 120 эвкалипта в час', 'https://res.cloudinary.com/dib4woqge/image/upload/v1735300135/1000000472_wu48p4.png', 10000, 120, false),
    ('Первые деньги', 'Коала заработала свои первые деньги. Продолжаем в том же духе. Добавляет 350 эвкалипта в час', 'https://i.postimg.cc/sxpJmh0S/image.png', 25000, 350, false),
    ('Коала на отдыхе', 'После первых заработанных денег можно хорошенько отдохнуть. Добавляет 800 эвкалипта в час', 'https://i.postimg.cc/pVwWnFHC/image.png', 35000, 800, false),
    ('Снежные забавы', 'Наступила зима, а значит можно хорошо порезвиться в снежки. Но не забываем про прибыль в 1800 эвкалипта в час', 'https://i.postimg.cc/nLCgk3KD/image.png', 50000, 1800, false),
    ('Коала-путешественник', 'Наша коала отправляется в кругосветное путешествие, собирая эвкалипт по всему миру. Приносит 3500 эвкалипта в час', 'https://i.postimg.cc/wTxjfh3V/Leonardo-Phoenix-10-A-vibrant-whimsical-illustration-of-Koala-2.jpg', 75000, 3500, true),
    ('Бизнес-коала', 'Пора открывать свой бизнес! Коала в деловом костюме управляет сетью эвкалиптовых плантаций. Добавляет 7000 эвкалипта в час', 'https://i.postimg.cc/3JnrGd8c/Leonardo-Phoenix-10-A-whimsical-digital-illustration-of-a-koal-0.jpg', 100000, 7000, true),
    ('Космический исследователь', 'Коала покоряет космос в поисках редких видов эвкалипта на других планетах. Приносит 12000 эвкалипта в час', 'https://i.postimg.cc/zvqbJ67b/Leonardo-Phoenix-10-A-vibrant-whimsical-illustration-of-Space-0.jpg', 150000, 12000, true),
    ('Коала-волшебник', 'Магия и эвкалипт - отличное сочетание! Коала освоила древние заклинания приумножения эвкалипта. Добавляет 20000 эвкалипта в час', 'https://i.postimg.cc/bv23bSh0/Leonardo-Phoenix-10-In-a-whimsical-vibrant-illustration-depict-0.jpg', 200000, 20000, true);

-- Включение Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.game_progress enable row level security;
alter table public.cards enable row level security;
alter table public.purchased_cards enable row level security;

-- Политики безопасности
create policy "Публичный доступ к users" 
    on public.users for select 
    using (true);

create policy "Пользователи могут создавать записи" 
    on public.users for insert 
    with check (true);

create policy "Доступ к своему прогрессу" 
    on public.game_progress for select 
    using (true);

create policy "Сохранение своего прогресса" 
    on public.game_progress for insert 
    with check (true);

create policy "Обновление своего прогресса" 
    on public.game_progress for update 
    using (true);

create policy "Публичный доступ к cards" 
    on public.cards for select 
    using (true);

create policy "Доступ к своим купленным картам" 
    on public.purchased_cards for select 
    using (true);

create policy "Покупка новых карт" 
    on public.purchased_cards for insert 
    with check (true);
