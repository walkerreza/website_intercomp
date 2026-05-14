create table users (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  xp integer default 0,
  hp integer default 100,
  created_at timestamp default now()
);
