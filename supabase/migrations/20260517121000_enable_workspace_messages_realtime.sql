do $$
begin
  alter publication supabase_realtime add table public.workspace_messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
