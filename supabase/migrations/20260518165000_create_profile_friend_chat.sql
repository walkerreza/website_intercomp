create table if not exists public.friend_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  content text not null check (length(btrim(content)) > 0),
  created_at timestamptz not null default now(),
  constraint friend_messages_not_self check (sender_id <> receiver_id)
);

create index if not exists friend_messages_pair_created_idx
on public.friend_messages(sender_id, receiver_id, created_at desc);

create index if not exists friend_messages_receiver_created_idx
on public.friend_messages(receiver_id, created_at desc);

alter table public.friend_messages enable row level security;

drop policy if exists "Users can read their direct friend messages" on public.friend_messages;
create policy "Users can read their direct friend messages"
on public.friend_messages
for select
using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Users can create direct friend messages" on public.friend_messages;
create policy "Users can create direct friend messages"
on public.friend_messages
for insert
with check (auth.uid() = sender_id);

drop policy if exists "Users can delete their direct friend messages" on public.friend_messages;
create policy "Users can delete their direct friend messages"
on public.friend_messages
for delete
using (auth.uid() = sender_id or auth.uid() = receiver_id);

create or replace function public.are_accepted_friends(first_user_id uuid, second_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_friends uf
    where uf.requester_id = least(first_user_id, second_user_id)
      and uf.addressee_id = greatest(first_user_id, second_user_id)
      and uf.status = 'accepted'
  );
$$;

create or replace function public.remove_friend_by_user_id(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'Kamu tidak bisa menghapus diri sendiri dari friendlist';
  end if;

  delete from public.user_friends uf
  where uf.requester_id = least(auth.uid(), target_user_id)
    and uf.addressee_id = greatest(auth.uid(), target_user_id);
end;
$$;

create or replace function public.get_friend_messages(target_user_id uuid)
returns table (
  id uuid,
  sender_id uuid,
  receiver_id uuid,
  sender_name text,
  content text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.are_accepted_friends(auth.uid(), target_user_id) then
    raise exception 'Chat hanya tersedia setelah berteman.';
  end if;

  return query
  select fm.id,
         fm.sender_id,
         fm.receiver_id,
         coalesce(u.username, 'Player') as sender_name,
         fm.content,
         fm.created_at
  from public.friend_messages fm
  left join public.users u on u.id = fm.sender_id
  where (fm.sender_id = auth.uid() and fm.receiver_id = target_user_id)
     or (fm.sender_id = target_user_id and fm.receiver_id = auth.uid())
  order by fm.created_at asc
  limit 80;
end;
$$;

create or replace function public.send_friend_message(
  target_user_id uuid,
  message_content text
)
returns table (
  id uuid,
  sender_id uuid,
  receiver_id uuid,
  sender_name text,
  content text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_message public.friend_messages%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'Kamu tidak bisa chat diri sendiri.';
  end if;

  if nullif(btrim(message_content), '') is null then
    raise exception 'Pesan tidak boleh kosong.';
  end if;

  if not public.are_accepted_friends(auth.uid(), target_user_id) then
    raise exception 'Chat hanya tersedia setelah berteman.';
  end if;

  insert into public.friend_messages (sender_id, receiver_id, content)
  values (auth.uid(), target_user_id, left(btrim(message_content), 1000))
  returning * into inserted_message;

  return query
  select inserted_message.id,
         inserted_message.sender_id,
         inserted_message.receiver_id,
         coalesce(u.username, 'Player') as sender_name,
         inserted_message.content,
         inserted_message.created_at
  from public.users u
  where u.id = inserted_message.sender_id;
end;
$$;

grant select, insert, delete on public.friend_messages to authenticated;
grant execute on function public.are_accepted_friends(uuid, uuid) to authenticated;
grant execute on function public.remove_friend_by_user_id(uuid) to authenticated;
grant execute on function public.get_friend_messages(uuid) to authenticated;
grant execute on function public.send_friend_message(uuid, text) to authenticated;
