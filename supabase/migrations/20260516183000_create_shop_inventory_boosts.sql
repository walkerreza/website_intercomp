create table if not exists public.shop_items (
  id text primary key,
  name text not null,
  category text not null default 'Consumable',
  effect_type text not null,
  effect_value integer not null default 0,
  duration_hours integer not null default 24,
  max_uses integer not null default 1,
  price integer not null check (price >= 0),
  rarity text not null default 'Normal',
  description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  item_id text not null references public.shop_items(id) on delete restrict,
  quantity integer not null default 1 check (quantity >= 0),
  remaining_uses integer not null default 1 check (remaining_uses >= 0),
  status text not null default 'available',
  acquired_at timestamptz not null default now(),
  activated_at timestamptz
);

create table if not exists public.active_boosts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  user_item_id uuid references public.user_items(id) on delete set null,
  item_id text not null references public.shop_items(id) on delete restrict,
  effect_type text not null,
  effect_value integer not null default 0,
  remaining_uses integer not null default 1 check (remaining_uses >= 0),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.shop_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  item_id text not null references public.shop_items(id) on delete restrict,
  user_item_id uuid references public.user_items(id) on delete set null,
  action text not null,
  gold_delta integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists user_items_user_id_idx on public.user_items(user_id);
create index if not exists user_items_item_id_idx on public.user_items(item_id);
create index if not exists active_boosts_user_id_idx on public.active_boosts(user_id);
create index if not exists active_boosts_effect_type_idx on public.active_boosts(effect_type);
create index if not exists shop_transactions_user_id_idx on public.shop_transactions(user_id);

alter table public.shop_items enable row level security;
alter table public.user_items enable row level security;
alter table public.active_boosts enable row level security;
alter table public.shop_transactions enable row level security;

drop policy if exists "Authenticated users can read active shop items" on public.shop_items;
create policy "Authenticated users can read active shop items"
on public.shop_items
for select
to authenticated
using (is_active = true);

drop policy if exists "Users can read own inventory" on public.user_items;
create policy "Users can read own inventory"
on public.user_items
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can read own active boosts" on public.active_boosts;
create policy "Users can read own active boosts"
on public.active_boosts
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can read own shop transactions" on public.shop_transactions;
create policy "Users can read own shop transactions"
on public.shop_transactions
for select
to authenticated
using (user_id = auth.uid());

insert into public.shop_items (
  id, name, category, effect_type, effect_value, duration_hours, max_uses, price, rarity, description, is_active
) values
  ('focus-potion', 'Focus Potion', 'Consumable', 'next_quest_xp_percent', 10, 24, 1, 90, 'Normal', 'Bonus XP untuk quest berikutnya setelah diaktifkan.', true),
  ('sprint-drum', 'Sprint Drum', 'Consumable', 'next_quest_gold_percent', 15, 12, 1, 120, 'Rare', 'Bonus gold untuk reward quest berikutnya.', true),
  ('priority-lens', 'Priority Lens', 'Utility', 'priority_highlight', 1, 24, 1, 75, 'Normal', 'Menandai sesi kerja berikutnya sebagai mode prioritas.', true),
  ('streak-guard', 'Streak Guard', 'Utility', 'streak_guard', 1, 72, 1, 160, 'Epic', 'Token proteksi produktivitas untuk dipakai pada sistem streak.', true),
  ('guild-banner', 'Guild Banner', 'Squad', 'guild_morale', 5, 24, 1, 220, 'Legendary', 'Buff moral squad untuk event workspace berikutnya.', true)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  effect_type = excluded.effect_type,
  effect_value = excluded.effect_value,
  duration_hours = excluded.duration_hours,
  max_uses = excluded.max_uses,
  price = excluded.price,
  rarity = excluded.rarity,
  description = excluded.description,
  is_active = excluded.is_active;

create or replace function public.get_shop_inventory_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Login required';
  end if;

  select jsonb_build_object(
    'profile', jsonb_build_object(
      'gold', coalesce((select u.gold from public.users u where u.id = auth.uid()), 0)
    ),
    'catalog', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', si.id,
          'name', si.name,
          'category', si.category,
          'effectType', si.effect_type,
          'effectValue', si.effect_value,
          'durationHours', si.duration_hours,
          'maxUses', si.max_uses,
          'price', si.price,
          'rarity', si.rarity,
          'description', si.description
        )
        order by si.price, si.name
      )
      from public.shop_items si
      where si.is_active = true
    ), '[]'::jsonb),
    'inventory', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', ui.id,
          'itemId', si.id,
          'name', si.name,
          'category', si.category,
          'effectType', si.effect_type,
          'effectValue', si.effect_value,
          'durationHours', si.duration_hours,
          'maxUses', si.max_uses,
          'price', si.price,
          'rarity', si.rarity,
          'description', si.description,
          'quantity', ui.quantity,
          'remainingUses', ui.remaining_uses,
          'status', ui.status,
          'acquiredAt', ui.acquired_at,
          'activatedAt', ui.activated_at
        )
        order by ui.acquired_at desc
      )
      from public.user_items ui
      join public.shop_items si on si.id = ui.item_id
      where ui.user_id = auth.uid()
        and ui.quantity > 0
    ), '[]'::jsonb),
    'activeBoosts', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', ab.id,
          'itemId', si.id,
          'name', si.name,
          'effectType', ab.effect_type,
          'effectValue', ab.effect_value,
          'remainingUses', ab.remaining_uses,
          'expiresAt', ab.expires_at,
          'rarity', si.rarity
        )
        order by ab.created_at desc
      )
      from public.active_boosts ab
      join public.shop_items si on si.id = ab.item_id
      where ab.user_id = auth.uid()
        and ab.remaining_uses > 0
        and (ab.expires_at is null or ab.expires_at > now())
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

create or replace function public.buy_shop_item(target_item_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_item public.shop_items%rowtype;
  current_gold integer;
  created_user_item_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Login required';
  end if;

  select * into target_item
  from public.shop_items
  where id = target_item_id
    and is_active = true;

  if target_item.id is null then
    raise exception 'Item not found';
  end if;

  select u.gold into current_gold
  from public.users u
  where u.id = auth.uid()
  for update;

  if coalesce(current_gold, 0) < target_item.price then
    raise exception 'Gold tidak cukup';
  end if;

  update public.users
  set gold = gold - target_item.price
  where id = auth.uid();

  insert into public.user_items (user_id, item_id, quantity, remaining_uses, status)
  values (auth.uid(), target_item.id, 1, target_item.max_uses, 'available')
  returning id into created_user_item_id;

  insert into public.shop_transactions (user_id, item_id, user_item_id, action, gold_delta)
  values (auth.uid(), target_item.id, created_user_item_id, 'buy', -target_item.price);

  return public.get_shop_inventory_summary();
end;
$$;

create or replace function public.activate_inventory_item(target_user_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_item record;
begin
  if auth.uid() is null then
    raise exception 'Login required';
  end if;

  select
    ui.id,
    ui.quantity,
    ui.remaining_uses,
    ui.status,
    si.id as item_id,
    si.effect_type,
    si.effect_value,
    si.duration_hours,
    si.max_uses
    into target_user_item
  from public.user_items ui
  join public.shop_items si on si.id = ui.item_id
  where ui.id = target_user_item_id
    and ui.user_id = auth.uid()
  for update;

  if target_user_item.id is null then
    raise exception 'Inventory item not found';
  end if;

  if target_user_item.quantity <= 0 or target_user_item.status <> 'available' then
    raise exception 'Item tidak tersedia';
  end if;

  insert into public.active_boosts (
    user_id, user_item_id, item_id, effect_type, effect_value, remaining_uses, expires_at
  ) values (
    auth.uid(),
    target_user_item.id,
    target_user_item.item_id,
    target_user_item.effect_type,
    target_user_item.effect_value,
    target_user_item.max_uses,
    now() + make_interval(hours => target_user_item.duration_hours)
  );

  update public.user_items
  set
    quantity = quantity - 1,
    remaining_uses = 0,
    status = 'activated',
    activated_at = now()
  where id = target_user_item.id;

  insert into public.shop_transactions (user_id, item_id, user_item_id, action, gold_delta)
  values (auth.uid(), target_user_item.item_id, target_user_item.id, 'activate', 0);

  return public.get_shop_inventory_summary();
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

  with assignee_rewards as (
    select
      qa.user_id,
      round(
        reward_xp * (
          1 + coalesce((
            select max(ab.effect_value)
            from public.active_boosts ab
            where ab.user_id = qa.user_id
              and ab.effect_type = 'next_quest_xp_percent'
              and ab.remaining_uses > 0
              and (ab.expires_at is null or ab.expires_at > now())
          ), 0) / 100.0
        )
      )::integer as xp_amount,
      round(
        reward_gold * (
          1 + coalesce((
            select max(ab.effect_value)
            from public.active_boosts ab
            where ab.user_id = qa.user_id
              and ab.effect_type = 'next_quest_gold_percent'
              and ab.remaining_uses > 0
              and (ab.expires_at is null or ab.expires_at > now())
          ), 0) / 100.0
        )
      )::integer as gold_amount
    from public.quest_assignees qa
    where qa.quest_id = target_quest.id
  ),
  inserted_rewards as (
    insert into public.quest_rewards (quest_id, user_id, xp_amount, gold_amount)
    select target_quest.id, ar.user_id, ar.xp_amount, ar.gold_amount
    from assignee_rewards ar
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

  update public.active_boosts ab
  set remaining_uses = greatest(ab.remaining_uses - 1, 0)
  from pg_temp.new_quest_rewards nr
  where ab.user_id = nr.user_id
    and ab.effect_type in ('next_quest_xp_percent', 'next_quest_gold_percent')
    and ab.remaining_uses > 0
    and (ab.expires_at is null or ab.expires_at > now());

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

grant execute on function public.get_shop_inventory_summary() to authenticated;
grant execute on function public.buy_shop_item(text) to authenticated;
grant execute on function public.activate_inventory_item(uuid) to authenticated;
grant execute on function public.claim_quest_reward(uuid) to authenticated;

notify pgrst, 'reload schema';
