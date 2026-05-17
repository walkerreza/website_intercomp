create table if not exists public.quest_notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  quest_id uuid references public.quests(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('due_soon', 'due_today', 'overdue')),
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (quest_id, user_id, type)
);

create index if not exists quest_notifications_user_created_idx
on public.quest_notifications(user_id, created_at desc);

create index if not exists quest_notifications_workspace_user_idx
on public.quest_notifications(workspace_id, user_id);

alter table public.quest_notifications enable row level security;

drop policy if exists "Users can read their quest notifications" on public.quest_notifications;
create policy "Users can read their quest notifications"
on public.quest_notifications
for select
using (auth.uid() = user_id and public.is_workspace_member(workspace_id));

drop policy if exists "Users can create their quest notifications" on public.quest_notifications;
create policy "Users can create their quest notifications"
on public.quest_notifications
for insert
with check (auth.uid() = user_id and public.is_workspace_member(workspace_id));

drop policy if exists "Users can update their quest notifications" on public.quest_notifications;
create policy "Users can update their quest notifications"
on public.quest_notifications
for update
using (auth.uid() = user_id and public.is_workspace_member(workspace_id))
with check (auth.uid() = user_id and public.is_workspace_member(workspace_id));

notify pgrst, 'reload schema';
