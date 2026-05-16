alter table public.quests
  add column if not exists label text not null default 'study',
  add column if not exists visibility text not null default 'workspace',
  add column if not exists assigned_role_id text references public.characters(id),
  add column if not exists reward_xp integer not null default 50,
  add column if not exists reward_gold integer not null default 15;

alter table public.quests drop constraint if exists quests_difficulty_check;
alter table public.quests
  add constraint quests_difficulty_check
  check (difficulty in ('low', 'medium', 'hard', 'E-Rank', 'D-Rank', 'C-Rank', 'B-Rank', 'A-Rank', 'S-Rank'));

alter table public.quests drop constraint if exists quests_visibility_check;
alter table public.quests
  add constraint quests_visibility_check
  check (visibility in ('workspace', 'private'));

alter table public.quests
  add constraint quests_reward_xp_non_negative check (reward_xp >= 0) not valid;

alter table public.quests
  add constraint quests_reward_gold_non_negative check (reward_gold >= 0) not valid;

do $$
declare
  workspace_record record;
  completed_column_id uuid;
begin
  for workspace_record in select id from public.workspaces loop
    select id into completed_column_id
    from public.board_columns
    where workspace_id = workspace_record.id
      and lower(name) in ('completed', 'done')
    order by position
    limit 1;

    if completed_column_id is not null then
      update public.board_columns
      set position = 99, name = 'COMPLETED', type = 'done'
      where id = completed_column_id;
    end if;

    update public.board_columns
    set name = 'HARD', type = 'todo', position = 0
    where workspace_id = workspace_record.id
      and lower(name) in ('available', 'hard');

    update public.board_columns
    set name = 'MEDIUM', type = 'todo', position = 1
    where workspace_id = workspace_record.id
      and lower(name) in ('in progress', 'medium');

    insert into public.board_columns (workspace_id, name, type, position)
    select workspace_record.id, 'HARD', 'todo', 0
    where not exists (
      select 1 from public.board_columns where workspace_id = workspace_record.id and name = 'HARD'
    )
    on conflict (workspace_id, position) do nothing;

    insert into public.board_columns (workspace_id, name, type, position)
    select workspace_record.id, 'MEDIUM', 'todo', 1
    where not exists (
      select 1 from public.board_columns where workspace_id = workspace_record.id and name = 'MEDIUM'
    )
    on conflict (workspace_id, position) do nothing;

    insert into public.board_columns (workspace_id, name, type, position)
    select workspace_record.id, 'EASY', 'todo', 2
    where not exists (
      select 1 from public.board_columns where workspace_id = workspace_record.id and name = 'EASY'
    )
    on conflict (workspace_id, position) do nothing;

    update public.board_columns
    set name = 'COMPLETED', type = 'done', position = 3
    where id = completed_column_id;

    insert into public.board_columns (workspace_id, name, type, position)
    select workspace_record.id, 'COMPLETED', 'done', 3
    where not exists (
      select 1 from public.board_columns where workspace_id = workspace_record.id and name = 'COMPLETED'
    )
    on conflict (workspace_id, position) do nothing;
  end loop;
end;
$$;

create or replace function public.create_default_workspace_for_user(
  target_user_id uuid,
  target_name text default 'Questify Study Guild'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_workspace_id uuid;
begin
  select w.id
    into created_workspace_id
  from public.workspaces w
  where w.owner_id = target_user_id
  order by w.created_at
  limit 1;

  if created_workspace_id is not null then
    return created_workspace_id;
  end if;

  insert into public.workspaces (name, owner_id)
  values (coalesce(nullif(target_name, ''), 'Questify Study Guild'), target_user_id)
  returning id into created_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (created_workspace_id, target_user_id, 'owner', 'active')
  on conflict (workspace_id, user_id) do update set
    role = 'owner',
    status = 'active';

  insert into public.board_columns (workspace_id, name, type, position)
  values
    (created_workspace_id, 'HARD', 'todo', 0),
    (created_workspace_id, 'MEDIUM', 'todo', 1),
    (created_workspace_id, 'EASY', 'todo', 2),
    (created_workspace_id, 'COMPLETED', 'done', 3)
  on conflict (workspace_id, position) do nothing;

  return created_workspace_id;
end;
$$;

create or replace function public.claim_quest_reward(target_quest_id uuid)
returns table (
  rewarded_user_id uuid,
  xp_amount integer,
  gold_amount integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_quest record;
  reward_xp integer;
  reward_gold integer;
begin
  select
    q.id,
    q.workspace_id,
    q.difficulty,
    q.effort_points,
    q.reward_xp,
    q.reward_gold,
    bc.type as column_type
    into target_quest
  from public.quests q
  join public.board_columns bc on bc.id = q.column_id
  where q.id = target_quest_id;

  if target_quest.id is null then
    raise exception 'Quest not found';
  end if;

  if not exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_quest.workspace_id
      and wm.user_id = auth.uid()
      and wm.status = 'active'
  ) then
    raise exception 'Not allowed to claim this quest';
  end if;

  if target_quest.column_type <> 'done' then
    raise exception 'Quest must be in a done column before claiming reward';
  end if;

  if not exists (
    select 1
    from public.quest_assignees qa
    where qa.quest_id = target_quest.id
  ) then
    raise exception 'Quest must have at least one assignee before claiming reward';
  end if;

  reward_xp :=
    coalesce(nullif(target_quest.reward_xp, 0),
      case target_quest.difficulty
        when 'S-Rank' then 150
        when 'A-Rank' then 120
        when 'B-Rank' then 90
        when 'C-Rank' then 70
        when 'D-Rank' then 45
        when 'E-Rank' then 25
        when 'hard' then 100
        when 'low' then 20
        else 50
      end + (target_quest.effort_points * 5)
    );
  reward_gold := coalesce(nullif(target_quest.reward_gold, 0), greatest(10, round(reward_xp * 0.28)::integer));

  create temporary table if not exists pg_temp.new_quest_rewards (
    user_id uuid primary key,
    xp_amount integer not null,
    gold_amount integer not null
  ) on commit drop;

  truncate table pg_temp.new_quest_rewards;

  with inserted_rewards as (
    insert into public.quest_rewards (quest_id, user_id, xp_amount, gold_amount)
    select target_quest.id, qa.user_id, reward_xp, reward_gold
    from public.quest_assignees qa
    where qa.quest_id = target_quest.id
    on conflict (quest_id, user_id) do nothing
    returning user_id, xp_amount, gold_amount
  )
  insert into pg_temp.new_quest_rewards (user_id, xp_amount, gold_amount)
  select user_id, xp_amount, gold_amount
  from inserted_rewards;

  update public.users u
  set
    xp = u.xp + nr.xp_amount,
    gold = u.gold + nr.gold_amount
  from pg_temp.new_quest_rewards nr
  where nr.user_id = u.id;

  update public.quests q
  set claimed_at = coalesce(q.claimed_at, now())
  where q.id = target_quest.id
    and exists (
      select 1
      from public.quest_rewards qr
      where qr.quest_id = q.id
    )
    and not exists (
      select 1
      from public.quest_assignees qa
      where qa.quest_id = q.id
        and not exists (
          select 1
          from public.quest_rewards qr
          where qr.quest_id = q.id
            and qr.user_id = qa.user_id
        )
    );

  return query
  select nr.user_id, nr.xp_amount, nr.gold_amount
  from pg_temp.new_quest_rewards nr
  order by nr.user_id;
end;
$$;

drop policy if exists "Authenticated users can read user directory" on public.users;
create policy "Authenticated users can read user directory"
on public.users
for select
using (auth.role() = 'authenticated');

