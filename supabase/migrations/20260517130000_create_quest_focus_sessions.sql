create table if not exists public.quest_focus_sessions (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  method text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  resulted_in_completion boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists quest_focus_sessions_quest_created_idx
on public.quest_focus_sessions(quest_id, created_at desc);

create index if not exists quest_focus_sessions_user_created_idx
on public.quest_focus_sessions(user_id, created_at desc);

alter table public.quest_focus_sessions enable row level security;

drop policy if exists "Members can read quest focus sessions" on public.quest_focus_sessions;
create policy "Members can read quest focus sessions"
on public.quest_focus_sessions
for select
using (public.is_workspace_member(public.quest_workspace_id(quest_id)));

drop policy if exists "Users can create their quest focus sessions" on public.quest_focus_sessions;
create policy "Users can create their quest focus sessions"
on public.quest_focus_sessions
for insert
with check (
  auth.uid() = user_id
  and public.is_workspace_member(public.quest_workspace_id(quest_id))
);

create or replace function public.record_quest_focus_session(
  target_quest_id uuid,
  focus_method text,
  duration_minutes integer,
  resulted_in_completion boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_workspace_member(public.quest_workspace_id(target_quest_id)) then
    raise exception 'Not a workspace member';
  end if;

  insert into public.quest_focus_sessions (
    quest_id,
    user_id,
    method,
    duration_minutes,
    resulted_in_completion
  )
  values (
    target_quest_id,
    auth.uid(),
    coalesce(nullif(trim(focus_method), ''), 'Focus Session'),
    greatest(duration_minutes, 1),
    coalesce(resulted_in_completion, false)
  )
  returning id into inserted_id;

  return inserted_id;
end;
$$;

grant execute on function public.record_quest_focus_session(uuid, text, integer, boolean) to authenticated;

notify pgrst, 'reload schema';
