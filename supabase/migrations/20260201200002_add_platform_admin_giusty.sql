-- Add giusty@gigaviz.com as platform admin
-- This enables access to ops console customer search

-- Insert platform admin record for giusty@gigaviz.com
insert into public.platform_admins (user_id, created_by)
select 
  u.id,
  u.id  -- self-granted
from auth.users u
where u.email = 'giusty@gigaviz.com'
on conflict (user_id) do nothing;

-- Verify the insert
do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.platform_admins pa
  join auth.users u on u.id = pa.user_id
  where u.email = 'giusty@gigaviz.com';
  
  if v_count > 0 then
    raise notice '✅ Platform admin access granted to giusty@gigaviz.com';
  else
    raise warning '⚠️ User giusty@gigaviz.com not found in auth.users';
  end if;
end $$;
