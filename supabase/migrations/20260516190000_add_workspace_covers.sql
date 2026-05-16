alter table public.workspaces
  add column if not exists cover_key text not null default 'study-desk',
  add column if not exists cover_type text not null default 'preset',
  add column if not exists cover_url text;

alter table public.workspaces drop constraint if exists workspaces_cover_type_check;
alter table public.workspaces
  add constraint workspaces_cover_type_check check (cover_type in ('preset', 'custom'));

alter table public.workspaces drop constraint if exists workspaces_cover_key_check;
alter table public.workspaces
  add constraint workspaces_cover_key_check check (
    cover_key in ('study-desk', 'tower-room', 'forest-camp', 'guild-hall', 'war-table', 'castle-room')
  );

update public.workspaces
set cover_key = case
  when clan_id is not null then 'guild-hall'
  when type = 'clan' then 'guild-hall'
  else 'study-desk'
end
where cover_key is null
   or cover_key = ''
   or cover_key not in ('study-desk', 'tower-room', 'forest-camp', 'guild-hall', 'war-table', 'castle-room');

create or replace function public.normalize_workspace_cover(target_type text, target_cover_key text)
returns text
language sql
stable
as $$
  select case
    when target_type = 'clan' and target_cover_key in ('guild-hall', 'war-table', 'castle-room') then target_cover_key
    when target_type = 'solo' and target_cover_key in ('study-desk', 'tower-room', 'forest-camp') then target_cover_key
    when target_type = 'clan' then 'guild-hall'
    else 'study-desk'
  end;
$$;

drop function if exists public.list_my_workspaces();

create or replace function public.list_my_workspaces()
returns table (
  id uuid,
  name text,
  type text,
  owner_id uuid,
  role text,
  status text,
  join_code text,
  join_code_enabled boolean,
  member_count bigint,
  pending_count bigint,
  cover_key text,
  cover_type text,
  cover_url text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    w.id,
    w.name,
    w.type,
    w.owner_id,
    wm.role,
    wm.status,
    case when wm.role = 'owner' then w.join_code else null end as join_code,
    w.join_code_enabled,
    (
      select count(*)
      from public.workspace_members active_members
      where active_members.workspace_id = w.id
        and active_members.status = 'active'
    ) as member_count,
    (
      select count(*)
      from public.workspace_members pending_members
      where pending_members.workspace_id = w.id
        and pending_members.status = 'pending'
    ) as pending_count,
    w.cover_key,
    w.cover_type,
    w.cover_url,
    w.created_at
  from public.workspace_members wm
  join public.workspaces w on w.id = wm.workspace_id
  where wm.user_id = auth.uid()
  order by
    case w.type when 'solo' then 0 else 1 end,
    w.created_at;
$$;

drop function if exists public.create_personal_workspace(text);

create or replace function public.create_personal_workspace(target_name text, target_cover_key text default 'study-desk')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_workspace_id uuid;
  cleaned_name text;
  cleaned_cover_key text;
begin
  if auth.uid() is null then
    raise exception 'Login required';
  end if;

  cleaned_name := coalesce(nullif(trim(target_name), ''), 'Questify Board');
  cleaned_cover_key := public.normalize_workspace_cover('solo', target_cover_key);

  insert into public.workspaces (name, owner_id, type, clan_id, join_code_enabled, cover_key, cover_type)
  values (cleaned_name, auth.uid(), 'solo', null, false, cleaned_cover_key, 'preset')
  returning id into created_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (created_workspace_id, auth.uid(), 'owner', 'active');

  perform public.ensure_workspace_columns(created_workspace_id);

  return created_workspace_id;
end;
$$;

drop function if exists public.create_clan_workspace(uuid, text);

create or replace function public.create_clan_workspace(target_clan_id uuid, target_name text, target_cover_key text default 'guild-hall')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_workspace_id uuid;
  clan_record record;
  cleaned_name text;
  cleaned_cover_key text;
begin
  if not public.is_clan_owner(target_clan_id) then
    raise exception 'Only clan owner can create clan workspace';
  end if;

  select * into clan_record from public.clans where id = target_clan_id;
  cleaned_name := coalesce(nullif(trim(target_name), ''), clan_record.name || ' Board');
  cleaned_cover_key := public.normalize_workspace_cover('clan', target_cover_key);

  insert into public.workspaces (name, owner_id, type, clan_id, join_code, join_code_enabled, cover_key, cover_type)
  values (
    cleaned_name,
    clan_record.owner_id,
    'clan',
    target_clan_id,
    public.generate_workspace_join_code(),
    true,
    cleaned_cover_key,
    'preset'
  )
  returning id into created_workspace_id;

  perform public.ensure_workspace_columns(created_workspace_id);
  perform public.sync_clan_workspace_members(target_clan_id);

  return created_workspace_id;
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
          'coverKey', w.cover_key,
          'coverType', w.cover_type,
          'coverUrl', w.cover_url,
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
        'joinCode', case when viewer_role = 'owner' then w.join_code else null end,
        'joinCodeEnabled', w.join_code_enabled,
        'coverKey', w.cover_key,
        'coverType', w.cover_type,
        'coverUrl', w.cover_url,
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

grant execute on function public.list_my_workspaces() to authenticated;
grant execute on function public.create_personal_workspace(text, text) to authenticated;
grant execute on function public.create_clan_workspace(uuid, text, text) to authenticated;
grant execute on function public.list_my_boards_and_clans() to authenticated;
grant execute on function public.get_clan_detail(uuid) to authenticated;

notify pgrst, 'reload schema';
