-- Ensure updated_at trigger helper exists before dependent migrations
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Idempotent safeguard: ensure search_path stays default
comment on function public.update_updated_at_column() is 'Sets updated_at to now() before update';
