grant select, insert, delete on public.workspace_messages to authenticated;

notify pgrst, 'reload schema';
