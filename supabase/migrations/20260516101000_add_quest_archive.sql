alter table public.quests
  add column if not exists archived_at timestamptz;

create index if not exists quests_workspace_archived_idx
on public.quests(workspace_id, archived_at);

