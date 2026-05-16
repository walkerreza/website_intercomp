create or replace function public.delete_workspace(target_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_workspace record;
begin
  if auth.uid() is null then
    raise exception 'Login required';
  end if;

  select w.id, w.owner_id, w.type, w.clan_id
    into target_workspace
  from public.workspaces w
  where w.id = target_workspace_id;

  if target_workspace.id is null then
    raise exception 'Workspace not found';
  end if;

  if target_workspace.owner_id <> auth.uid() then
    raise exception 'Only workspace owner can delete workspace';
  end if;

  delete from public.workspaces
  where id = target_workspace_id;
end;
$$;

grant execute on function public.delete_workspace(uuid) to authenticated;

notify pgrst, 'reload schema';
