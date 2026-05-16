alter table public.workspaces
  add column if not exists type text not null default 'solo',
  add column if not exists join_code text,
  add column if not exists join_code_enabled boolean not null default false;

alter table public.workspaces drop constraint if exists workspaces_type_check;
alter table public.workspaces
  add constraint workspaces_type_check check (type in ('solo', 'clan'));

create unique index if not exists workspaces_join_code_unique_idx
on public.workspaces(upper(join_code))
where join_code is not null;

create unique index if not exists workspaces_owner_solo_unique_idx
on public.workspaces(owner_id)
where type = 'solo';

update public.workspaces
set type = 'solo'
where type is null;

create or replace function public.generate_workspace_join_code()
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
      select 1
      from public.workspaces w
      where upper(w.join_code) = generated_code
    );
  end loop;

  return generated_code;
end;
$$;

create or replace function public.ensure_workspace_columns(target_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.board_columns (workspace_id, name, type, position)
  values
    (target_workspace_id, 'HARD', 'todo', 0),
    (target_workspace_id, 'MEDIUM', 'todo', 1),
    (target_workspace_id, 'EASY', 'todo', 2),
    (target_workspace_id, 'COMPLETED', 'done', 3)
  on conflict (workspace_id, position) do nothing;
end;
$$;

create or replace function public.create_default_workspace_for_user(
  target_user_id uuid,
  target_name text default 'Questify Solo Board'
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
    and w.type = 'solo'
  order by w.created_at
  limit 1;

  if created_workspace_id is not null then
    perform public.ensure_workspace_columns(created_workspace_id);
    return created_workspace_id;
  end if;

  insert into public.workspaces (name, owner_id, type, join_code_enabled)
  values (coalesce(nullif(target_name, ''), 'Questify Solo Board'), target_user_id, 'solo', false)
  returning id into created_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (created_workspace_id, target_user_id, 'owner', 'active')
  on conflict (workspace_id, user_id) do update set
    role = 'owner',
    status = 'active';

  perform public.ensure_workspace_columns(created_workspace_id);

  return created_workspace_id;
end;
$$;

do $$
declare
  workspace_record record;
begin
  for workspace_record in
    select w.id
    from public.workspaces w
  loop
    perform public.ensure_workspace_columns(workspace_record.id);
  end loop;
end;
$$;

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
    w.created_at
  from public.workspace_members wm
  join public.workspaces w on w.id = wm.workspace_id
  where wm.user_id = auth.uid()
  order by
    case w.type when 'solo' then 0 else 1 end,
    w.created_at;
$$;

create or replace function public.create_clan_workspace(target_name text)
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

  cleaned_name := coalesce(nullif(trim(target_name), ''), 'Questify Clan');

  insert into public.workspaces (name, owner_id, type, join_code, join_code_enabled)
  values (cleaned_name, auth.uid(), 'clan', public.generate_workspace_join_code(), true)
  returning id into created_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (created_workspace_id, auth.uid(), 'owner', 'active');

  perform public.ensure_workspace_columns(created_workspace_id);

  return created_workspace_id;
end;
$$;

create or replace function public.regenerate_workspace_join_code(target_workspace_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_code text;
begin
  if not public.is_workspace_owner(target_workspace_id) then
    raise exception 'Only workspace owner can regenerate join code';
  end if;

  if not exists (
    select 1
    from public.workspaces w
    where w.id = target_workspace_id
      and w.type = 'clan'
  ) then
    raise exception 'Only clan workspace has join code';
  end if;

  next_code := public.generate_workspace_join_code();

  update public.workspaces
  set join_code = next_code,
      join_code_enabled = true
  where id = target_workspace_id;

  return next_code;
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

  select w.id, w.owner_id
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
    raise exception 'Owner is already in this clan';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (target_workspace.id, auth.uid(), 'member', 'pending')
  on conflict (workspace_id, user_id) do update set
    role = case when public.workspace_members.role = 'owner' then 'owner' else 'member' end,
    status = case when public.workspace_members.status = 'active' then 'active' else 'pending' end;

  return target_workspace.id;
end;
$$;

create or replace function public.approve_workspace_member(target_workspace_id uuid, target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_workspace_owner(target_workspace_id) then
    raise exception 'Only workspace owner can approve members';
  end if;

  update public.workspace_members
  set status = 'active',
      role = case when role = 'owner' then 'owner' else 'member' end
  where workspace_id = target_workspace_id
    and user_id = target_user_id
    and role <> 'owner';

  if not found then
    raise exception 'Pending member not found';
  end if;
end;
$$;

create or replace function public.reject_workspace_member(target_workspace_id uuid, target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_workspace_owner(target_workspace_id) then
    raise exception 'Only workspace owner can reject members';
  end if;

  delete from public.workspace_members
  where workspace_id = target_workspace_id
    and user_id = target_user_id
    and role <> 'owner'
    and status = 'pending';
end;
$$;

create or replace function public.leave_workspace(target_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.workspaces w
    where w.id = target_workspace_id
      and (w.type = 'solo' or w.owner_id = auth.uid())
  ) then
    raise exception 'Owner or solo workspace cannot be left';
  end if;

  delete from public.workspace_members
  where workspace_id = target_workspace_id
    and user_id = auth.uid()
    and role <> 'owner';
end;
$$;

grant execute on function public.list_my_workspaces() to authenticated;
grant execute on function public.create_clan_workspace(text) to authenticated;
grant execute on function public.regenerate_workspace_join_code(uuid) to authenticated;
grant execute on function public.request_join_workspace_by_code(text) to authenticated;
grant execute on function public.approve_workspace_member(uuid, uuid) to authenticated;
grant execute on function public.reject_workspace_member(uuid, uuid) to authenticated;
grant execute on function public.leave_workspace(uuid) to authenticated;

