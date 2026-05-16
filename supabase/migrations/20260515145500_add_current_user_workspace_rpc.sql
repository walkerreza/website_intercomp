create or replace function public.ensure_default_workspace_for_current_user(
  target_name text default 'Questify Study Guild'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  return public.create_default_workspace_for_user(auth.uid(), target_name);
end;
$$;

grant execute on function public.ensure_default_workspace_for_current_user(text) to authenticated;

