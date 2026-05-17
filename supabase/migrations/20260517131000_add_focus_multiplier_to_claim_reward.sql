create or replace function public.claim_quest_reward(target_quest_id uuid, method_multiplier numeric)
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
  base_reward_xp integer;
  reward_xp integer;
  reward_gold integer;
  safe_multiplier numeric;
begin
  safe_multiplier := greatest(coalesce(method_multiplier, 1), 0);

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

  base_reward_xp :=
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
  reward_xp := round(base_reward_xp * safe_multiplier)::integer;
  reward_gold := coalesce(nullif(target_quest.reward_gold, 0), greatest(10, round(base_reward_xp * 0.28)::integer));

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
    returning
      quest_rewards.user_id as rewarded_user_id,
      quest_rewards.xp_amount as rewarded_xp_amount,
      quest_rewards.gold_amount as rewarded_gold_amount
  )
  insert into pg_temp.new_quest_rewards (user_id, xp_amount, gold_amount)
  select
    ir.rewarded_user_id,
    ir.rewarded_xp_amount,
    ir.rewarded_gold_amount
  from inserted_rewards ir;

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

grant execute on function public.claim_quest_reward(uuid, numeric) to authenticated;

notify pgrst, 'reload schema';
