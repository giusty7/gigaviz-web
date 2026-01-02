# Smoke Test Checklist

## Local URLs

- http://localhost:3000/login
- http://localhost:3000/admin/inbox
- http://localhost:3000/admin/contacts
- http://localhost:3000/admin/inbox/<conversation_id>

## Checklist

- Login works and session persists.
- Inbox loads, shows pinned/archived/unread badges.
- Search finds conversations by:
  - Contact name/phone
  - Message body text
- Notes:
  - Add a note in a thread
  - Reload and verify it persists
- Ticketing:
  - Update ticket status and priority
  - Invalid values return a 400
- First response:
  - Send inbound then outbound message
  - First response timestamp/age appears in thread detail
- Supervisor access:
  - Supervisor role can access `/admin/inbox`
  - No redirect loop to `/login?error=not_admin`
