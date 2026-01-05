-- Ensure inbox defaults/backfill so new threads appear in "Aktif".

alter table conversations
  alter column is_archived set default false,
  alter column pinned set default false;

update conversations set is_archived = false where is_archived is null;
update conversations set pinned = false where pinned is null;

update conversations c
set last_message_at = sub.max_ts,
    last_customer_message_at = coalesce(c.last_customer_message_at, sub.max_ts)
from (
  select conversation_id, max(ts) as max_ts
  from messages
  group by conversation_id
) sub
where c.id = sub.conversation_id
  and c.last_message_at is null;
