create table if not exists public.quest_activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  quest_id uuid references public.quests(id) on delete set null,
  actor_id uuid references public.users(id) on delete set null,
  action text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists quest_activities_workspace_created_idx
on public.quest_activities(workspace_id, created_at desc);

create index if not exists quest_activities_quest_created_idx
on public.quest_activities(quest_id, created_at desc);

alter table public.quest_activities enable row level security;

drop policy if exists "Members can read quest activities" on public.quest_activities;
create policy "Members can read quest activities"
on public.quest_activities
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can create quest activities" on public.quest_activities;
create policy "Members can create quest activities"
on public.quest_activities
for insert
with check (
  public.is_workspace_member(workspace_id)
  and (actor_id is null or actor_id = auth.uid())
);

create or replace function public.restore_quest(target_quest_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  quest_record public.quests%rowtype;
begin
  select *
    into quest_record
  from public.quests
  where id = target_quest_id;

  if quest_record.id is null then
    raise exception 'Quest not found';
  end if;

  if not public.is_workspace_member(quest_record.workspace_id) then
    raise exception 'Quest not accessible';
  end if;

  update public.quests
  set archived_at = null
  where id = target_quest_id;

  insert into public.quest_activities (workspace_id, quest_id, actor_id, action, message)
  values (
    quest_record.workspace_id,
    target_quest_id,
    auth.uid(),
    'restored',
    'Quest restored from archive.'
  );
end;
$$;

grant execute on function public.restore_quest(uuid) to authenticated;

notify pgrst, 'reload schema';
