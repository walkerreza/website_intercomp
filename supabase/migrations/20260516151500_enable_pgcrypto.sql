create extension if not exists pgcrypto with schema extensions;

create or replace function public.generate_clan_join_code()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  generated_code text;
begin
  loop
    generated_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
    exit when not exists (
      select 1 from public.clans c where upper(c.join_code) = generated_code
    );
  end loop;

  return generated_code;
end;
$$;

create or replace function public.generate_workspace_join_code()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  generated_code text;
begin
  loop
    generated_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
    exit when not exists (
      select 1
      from public.workspaces w
      where upper(w.join_code) = generated_code
    );
  end loop;

  return generated_code;
end;
$$;
