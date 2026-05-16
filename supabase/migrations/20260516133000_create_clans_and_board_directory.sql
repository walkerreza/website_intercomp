create table if not exists public.clans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.users(id) on delete cascade,
  join_code text,
  join_code_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clan_members (
  id uuid primary key default gen_random_uuid(),
  clan_id uuid not null references public.clans(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  status text not null default 'pending' check (status in ('active', 'pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clan_id, user_id)
);

alter table public.workspaces
  add column if not exists clan_id uuid references public.clans(id) on delete set null;

drop index if exists public.workspaces_owner_solo_unique_idx;

create unique index if not exists clans_join_code_unique_idx
on public.clans(upper(join_code))
where join_code is not null;

create index if not exists clans_owner_id_idx on public.clans(owner_id);
create index if not exists clan_members_user_id_idx on public.clan_members(user_id);
create index if not exists clan_members_clan_id_idx on public.clan_members(clan_id);
create index if not exists workspaces_clan_id_idx on public.workspaces(clan_id);

drop trigger if exists set_clans_updated_at on public.clans;
create trigger set_clans_updated_at
before update on public.clans
for each row execute function public.set_updated_at();

drop trigger if exists set_clan_members_updated_at on public.clan_members;
create trigger set_clan_members_updated_at
before update on public.clan_members
for each row execute function public.set_updated_at();

create or replace function public.is_clan_member(target_clan_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.clan_members cm
    where cm.clan_id = target_clan_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
  );
$$;

create or replace function public.is_clan_owner(target_clan_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.clan_members cm
    where cm.clan_id = target_clan_id
      and cm.user_id = auth.uid()
      and cm.role = 'owner'
      and cm.status = 'active'
  );
$$;

create or replace function public.generate_clan_join_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_code text;
begin
  loop
    generated_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
    exit when not exists (
      select 1 from public.clans c where upper(c.join_code) = generated_code
    );
  end loop;

  return generated_code;
end;
$$;

create or replace function public.sync_clan_workspace_members(target_clan_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role, status)
  select
    w.id,
    cm.user_id,
    case when cm.role = 'owner' then 'owner' else 'member' end,
    'active'
  from public.workspaces w
  join public.clan_members cm on cm.clan_id = w.clan_id
  where w.clan_id = target_clan_id
    and cm.status = 'active'
  on conflict (workspace_id, user_id) do update set
    role = excluded.role,
    status = 'active';
end;
$$;

do $$
declare
  workspace_record record;
  created_clan_id uuid;
begin
  for workspace_record in
    select w.*
    from public.workspaces w
    where w.clan_id is null
      and w.type = 'clan'
  loop
    insert into public.clans (name, owner_id, join_code, join_code_enabled, created_at, updated_at)
    values (
      workspace_record.name,
      workspace_record.owner_id,
      coalesce(workspace_record.join_code, public.generate_clan_join_code()),
      coalesce(workspace_record.join_code_enabled, true),
      workspace_record.created_at,
      workspace_record.updated_at
    )
    returning id into created_clan_id;

    insert into public.clan_members (clan_id, user_id, role, status, created_at, updated_at)
    select created_clan_id, wm.user_id, wm.role, wm.status, wm.created_at, wm.updated_at
    from public.workspace_members wm
    where wm.workspace_id = workspace_record.id
    on conflict (clan_id, user_id) do nothing;

    update public.workspaces
    set clan_id = created_clan_id
    where id = workspace_record.id;
  end loop;
end;
$$;

create or replace function public.create_clan(target_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_clan_id uuid;
  cleaned_name text;
begin
  if auth.uid() is null then
    raise exception 'Login required';
  end if;

  cleaned_name := coalesce(nullif(trim(target_name), ''), 'Questify Clan');

  insert into public.clans (name, owner_id, join_code, join_code_enabled)
  values (cleaned_name, auth.uid(), public.generate_clan_join_code(), true)
  returning id into created_clan_id;

  insert into public.clan_members (clan_id, user_id, role, status)
  values (created_clan_id, auth.uid(), 'owner', 'active');

  return created_clan_id;
end;
$$;

create or replace function public.create_personal_workspace(target_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_workspace_id uuid;
  cleaned_name text;
begin
  if auth.uid() is null then
    raise exception 'Login required';
  end if;

  cleaned_name := coalesce(nullif(trim(target_name), ''), 'Questify Board');

  insert into public.workspaces (name, owner_id, type, clan_id, join_code_enabled)
  values (cleaned_name, auth.uid(), 'solo', null, false)
  returning id into created_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (created_workspace_id, auth.uid(), 'owner', 'active');

  perform public.ensure_workspace_columns(created_workspace_id);

  return created_workspace_id;
end;
$$;

create or replace function public.create_clan_workspace(target_clan_id uuid, target_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_workspace_id uuid;
  clan_record record;
  cleaned_name text;
begin
  if not public.is_clan_owner(target_clan_id) then
    raise exception 'Only clan owner can create clan workspace';
  end if;

  select * into clan_record from public.clans where id = target_clan_id;
  cleaned_name := coalesce(nullif(trim(target_name), ''), clan_record.name || ' Board');

  insert into public.workspaces (name, owner_id, type, clan_id, join_code_enabled)
  values (cleaned_name, clan_record.owner_id, 'clan', target_clan_id, false)
  returning id into created_workspace_id;

  perform public.ensure_workspace_columns(created_workspace_id);
  perform public.sync_clan_workspace_members(target_clan_id);

  return created_workspace_id;
end;
$$;

create or replace function public.request_join_clan_by_code(raw_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_clan record;
  cleaned_code text;
begin
  if auth.uid() is null then
    raise exception 'Login required';
  end if;

  cleaned_code := upper(trim(coalesce(raw_code, '')));
  if cleaned_code = '' then
    raise exception 'Join code is required';
  end if;

  select c.*
    into target_clan
  from public.clans c
  where c.join_code_enabled = true
    and upper(c.join_code) = cleaned_code
  limit 1;

  if target_clan.id is null then
    raise exception 'Clan code not found';
  end if;

  if target_clan.owner_id = auth.uid() then
    raise exception 'Owner is already in this clan';
  end if;

  insert into public.clan_members (clan_id, user_id, role, status)
  values (target_clan.id, auth.uid(), 'member', 'pending')
  on conflict (clan_id, user_id) do update set
    role = case when public.clan_members.role = 'owner' then 'owner' else 'member' end,
    status = case when public.clan_members.status = 'active' then 'active' else 'pending' end;

  return target_clan.id;
end;
$$;

create or replace function public.approve_clan_member(target_clan_id uuid, target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_clan_owner(target_clan_id) then
    raise exception 'Only clan owner can approve members';
  end if;

  update public.clan_members
  set status = 'active',
      role = case when role = 'owner' then 'owner' else 'member' end
  where clan_id = target_clan_id
    and user_id = target_user_id
    and role <> 'owner';

  if not found then
    raise exception 'Pending member not found';
  end if;

  perform public.sync_clan_workspace_members(target_clan_id);
end;
$$;

create or replace function public.reject_clan_member(target_clan_id uuid, target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_clan_owner(target_clan_id) then
    raise exception 'Only clan owner can reject members';
  end if;

  delete from public.clan_members
  where clan_id = target_clan_id
    and user_id = target_user_id
    and role <> 'owner'
    and status = 'pending';
end;
$$;

create or replace function public.regenerate_clan_join_code(target_clan_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_code text;
begin
  if not public.is_clan_owner(target_clan_id) then
    raise exception 'Only clan owner can regenerate join code';
  end if;

  next_code := public.generate_clan_join_code();

  update public.clans
  set join_code = next_code,
      join_code_enabled = true
  where id = target_clan_id;

  return next_code;
end;
$$;

create or replace function public.list_my_boards_and_clans()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'boards',
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', w.id,
          'name', w.name,
          'ownerId', w.owner_id,
          'clanId', w.clan_id,
          'clanName', c.name,
          'type', case when w.clan_id is null then 'personal' else 'clan' end,
          'role', wm.role,
          'status', wm.status,
          'createdAt', w.created_at,
          'memberCount', (
            select count(*) from public.workspace_members active_members
            where active_members.workspace_id = w.id and active_members.status = 'active'
          ),
          'questCount', (
            select count(*) from public.quests q
            where q.workspace_id = w.id and q.archived_at is null
          )
        )
        order by case when w.clan_id is null then 0 else 1 end, w.created_at
      )
      from public.workspace_members wm
      join public.workspaces w on w.id = wm.workspace_id
      left join public.clans c on c.id = w.clan_id
      where wm.user_id = auth.uid()
        and wm.status = 'active'
    ), '[]'::jsonb),
    'clans',
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'ownerId', c.owner_id,
          'role', cm.role,
          'status', cm.status,
          'joinCode', case when cm.role = 'owner' then c.join_code else null end,
          'joinCodeEnabled', c.join_code_enabled,
          'memberCount', (
            select count(*) from public.clan_members active_members
            where active_members.clan_id = c.id and active_members.status = 'active'
          ),
          'pendingCount', (
            select count(*) from public.clan_members pending_members
            where pending_members.clan_id = c.id and pending_members.status = 'pending'
          ),
          'boardCount', (
            select count(*) from public.workspaces w where w.clan_id = c.id
          ),
          'createdAt', c.created_at
        )
        order by c.created_at
      )
      from public.clan_members cm
      join public.clans c on c.id = cm.clan_id
      where cm.user_id = auth.uid()
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

create or replace function public.get_clan_detail(target_clan_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  result jsonb;
  viewer_role text;
begin
  select cm.role
    into viewer_role
  from public.clan_members cm
  where cm.clan_id = target_clan_id
    and cm.user_id = auth.uid()
    and cm.status = 'active';

  if viewer_role is null then
    raise exception 'Clan not found or not accessible';
  end if;

  select jsonb_build_object(
    'id', c.id,
    'name', c.name,
    'ownerId', c.owner_id,
    'viewerRole', viewer_role,
    'joinCode', case when viewer_role = 'owner' then c.join_code else null end,
    'joinCodeEnabled', c.join_code_enabled,
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', cm.user_id,
        'name', coalesce(u.username, split_part(u.email, '@', 1), 'Adventurer'),
        'email', u.email,
        'role', cm.role,
        'status', cm.status,
        'characterId', u.character_id
      ) order by cm.role desc, cm.created_at)
      from public.clan_members cm
      left join public.users u on u.id = cm.user_id
      where cm.clan_id = c.id
    ), '[]'::jsonb),
    'boards', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', w.id,
        'name', w.name,
        'questCount', (
          select count(*) from public.quests q where q.workspace_id = w.id and q.archived_at is null
        ),
        'createdAt', w.created_at
      ) order by w.created_at)
      from public.workspaces w
      where w.clan_id = c.id
    ), '[]'::jsonb)
  ) into result
  from public.clans c
  where c.id = target_clan_id;

  return result;
end;
$$;

alter table public.clans enable row level security;
alter table public.clan_members enable row level security;

drop policy if exists "Members can read their clans" on public.clans;
create policy "Members can read their clans"
on public.clans
for select
using (public.is_clan_member(id));

drop policy if exists "Owners can update their clans" on public.clans;
create policy "Owners can update their clans"
on public.clans
for update
using (public.is_clan_owner(id))
with check (public.is_clan_owner(id));

drop policy if exists "Members can read clan members" on public.clan_members;
create policy "Members can read clan members"
on public.clan_members
for select
using (public.is_clan_member(clan_id));

drop policy if exists "Owners can manage clan members" on public.clan_members;
create policy "Owners can manage clan members"
on public.clan_members
for all
using (public.is_clan_owner(clan_id))
with check (public.is_clan_owner(clan_id));

grant execute on function public.create_clan(text) to authenticated;
grant execute on function public.create_personal_workspace(text) to authenticated;
grant execute on function public.create_clan_workspace(uuid, text) to authenticated;
grant execute on function public.request_join_clan_by_code(text) to authenticated;
grant execute on function public.approve_clan_member(uuid, uuid) to authenticated;
grant execute on function public.reject_clan_member(uuid, uuid) to authenticated;
grant execute on function public.regenerate_clan_join_code(uuid) to authenticated;
grant execute on function public.list_my_boards_and_clans() to authenticated;
grant execute on function public.get_clan_detail(uuid) to authenticated;
