create or replace function public.add_friend_by_identifier(friend_identifier text)
returns table (
  friend_id uuid,
  friend_name text,
  friend_email text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  cleaned_identifier text;
  target_user_id uuid;
  first_user_id uuid;
  second_user_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  cleaned_identifier := btrim(friend_identifier);

  if cleaned_identifier = '' then
    raise exception 'User ID atau username tidak boleh kosong';
  end if;

  if cleaned_identifier ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    target_user_id := cleaned_identifier::uuid;
  else
    select u.id
      into target_user_id
    from public.users u
    where lower(u.username) = lower(cleaned_identifier)
    order by u.created_at
    limit 1;
  end if;

  if target_user_id is null or not exists (select 1 from public.users where id = target_user_id) then
    raise exception 'User tidak ditemukan';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'Kamu tidak bisa menambahkan diri sendiri';
  end if;

  first_user_id := least(auth.uid(), target_user_id);
  second_user_id := greatest(auth.uid(), target_user_id);

  insert into public.user_friends (requester_id, addressee_id, status)
  values (first_user_id, second_user_id, 'accepted')
  on conflict (requester_id, addressee_id) do update set
    status = 'accepted';

  return query
  select u.id, u.username, u.email, uf.status
  from public.user_friends uf
  join public.users u on u.id = target_user_id
  where uf.requester_id = first_user_id
    and uf.addressee_id = second_user_id;
end;
$$;

grant execute on function public.add_friend_by_identifier(text) to authenticated;

