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
