update public.quests q
set
  reward_xp = case q.difficulty
    when 'S-Rank' then 220
    when 'A-Rank' then 160
    when 'B-Rank' then 110
    when 'C-Rank' then 75
    when 'D-Rank' then 45
    when 'E-Rank' then 25
    when 'hard' then 110
    when 'medium' then 75
    when 'low' then 45
    else 75
  end,
  reward_gold = case q.difficulty
    when 'S-Rank' then 62
    when 'A-Rank' then 45
    when 'B-Rank' then 31
    when 'C-Rank' then 21
    when 'D-Rank' then 13
    when 'E-Rank' then 10
    when 'hard' then 31
    when 'medium' then 21
    when 'low' then 13
    else 21
  end
where not exists (
  select 1
  from public.quest_rewards qr
  where qr.quest_id = q.id
);
