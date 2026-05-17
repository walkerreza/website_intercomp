create table if not exists public.workspace_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  sender_id uuid references public.users(id) on delete set null,
  sender_type text not null default 'user' check (sender_type in ('user', 'ai', 'system')),
  content text not null,
  content_type text not null default 'text' check (content_type in ('text', 'mermaid', 'mixed')),
  created_at timestamptz not null default now()
);

create index if not exists workspace_messages_workspace_created_idx
on public.workspace_messages(workspace_id, created_at desc);

create index if not exists workspace_messages_sender_idx
on public.workspace_messages(sender_id, created_at desc);

alter table public.workspace_messages enable row level security;

drop policy if exists "Members can read workspace messages" on public.workspace_messages;
create policy "Members can read workspace messages"
on public.workspace_messages
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can create user workspace messages" on public.workspace_messages;
create policy "Members can create user workspace messages"
on public.workspace_messages
for insert
with check (
  public.is_workspace_member(workspace_id)
  and auth.uid() = sender_id
  and sender_type = 'user'
);

drop policy if exists "Members can delete their own workspace messages" on public.workspace_messages;
create policy "Members can delete their own workspace messages"
on public.workspace_messages
for delete
using (
  public.is_workspace_member(workspace_id)
  and auth.uid() = sender_id
  and sender_type = 'user'
);

notify pgrst, 'reload schema';
