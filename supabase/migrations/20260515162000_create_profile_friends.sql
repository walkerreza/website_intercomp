create table if not exists public.user_friends (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  addressee_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'accepted' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_friends_not_self check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);

create index if not exists user_friends_requester_id_idx on public.user_friends(requester_id);
create index if not exists user_friends_addressee_id_idx on public.user_friends(addressee_id);

drop trigger if exists set_user_friends_updated_at on public.user_friends;
create trigger set_user_friends_updated_at
before update on public.user_friends
for each row execute function public.set_updated_at();

alter table public.user_friends enable row level security;

drop policy if exists "Users can read their friendships" on public.user_friends;
create policy "Users can read their friendships"
on public.user_friends
for select
using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "Users can create their friendships" on public.user_friends;
create policy "Users can create their friendships"
on public.user_friends
for insert
with check (auth.uid() = requester_id);

drop policy if exists "Users can update their friendships" on public.user_friends;
create policy "Users can update their friendships"
on public.user_friends
for update
using (auth.uid() = requester_id or auth.uid() = addressee_id)
with check (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "Users can delete their friendships" on public.user_friends;
create policy "Users can delete their friendships"
on public.user_friends
for delete
using (auth.uid() = requester_id or auth.uid() = addressee_id);

create or replace function public.add_friend_by_user_id(target_user_id uuid)
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
  first_user_id uuid;
  second_user_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'You cannot add yourself as a friend';
  end if;

  if not exists (select 1 from public.users where id = target_user_id) then
    raise exception 'User ID not found';
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

create or replace function public.delete_current_user_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  delete from auth.users
  where id = auth.uid();
end;
$$;

grant execute on function public.add_friend_by_user_id(uuid) to authenticated;
grant execute on function public.delete_current_user_account() to authenticated;

