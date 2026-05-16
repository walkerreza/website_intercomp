create or replace function public.get_command_center_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  current_profile record;
  result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Login required';
  end if;

  select u.id, u.xp, u.gold
    into current_profile
  from public.users u
  where u.id = auth.uid();

  select jsonb_build_object(
    'profile', jsonb_build_object(
      'xp', coalesce(current_profile.xp, 0),
      'gold', coalesce(current_profile.gold, 0)
    ),
    'questStats', jsonb_build_object(
      'active', coalesce((
        select count(*)
        from public.workspace_members wm
        join public.workspaces w on w.id = wm.workspace_id
        join public.quests q on q.workspace_id = w.id
        join public.board_columns bc on bc.id = q.column_id
        where wm.user_id = auth.uid()
          and wm.status = 'active'
          and q.archived_at is null
          and q.claimed_at is null
          and bc.type <> 'done'
      ), 0),
      'completed', coalesce((
        select count(*)
        from public.workspace_members wm
        join public.workspaces w on w.id = wm.workspace_id
        join public.quests q on q.workspace_id = w.id
        where wm.user_id = auth.uid()
          and wm.status = 'active'
          and q.archived_at is null
          and q.claimed_at is not null
      ), 0),
      'overdue', coalesce((
        select count(*)
        from public.workspace_members wm
        join public.workspaces w on w.id = wm.workspace_id
        join public.quests q on q.workspace_id = w.id
        join public.board_columns bc on bc.id = q.column_id
        where wm.user_id = auth.uid()
          and wm.status = 'active'
          and q.archived_at is null
          and q.claimed_at is null
          and bc.type <> 'done'
          and q.due_at is not null
          and q.due_at < now()
      ), 0),
      'dueSoon', coalesce((
        select count(*)
        from public.workspace_members wm
        join public.workspaces w on w.id = wm.workspace_id
        join public.quests q on q.workspace_id = w.id
        join public.board_columns bc on bc.id = q.column_id
        where wm.user_id = auth.uid()
          and wm.status = 'active'
          and q.archived_at is null
          and q.claimed_at is null
          and bc.type <> 'done'
          and q.due_at is not null
          and q.due_at >= now()
          and q.due_at <= now() + interval '48 hours'
      ), 0)
    ),
    'workspaces', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', w.id,
          'name', w.name,
          'type', case when w.clan_id is null then 'solo' else 'squad' end,
          'clanId', w.clan_id,
          'clanName', c.name,
          'activeQuestCount', (
            select count(*)
            from public.quests q
            join public.board_columns bc on bc.id = q.column_id
            where q.workspace_id = w.id
              and q.archived_at is null
              and q.claimed_at is null
              and bc.type <> 'done'
          ),
          'completedQuestCount', (
            select count(*)
            from public.quests q
            where q.workspace_id = w.id
              and q.archived_at is null
              and q.claimed_at is not null
          ),
          'memberCount', (
            select count(*)
            from public.workspace_members active_members
            where active_members.workspace_id = w.id
              and active_members.status = 'active'
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
    'clans', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'role', cm.role,
          'memberCount', (
            select count(*)
            from public.clan_members active_members
            where active_members.clan_id = c.id
              and active_members.status = 'active'
          ),
          'boardCount', (
            select count(*)
            from public.workspaces w
            where w.clan_id = c.id
          )
        )
        order by c.created_at
      )
      from public.clan_members cm
      join public.clans c on c.id = cm.clan_id
      where cm.user_id = auth.uid()
        and cm.status = 'active'
    ), '[]'::jsonb),
    'priorityQuests', coalesce((
      select jsonb_agg(priority_item)
      from (
        select jsonb_build_object(
          'id', q.id,
          'title', q.title,
          'difficulty', q.difficulty,
          'dueAt', q.due_at,
          'workspaceId', w.id,
          'workspaceName', w.name,
          'workspaceType', case when w.clan_id is null then 'solo' else 'squad' end
        ) as priority_item
        from public.workspace_members wm
        join public.workspaces w on w.id = wm.workspace_id
        join public.quests q on q.workspace_id = w.id
        join public.board_columns bc on bc.id = q.column_id
        where wm.user_id = auth.uid()
          and wm.status = 'active'
          and q.archived_at is null
          and q.claimed_at is null
          and bc.type <> 'done'
        order by q.due_at nulls last, q.created_at
        limit 6
      ) priority_rows
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

grant execute on function public.get_command_center_summary() to authenticated;

notify pgrst, 'reload schema';
