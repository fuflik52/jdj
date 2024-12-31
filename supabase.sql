-- Создание таблицы пользователей
create table public.users (
    id uuid default uuid_generate_v4() primary key,
    username text unique not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Создание таблицы прогресса игры
create table public.game_progress (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) not null,
    balance bigint default 0,
    energy integer default 100,
    purchased_cards jsonb default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Создание таблицы купленных карточек
create table public.purchased_cards (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) not null,
    card_id integer not null,
    card_data jsonb not null,
    purchased_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, card_id)
);

-- Включение Row Level Security
alter table public.users enable row level security;
alter table public.game_progress enable row level security;
alter table public.purchased_cards enable row level security;

-- Политики безопасности для пользователей
create policy "Публичный доступ к users" on public.users
    for select
    using (true);

create policy "Пользователи могут создавать свои записи" on public.users
    for insert
    with check (true);

-- Политики безопасности для прогресса игры
create policy "Пользователи видят только свой прогресс" on public.game_progress
    for select
    using (auth.uid() = user_id);

create policy "Пользователи могут сохранять свой прогресс" on public.game_progress
    for insert
    with check (auth.uid() = user_id);

-- Политики безопасности для купленных карточек
create policy "Пользователи видят только свои карточки" on public.purchased_cards
    for select
    using (auth.uid() = user_id);

create policy "Пользователи могут сохранять свои карточки" on public.purchased_cards
    for insert
    with check (auth.uid() = user_id);
