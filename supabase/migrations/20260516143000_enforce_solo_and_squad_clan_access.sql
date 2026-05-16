-- Enforce solo vs squad workspace rules and make invite-link joins immediate.

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

  delete from public.workspace_members wm
  using public.workspaces w
  where wm.workspace_id = w.id
    and w.clan_id = target_clan_id
    and not exists (
      select 1
      from public.clan_members cm
      where cm.clan_id = target_clan_id
        and cm.user_id = wm.user_id
        and cm.status = 'active'
    );
end;
$$;

create or replace function public.guard_workspace_member_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_workspace record;
begin
  select w.id, w.owner_id, w.type, w.clan_id
    into target_workspace
  from public.workspaces w
  where w.id = new.workspace_id;

  if target_workspace.id is null then
    raise exception 'Workspace not found';
  end if;

  if target_workspace.type = 'solo'
     and new.user_id <> target_workspace.owner_id then
    raise exception 'Solo workspace cannot have additional members';
  end if;

  if target_workspace.clan_id is not null
     and new.user_id <> target_workspace.owner_id
     and not exists (
       select 1
       from public.clan_members cm
       where cm.clan_id = target_workspace.clan_id
         and cm.user_id = new.user_id
         and cm.status = 'active'
     ) then
    raise exception 'Squad workspace membership must come from active clan membership';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_workspace_member_rules on public.workspace_members;
create trigger guard_workspace_member_rules
before insert or update on public.workspace_members
for each row execute function public.guard_workspace_member_rules();

delete from public.workspace_members wm
using public.workspaces w
where wm.workspace_id = w.id
  and w.type = 'solo'
  and wm.user_id <> w.owner_id;

update public.clan_members
set status = 'active'
where status = 'pending';

delete from public.workspace_members wm
using public.workspaces w
where wm.workspace_id = w.id
  and w.clan_id is not null
  and (
    wm.status = 'pending'
    or not exists (
      select 1
      from public.clan_members cm
      where cm.clan_id = w.clan_id
        and cm.user_id = wm.user_id
        and cm.status = 'active'
    )
  );

do $$
declare
  clan_record record;
begin
  for clan_record in
    select c.id
    from public.clans c
  loop
    perform public.sync_clan_workspace_members(clan_record.id);
  end loop;
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
  if auth.uid() is null then
    raise exception 'Login required';
  end if;

  if target_clan_id is null then
    raise exception 'Clan is required for squad workspace';
  end if;

  if not public.is_clan_owner(target_clan_id) then
    raise exception 'Only clan owner can create clan workspace';
  end if;

  select * into clan_record from public.clans where id = target_clan_id;
  if clan_record.id is null then
    raise exception 'Clan not found';
  end if;

  cleaned_name := coalesce(nullif(trim(target_name), ''), clan_record.name || ' Board');

  insert into public.workspaces (name, owner_id, type, clan_id, join_code, join_code_enabled)
  values (
    cleaned_name,
    clan_record.owner_id,
    'clan',
    target_clan_id,
    public.generate_workspace_join_code(),
    true
  )
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
  values (target_clan.id, auth.uid(), 'member', 'active')
  on conflict (clan_id, user_id) do update set
    role = case when public.clan_members.role = 'owner' then 'owner' else 'member' end,
    status = 'active';

  perform public.sync_clan_workspace_members(target_clan.id);

  return target_clan.id;
end;
$$;

create or replace function public.request_join_workspace_by_code(raw_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_workspace record;
  cleaned_code text;
begin
  if auth.uid() is null then
    raise exception 'Login required';
  end if;

  cleaned_code := upper(trim(coalesce(raw_code, '')));
  if cleaned_code = '' then
    raise exception 'Join code is required';
  end if;

  select w.id, w.owner_id, w.clan_id, w.type
    into target_workspace
  from public.workspaces w
  where w.type = 'clan'
    and w.join_code_enabled = true
    and upper(w.join_code) = cleaned_code
  limit 1;

  if target_workspace.id is null then
    raise exception 'Join code not found';
  end if;

  if target_workspace.owner_id = auth.uid() then
    raise exception 'Owner is already in this squad workspace';
  end if;

  if target_workspace.clan_id is null then
    raise exception 'Squad workspace must belong to a clan';
  end if;

  insert into public.clan_members (clan_id, user_id, role, status)
  values (target_workspace.clan_id, auth.uid(), 'member', 'active')
  on conflict (clan_id, user_id) do update set
    role = case when public.clan_members.role = 'owner' then 'owner' else 'member' end,
    status = 'active';

  perform public.sync_clan_workspace_members(target_workspace.clan_id);

  return target_workspace.id;
end;
$$;
