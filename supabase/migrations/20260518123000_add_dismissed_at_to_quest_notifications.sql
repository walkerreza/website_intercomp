alter table public.quest_notifications
add column if not exists dismissed_at timestamptz;

create index if not exists quest_notifications_workspace_user_visible_idx
on public.quest_notifications(workspace_id, user_id, dismissed_at);

drop policy if exists "Users can delete their quest notifications" on public.quest_notifications;
create policy "Users can delete their quest notifications"
on public.quest_notifications
for delete
using (auth.uid() = user_id and public.is_workspace_member(workspace_id));

notify pgrst, 'reload schema';
