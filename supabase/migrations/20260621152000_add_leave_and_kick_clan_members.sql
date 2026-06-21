create or replace function public.leave_clan(target_clan_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.clan_members
  where clan_id = target_clan_id
    and user_id = auth.uid()
    and status = 'active'
    and role <> 'owner';

  if not found then
    raise exception 'Owner tidak bisa keluar dari clan. Transfer owner belum tersedia.';
  end if;

  perform public.sync_clan_workspace_members(target_clan_id);
end;
$$;

create or replace function public.kick_clan_member(target_clan_id uuid, target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_clan_owner(target_clan_id) then
    raise exception 'Only clan owner can kick members';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'Owner tidak bisa kick diri sendiri.';
  end if;

  delete from public.clan_members
  where clan_id = target_clan_id
    and user_id = target_user_id
    and role <> 'owner';

  if not found then
    raise exception 'Member tidak ditemukan atau tidak bisa di-kick.';
  end if;

  perform public.sync_clan_workspace_members(target_clan_id);
end;
$$;

grant execute on function public.leave_clan(uuid) to authenticated;
grant execute on function public.kick_clan_member(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
