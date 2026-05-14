create table if not exists public.characters (
  id text primary key,
  name text not null,
  accent text not null,
  description text not null,
  sprite_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  username text not null,
  character_id text references public.characters(id),
  gold integer not null default 220,
  xp integer not null default 450,
  hp integer not null default 100,
  owned_items text[] not null default '{}'::text[],
  equipment jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users add column if not exists email text;
alter table public.users add column if not exists character_id text;
alter table public.users add column if not exists gold integer not null default 220;
alter table public.users add column if not exists hp integer not null default 100;
alter table public.users add column if not exists owned_items text[] not null default '{}'::text[];
alter table public.users add column if not exists equipment jsonb not null default '{}'::jsonb;
alter table public.users add column if not exists updated_at timestamptz not null default now();

alter table public.users alter column xp set default 450;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_character_id_fkey'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_character_id_fkey
      foreign key (character_id) references public.characters(id);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_gold_non_negative'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_gold_non_negative check (gold >= 0);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_xp_non_negative'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_xp_non_negative check (xp >= 0);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_auth_id_fkey'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_auth_id_fkey
      foreign key (id) references auth.users(id) on delete cascade not valid;
  end if;
end;
$$;

create index if not exists users_character_id_idx on public.users(character_id);
create index if not exists users_email_idx on public.users(email);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_characters_updated_at on public.characters;
create trigger set_characters_updated_at
before update on public.characters
for each row execute function public.set_updated_at();

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

insert into public.characters (id, name, accent, description, sprite_path)
values
  ('healer', 'Healer', '#24CC8F', 'Menjaga ritme belajar dan memulihkan fokus.', '/assets/characters/healer.png'),
  ('assassin', 'Assassin', '#E85D75', 'Menyelesaikan tugas cepat dengan presisi tinggi.', '/assets/characters/assassin.png'),
  ('warrior', 'Warrior', '#FFBE3D', 'Kuat menghadapi deadline dan misi besar.', '/assets/characters/warrior.png'),
  ('mage', 'Mage', '#8E63D7', 'Mengubah ide rumit menjadi strategi belajar.', '/assets/characters/mage.png'),
  ('tank', 'Tank', '#2995D8', 'Stabil, tahan distraksi, dan konsisten.', '/assets/characters/tank.png'),
  ('bard', 'Bard', '#F97316', 'Menghidupkan motivasi dan kerja kelompok.', '/assets/characters/bard.png'),
  ('ranger', 'Ranger', '#22C55E', 'Fokus pada target mingguan dan progres jarak jauh.', '/assets/characters/ranger.png')
on conflict (id) do update set
  name = excluded.name,
  accent = excluded.accent,
  description = excluded.description,
  sprite_path = excluded.sprite_path;

alter table public.characters enable row level security;
alter table public.users enable row level security;

drop policy if exists "Characters are readable by everyone" on public.characters;
create policy "Characters are readable by everyone"
on public.characters
for select
using (true);

drop policy if exists "Users can read their own profile" on public.users;
create policy "Users can read their own profile"
on public.users
for select
using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.users;
create policy "Users can insert their own profile"
on public.users
for insert
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.users;
create policy "Users can update their own profile"
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, username)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do update set
    email = excluded.email,
    username = coalesce(public.users.username, excluded.username);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();
