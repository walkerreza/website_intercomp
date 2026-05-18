create index if not exists quest_assignees_quest_id_idx
on public.quest_assignees(quest_id);

create index if not exists quest_checklists_quest_id_position_idx
on public.quest_checklists(quest_id, position);

create index if not exists quest_comments_quest_id_created_idx
on public.quest_comments(quest_id, created_at desc);

create index if not exists quest_rewards_quest_id_idx
on public.quest_rewards(quest_id);
