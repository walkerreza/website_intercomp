grant execute on function public.create_clan(text) to authenticated;
grant execute on function public.create_personal_workspace(text) to authenticated;
grant execute on function public.create_clan_workspace(uuid, text) to authenticated;
grant execute on function public.request_join_clan_by_code(text) to authenticated;
grant execute on function public.request_join_workspace_by_code(text) to authenticated;
grant execute on function public.regenerate_clan_join_code(uuid) to authenticated;
grant execute on function public.regenerate_workspace_join_code(uuid) to authenticated;
grant execute on function public.list_my_boards_and_clans() to authenticated;
grant execute on function public.get_clan_detail(uuid) to authenticated;

notify pgrst, 'reload schema';
