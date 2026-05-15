create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  status text not null default 'pending' check (status in ('active', 'pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.board_columns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  type text not null default 'todo' check (type in ('todo', 'progress', 'done')),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, position)
);

create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  column_id uuid not null references public.board_columns(id) on delete restrict,
  creator_id uuid not null references public.users(id) on delete restrict,
  title text not null,
  description text not null default '',
  difficulty text not null default 'medium' check (difficulty in ('low', 'medium', 'hard')),
  effort_points integer not null default 1 check (effort_points between 1 and 24),
  timer_mode text not null default 'pomodoro' check (timer_mode in ('sprint', 'pomodoro', 'deep_work')),
  due_at timestamptz,
  position integer not null default 0 check (position >= 0),
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quest_assignees (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (quest_id, user_id)
);

create table if not exists public.quest_checklists (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quest_comments (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.quest_rewards (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  xp_amount integer not null check (xp_amount >= 0),
  gold_amount integer not null check (gold_amount >= 0),
  claimed_at timestamptz not null default now(),
  unique (quest_id, user_id)
);

create index if not exists workspaces_owner_id_idx on public.workspaces(owner_id);
create index if not exists workspace_members_user_id_idx on public.workspace_members(user_id);
create index if not exists workspace_members_workspace_id_idx on public.workspace_members(workspace_id);
create index if not exists board_columns_workspace_id_position_idx on public.board_columns(workspace_id, position);
create index if not exists quests_workspace_id_idx on public.quests(workspace_id);
create index if not exists quests_column_id_position_idx on public.quests(column_id, position);
create index if not exists quests_creator_id_idx on public.quests(creator_id);
create index if not exists quest_assignees_user_id_idx on public.quest_assignees(user_id);
create index if not exists quest_checklists_quest_id_position_idx on public.quest_checklists(quest_id, position);
create index if not exists quest_comments_quest_id_created_at_idx on public.quest_comments(quest_id, created_at);
create index if not exists quest_rewards_user_id_idx on public.quest_rewards(user_id);

drop trigger if exists set_workspaces_updated_at on public.workspaces;
create trigger set_workspaces_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

drop trigger if exists set_workspace_members_updated_at on public.workspace_members;
create trigger set_workspace_members_updated_at
before update on public.workspace_members
for each row execute function public.set_updated_at();

drop trigger if exists set_board_columns_updated_at on public.board_columns;
create trigger set_board_columns_updated_at
before update on public.board_columns
for each row execute function public.set_updated_at();

drop trigger if exists set_quests_updated_at on public.quests;
create trigger set_quests_updated_at
before update on public.quests
for each row execute function public.set_updated_at();

drop trigger if exists set_quest_checklists_updated_at on public.quest_checklists;
create trigger set_quest_checklists_updated_at
before update on public.quest_checklists
for each row execute function public.set_updated_at();

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.status = 'active'
  );
$$;

create or replace function public.is_workspace_owner(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.role = 'owner'
      and wm.status = 'active'
  );
$$;

create or replace function public.quest_workspace_id(target_quest_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select q.workspace_id
  from public.quests q
  where q.id = target_quest_id;
$$;

create or replace function public.create_default_workspace_for_user(
  target_user_id uuid,
  target_name text default 'Questify Study Guild'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_workspace_id uuid;
begin
  select w.id
    into created_workspace_id
  from public.workspaces w
  where w.owner_id = target_user_id
  order by w.created_at
  limit 1;

  if created_workspace_id is not null then
    return created_workspace_id;
  end if;

  insert into public.workspaces (name, owner_id)
  values (coalesce(nullif(target_name, ''), 'Questify Study Guild'), target_user_id)
  returning id into created_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (created_workspace_id, target_user_id, 'owner', 'active')
  on conflict (workspace_id, user_id) do update set
    role = 'owner',
    status = 'active';

  insert into public.board_columns (workspace_id, name, type, position)
  values
    (created_workspace_id, 'Available', 'todo', 0),
    (created_workspace_id, 'In Progress', 'progress', 1),
    (created_workspace_id, 'Completed', 'done', 2)
  on conflict (workspace_id, position) do nothing;

  return created_workspace_id;
end;
$$;

create or replace function public.validate_quest_workspace()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.board_columns bc
    where bc.id = new.column_id
      and bc.workspace_id = new.workspace_id
  ) then
    raise exception 'Quest column must belong to the same workspace';
  end if;

  if not exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = new.workspace_id
      and wm.user_id = new.creator_id
      and wm.status = 'active'
  ) then
    raise exception 'Quest creator must be an active workspace member';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_quest_workspace on public.quests;
create trigger validate_quest_workspace
before insert or update of workspace_id, column_id, creator_id on public.quests
for each row execute function public.validate_quest_workspace();

create or replace function public.validate_quest_assignee()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.quests q
    join public.workspace_members wm on wm.workspace_id = q.workspace_id
    where q.id = new.quest_id
      and wm.user_id = new.user_id
      and wm.status = 'active'
  ) then
    raise exception 'Quest assignee must be an active workspace member';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_quest_assignee on public.quest_assignees;
create trigger validate_quest_assignee
before insert or update of quest_id, user_id on public.quest_assignees
for each row execute function public.validate_quest_assignee();

create or replace function public.claim_quest_reward(target_quest_id uuid)
returns table (
  rewarded_user_id uuid,
  xp_amount integer,
  gold_amount integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_quest record;
  reward_xp integer;
  reward_gold integer;
begin
  select
    q.id,
    q.workspace_id,
    q.difficulty,
    q.effort_points,
    bc.type as column_type
    into target_quest
  from public.quests q
  join public.board_columns bc on bc.id = q.column_id
  where q.id = target_quest_id;

  if target_quest.id is null then
    raise exception 'Quest not found';
  end if;

  if not exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_quest.workspace_id
      and wm.user_id = auth.uid()
      and wm.status = 'active'
  ) then
    raise exception 'Not allowed to claim this quest';
  end if;

  if target_quest.column_type <> 'done' then
    raise exception 'Quest must be in a done column before claiming reward';
  end if;

  if not exists (
    select 1
    from public.quest_assignees qa
    where qa.quest_id = target_quest.id
  ) then
    raise exception 'Quest must have at least one assignee before claiming reward';
  end if;

  reward_xp :=
    case target_quest.difficulty
      when 'low' then 20
      when 'hard' then 100
      else 50
    end + (target_quest.effort_points * 5);
  reward_gold := greatest(10, round(reward_xp * 0.28)::integer);

  create temporary table if not exists pg_temp.new_quest_rewards (
    user_id uuid primary key,
    xp_amount integer not null,
    gold_amount integer not null
  ) on commit drop;

  truncate table pg_temp.new_quest_rewards;

  with inserted_rewards as (
    insert into public.quest_rewards (quest_id, user_id, xp_amount, gold_amount)
    select target_quest.id, qa.user_id, reward_xp, reward_gold
    from public.quest_assignees qa
    where qa.quest_id = target_quest.id
    on conflict (quest_id, user_id) do nothing
    returning user_id, xp_amount, gold_amount
  )
  insert into pg_temp.new_quest_rewards (user_id, xp_amount, gold_amount)
  select user_id, xp_amount, gold_amount
  from inserted_rewards;

  update public.users u
  set
    xp = u.xp + nr.xp_amount,
    gold = u.gold + nr.gold_amount
  from pg_temp.new_quest_rewards nr
  where nr.user_id = u.id;

  update public.quests q
  set claimed_at = coalesce(q.claimed_at, now())
  where q.id = target_quest.id
    and exists (
      select 1
      from public.quest_rewards qr
      where qr.quest_id = q.id
    )
    and not exists (
      select 1
      from public.quest_assignees qa
      where qa.quest_id = q.id
        and not exists (
          select 1
          from public.quest_rewards qr
          where qr.quest_id = q.id
            and qr.user_id = qa.user_id
        )
    );

  return query
  select nr.user_id, nr.xp_amount, nr.gold_amount
  from pg_temp.new_quest_rewards nr
  order by nr.user_id;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_name text;
begin
  profile_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'name', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    split_part(new.email, '@', 1)
  );

  insert into public.users (id, email, username)
  values (new.id, new.email, profile_name)
  on conflict (id) do update set
    email = excluded.email,
    username = coalesce(public.users.username, excluded.username);

  perform public.create_default_workspace_for_user(
    new.id,
    coalesce(profile_name, 'Questify') || '''s Guild'
  );

  return new;
end;
$$;

do $$
declare
  existing_user record;
begin
  for existing_user in
    select u.id, coalesce(nullif(u.username, ''), split_part(u.email, '@', 1), 'Questify') as username
    from public.users u
    where not exists (
      select 1
      from public.workspaces w
      where w.owner_id = u.id
    )
  loop
    perform public.create_default_workspace_for_user(
      existing_user.id,
      existing_user.username || '''s Guild'
    );
  end loop;
end;
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.board_columns enable row level security;
alter table public.quests enable row level security;
alter table public.quest_assignees enable row level security;
alter table public.quest_checklists enable row level security;
alter table public.quest_comments enable row level security;
alter table public.quest_rewards enable row level security;

drop policy if exists "Members can read their workspaces" on public.workspaces;
create policy "Members can read their workspaces"
on public.workspaces
for select
using (public.is_workspace_member(id));

drop policy if exists "Owners can update their workspaces" on public.workspaces;
create policy "Owners can update their workspaces"
on public.workspaces
for update
using (public.is_workspace_owner(id))
with check (public.is_workspace_owner(id));

drop policy if exists "Users can create owned workspaces" on public.workspaces;
create policy "Users can create owned workspaces"
on public.workspaces
for insert
with check (auth.uid() = owner_id);

drop policy if exists "Members can read workspace members" on public.workspace_members;
create policy "Members can read workspace members"
on public.workspace_members
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Owners can manage workspace members" on public.workspace_members;
create policy "Owners can manage workspace members"
on public.workspace_members
for all
using (public.is_workspace_owner(workspace_id))
with check (public.is_workspace_owner(workspace_id));

drop policy if exists "Users can accept their own membership" on public.workspace_members;
create policy "Users can accept their own membership"
on public.workspace_members
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Members can read board columns" on public.board_columns;
create policy "Members can read board columns"
on public.board_columns
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Owners can manage board columns" on public.board_columns;
create policy "Owners can manage board columns"
on public.board_columns
for all
using (public.is_workspace_owner(workspace_id))
with check (public.is_workspace_owner(workspace_id));

drop policy if exists "Members can read quests" on public.quests;
create policy "Members can read quests"
on public.quests
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can create quests" on public.quests;
create policy "Members can create quests"
on public.quests
for insert
with check (
  public.is_workspace_member(workspace_id)
  and auth.uid() = creator_id
);

drop policy if exists "Members can update quests" on public.quests;
create policy "Members can update quests"
on public.quests
for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can delete quests" on public.quests;
create policy "Members can delete quests"
on public.quests
for delete
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can read quest assignees" on public.quest_assignees;
create policy "Members can read quest assignees"
on public.quest_assignees
for select
using (public.is_workspace_member(public.quest_workspace_id(quest_id)));

drop policy if exists "Members can manage quest assignees" on public.quest_assignees;
create policy "Members can manage quest assignees"
on public.quest_assignees
for all
using (public.is_workspace_member(public.quest_workspace_id(quest_id)))
with check (public.is_workspace_member(public.quest_workspace_id(quest_id)));

drop policy if exists "Members can read quest checklists" on public.quest_checklists;
create policy "Members can read quest checklists"
on public.quest_checklists
for select
using (public.is_workspace_member(public.quest_workspace_id(quest_id)));

drop policy if exists "Members can manage quest checklists" on public.quest_checklists;
create policy "Members can manage quest checklists"
on public.quest_checklists
for all
using (public.is_workspace_member(public.quest_workspace_id(quest_id)))
with check (public.is_workspace_member(public.quest_workspace_id(quest_id)));

drop policy if exists "Members can read quest comments" on public.quest_comments;
create policy "Members can read quest comments"
on public.quest_comments
for select
using (public.is_workspace_member(public.quest_workspace_id(quest_id)));

drop policy if exists "Members can create quest comments" on public.quest_comments;
create policy "Members can create quest comments"
on public.quest_comments
for insert
with check (
  public.is_workspace_member(public.quest_workspace_id(quest_id))
  and auth.uid() = user_id
);

drop policy if exists "Members can read quest rewards" on public.quest_rewards;
create policy "Members can read quest rewards"
on public.quest_rewards
for select
using (public.is_workspace_member(public.quest_workspace_id(quest_id)));

revoke update on public.users from authenticated;
grant update (username, character_id, hp, owned_items, equipment) on public.users to authenticated;
grant execute on function public.claim_quest_reward(uuid) to authenticated;
revoke execute on function public.create_default_workspace_for_user(uuid, text) from public;
revoke execute on function public.create_default_workspace_for_user(uuid, text) from authenticated;
