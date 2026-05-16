alter table public.users alter column xp set default 0;

update public.users u
set xp = 0
where u.xp = 450
  and not exists (
    select 1
    from public.quest_rewards qr
    where qr.user_id = u.id
  );

notify pgrst, 'reload schema';
