create or replace function public.get_workspace_messages(target_workspace_id uuid)
returns table (
  id uuid,
  workspace_id uuid,
  sender_id uuid,
  sender_type text,
  sender_name text,
  content text,
  content_type text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    wm.id,
    wm.workspace_id,
    wm.sender_id,
    wm.sender_type,
    case
      when wm.sender_type = 'ai' then 'Bola Sihir'
      else coalesce(u.username, u.email, 'Guild Member')
    end as sender_name,
    wm.content,
    wm.content_type,
    wm.created_at
  from public.workspace_messages wm
  left join public.users u on u.id = wm.sender_id
  where wm.workspace_id = target_workspace_id
    and public.is_workspace_member(wm.workspace_id)
  order by wm.created_at desc
  limit 30;
$$;

create or replace function public.send_workspace_message(
  target_workspace_id uuid,
  message_content text,
  message_content_type text default 'text'
)
returns table (
  id uuid,
  workspace_id uuid,
  sender_id uuid,
  sender_type text,
  sender_name text,
  content text,
  content_type text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_message public.workspace_messages%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if nullif(trim(message_content), '') is null then
    raise exception 'Message cannot be empty';
  end if;

  if not public.is_workspace_member(target_workspace_id) then
    raise exception 'Not a workspace member';
  end if;

  insert into public.workspace_messages (
    workspace_id,
    sender_id,
    sender_type,
    content,
    content_type
  )
  values (
    target_workspace_id,
    auth.uid(),
    'user',
    nullif(trim(message_content), ''),
    coalesce(nullif(message_content_type, ''), 'text')
  )
  returning * into inserted_message;

  return query
  select
    inserted_message.id,
    inserted_message.workspace_id,
    inserted_message.sender_id,
    inserted_message.sender_type,
    coalesce(u.username, u.email, 'Guild Member') as sender_name,
    inserted_message.content,
    inserted_message.content_type,
    inserted_message.created_at
  from public.users u
  where u.id = inserted_message.sender_id;
end;
$$;

grant execute on function public.get_workspace_messages(uuid) to authenticated;
grant execute on function public.send_workspace_message(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';
