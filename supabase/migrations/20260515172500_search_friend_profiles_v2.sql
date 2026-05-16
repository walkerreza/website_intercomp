create or replace function public.search_friend_profiles_v2(query_text text)
returns table (
  user_id uuid,
  username text,
  email text,
  is_friend boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  cleaned_query text;
  query_uuid uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  cleaned_query := btrim(query_text);

  if cleaned_query = '' then
    return;
  end if;

  if cleaned_query ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    query_uuid := cleaned_query::uuid;
  end if;

  return query
  select
    u.id,
    u.username,
    u.email,
    exists (
      select 1
      from public.user_friends uf
      where uf.status = 'accepted'
        and (
          (uf.requester_id = auth.uid() and uf.addressee_id = u.id)
          or (uf.requester_id = u.id and uf.addressee_id = auth.uid())
        )
    ) as is_friend
  from public.users u
  where u.id <> auth.uid()
    and (
      (query_uuid is not null and u.id = query_uuid)
      or lower(u.username) like lower(cleaned_query) || '%'
    )
  order by
    case when query_uuid is not null and u.id = query_uuid then 0 else 1 end,
    u.username
  limit 8;
end;
$$;

grant execute on function public.search_friend_profiles_v2(text) to authenticated;

select pg_notify('pgrst', 'reload schema');

