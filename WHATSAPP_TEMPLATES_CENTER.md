# WhatsApp Templates Center - Implementation Complete

## 🎯 Overview

A complete WhatsApp template-based messaging system with:
- ✅ Template syncing from Meta Graph API
- ✅ Dynamic parameter extraction and validation (`{{1}}`, `{{2}}`, ...)
- ✅ Send test modal with live preview
- ✅ Parameter mapping editor (manual/contact_field/expression)
- ✅ Batch/campaign job creation
- ✅ Background worker with rate limiting
- ✅ Jobs dashboard with progress tracking
- ✅ Detailed logs and error tracking

## 📦 New Files Created

### Database Migrations
- `supabase/migrations/20260125200000_wa_templates_complete.sql`
  - Enhanced `wa_templates` with `variable_count`, `components_json`, `has_buttons`
  - New tables: `wa_template_param_defs`, `wa_contacts`, `wa_send_jobs`, `wa_send_job_items`, `wa_send_logs`
  - RLS policies for multi-tenant isolation
  - Indexes for performance

### API Routes
- `app/api/meta/whatsapp/jobs/create/route.ts` - Create batch send jobs
- `app/api/meta/whatsapp/jobs/route.ts` - List all jobs
- `app/api/meta/whatsapp/jobs/[jobId]/route.ts` - Get job details + items
- `app/api/meta/whatsapp/template-param-defs/route.ts` - Save param mappings
- `app/api/cron/wa-send-worker/route.ts` - Background worker for sending

### Enhanced Existing Routes
- `app/api/meta/whatsapp/templates/sync/route.ts` - Now computes `variable_count` and stores `components_json`

### UI Components
- `components/meta-hub/SendTestTemplateModal.tsx` - Test sending with live preview
- `components/meta-hub/ParamMappingEditorModal.tsx` - Define parameter sources
- `components/meta-hub/JobsListClient.tsx` - Jobs list with progress bars
- `components/meta-hub/JobDetailClient.tsx` - Job detail with items table

### Helper Libraries & Types
- `lib/meta/wa-templates.ts` - Template utilities (extract variables, render, compute params)
- `types/wa-templates.ts` - TypeScript types for all entities

## 🚀 Setup Instructions

### 1. Apply Database Migration

```bash
# Using Supabase CLI
npx supabase db push

# OR manually via Supabase Dashboard
# Copy contents of supabase/migrations/20260125200000_wa_templates_complete.sql
# and run in SQL Editor
```

### 2. Set Environment Variables

Add to `.env.local`:

```bash
# Optional: Cron secret for worker security
CRON_SECRET=your-secure-random-string

# Existing Meta/WhatsApp vars (should already be set)
WA_ACCESS_TOKEN=your-token
WA_PHONE_NUMBER_ID=your-phone-id
WA_WABA_ID=your-waba-id
WA_GRAPH_VERSION=v22.0
```

### 3. Configure Vercel Cron (for production)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/wa-send-worker",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This runs the worker every 5 minutes. Adjust as needed.

For the worker to authenticate, add `CRON_SECRET` to Vercel environment variables.

### 4. Install Dependencies & Run

```bash
npm install
npm run dev
```

Visit: `http://localhost:3000/{workspace-slug}/meta-hub/messaging/whatsapp`

## 📋 Features Implemented

### 1. Template Syncing
- Syncs from Meta Graph API via existing route
- Now computes `variable_count` from all text fields (header, body, footer, buttons)
- Stores full `components_json` for advanced rendering
- Sets `has_buttons` flag

### 2. Send Test Modal
- Dynamic parameter inputs based on `variable_count`
- Live preview showing rendered template
- Header/body/footer display
- Validates all required params before send
- Integrates with existing send-test route

### 3. Parameter Mapping Editor
- Define how each `{{1}}`, `{{2}}`, ... is populated
- **Manual**: Use global values provided at job creation
- **Contact Field**: Pull from contact record (name, phone, email, custom fields)
- **Expression**: Use template syntax like `{{contact.name}}` or `{{global.promo}}`
- Default fallback values
- Saved per template in `wa_template_param_defs`

### 4. Job Creation
- POST `/api/meta/whatsapp/jobs/create`
- Select audience by tags or contact IDs
- Provide global values (for manual params)
- Automatically computes parameters for each contact
- Creates `wa_send_jobs` + individual `wa_send_job_items`
- Stores job settings (rate limit, global values)

### 5. Background Worker
- POST `/api/cron/wa-send-worker`
- Processes pending jobs in batches (10 items per run)
- Respects per-job rate limits (default 60/min)
- Sends via WhatsApp Cloud API
- Updates item status (queued → sending → sent/failed)
- Writes detailed logs to `wa_send_logs` (phone numbers hashed)
- Marks jobs as completed when done

### 6. Jobs Dashboard
- `JobsListClient.tsx`: List all jobs with progress bars
- Status badges (pending/processing/completed/failed)
- Real-time progress percentage
- Sent/failed counts
- Click to view details

### 7. Job Detail Page
- `JobDetailClient.tsx`: Full job info + items table
- Filter by status (all/sent/failed/queued)
- Export failed items as CSV
- View error messages per item
- WA message IDs with copy button
- Pagination support

### 8. Security & Multi-Tenancy
- All routes validate workspace membership
- RLS policies ensure data isolation
- Phone numbers hashed in logs (SHA-256)
- Tokens never exposed to client
- Rate limiting on all mutation endpoints
- Cron worker uses secret for auth

## 🔄 Data Flow

### Template Sync Flow
1. User clicks "Sync Templates"
2. API fetches from Meta Graph API
3. For each template:
   - Parse components (header/body/footer/buttons)
   - Extract max variable index (e.g., `{{3}}`)
   - Store `variable_count`, `components_json`, `has_buttons`
4. Upsert to `wa_templates` with unique constraint

### Test Send Flow
1. User selects template → opens modal
2. Modal generates N input fields (N = variable_count)
3. User fills params + phone number
4. Preview shows rendered template
5. Submit → POST to `/api/meta/whatsapp/templates/send-test`
6. API validates, builds payload, sends via Cloud API
7. Success/error toast

### Job Creation Flow
1. User selects template, audience, param mappings
2. POST to `/api/meta/whatsapp/jobs/create`
3. API:
   - Fetches contacts matching audience filters
   - For each contact, computes params using mappings:
     - Manual: from globalValues
     - Contact field: from contact.name, contact.data, etc.
     - Expression: renders `{{contact.field}}` template
   - Creates job + job items
4. Returns job ID

### Worker Processing Flow
1. Vercel Cron triggers `/api/cron/wa-send-worker` every 5 mins
2. Worker:
   - Fetches pending/processing jobs
   - For each job:
     - Checks rate limit (sent in last 60s)
     - Fetches queued items (up to available slots)
     - Sends each via Cloud API
     - Updates item status
     - Writes log entry (phone hashed)
   - Updates job stats (sent_count, failed_count)
   - Marks completed when queued_count = 0
3. Returns summary

## 📊 Database Schema

```
wa_templates (enhanced)
├── variable_count: int (computed from {{1}}, {{2}}, ...)
├── components_json: jsonb (full Meta structure)
└── has_buttons: boolean

wa_template_param_defs (new)
├── template_id → wa_templates
├── param_index: int (1, 2, 3, ...)
├── source_type: 'manual' | 'contact_field' | 'expression'
├── source_value: text (field name or template)
└── default_value: text (fallback)

wa_contacts (new)
├── workspace_id
├── wa_id: text (WhatsApp ID)
├── name, phone, email
├── tags: text[] (for audience filtering)
└── data: jsonb (custom fields)

wa_send_jobs (new)
├── connection_id → wa_phone_numbers
├── template_id → wa_templates
├── status: 'pending' | 'processing' | 'completed' | 'failed'
├── total_count, sent_count, failed_count, queued_count
├── global_values: jsonb
└── rate_limit_per_minute: int

wa_send_job_items (new)
├── job_id → wa_send_jobs
├── contact_id → wa_contacts
├── to_phone: text
├── params: jsonb (computed array)
├── status: 'queued' | 'sending' | 'sent' | 'failed'
└── wa_message_id, error_message

wa_send_logs (new)
├── job_id, job_item_id
├── template_id
├── to_phone_hash: text (SHA-256)
├── params: jsonb
├── success: boolean
├── wa_message_id, http_status, error_message
└── response_json: jsonb
```

## 🔧 API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/meta/whatsapp/templates/sync` | Sync templates from Meta (enhanced) |
| POST | `/api/meta/whatsapp/templates/send-test` | Send test message (existing) |
| POST | `/api/meta/whatsapp/jobs/create` | Create batch send job |
| GET | `/api/meta/whatsapp/jobs` | List all jobs for workspace |
| GET | `/api/meta/whatsapp/jobs/[jobId]` | Get job details + items |
| POST | `/api/meta/whatsapp/template-param-defs` | Save param mappings |
| POST | `/api/cron/wa-send-worker` | Background worker (Vercel Cron) |

## 🎨 UI Integration Example

Add to your templates page (e.g., `[workspaceSlug]/meta-hub/messaging/whatsapp/templates/page.tsx`):

```tsx
import { SendTestTemplateModal } from "@/components/meta-hub/SendTestTemplateModal";
import { ParamMappingEditorModal } from "@/components/meta-hub/ParamMappingEditorModal";

// In your component:
const [selectedTemplate, setSelectedTemplate] = useState<WaTemplate | null>(null);
const [showSendTest, setShowSendTest] = useState(false);
const [showParamEditor, setShowParamEditor] = useState(false);

{showSendTest && selectedTemplate && (
  <SendTestTemplateModal
    workspaceSlug={workspaceSlug}
    template={selectedTemplate}
    connectionId={activeConnectionId}
    onClose={() => setShowSendTest(false)}
  />
)}

{showParamEditor && selectedTemplate && (
  <ParamMappingEditorModal
    workspaceSlug={workspaceSlug}
    template={selectedTemplate}
    onClose={() => setShowParamEditor(false)}
    onSaved={() => loadTemplates()}
  />
)}
```

Add jobs list page (`[workspaceSlug]/meta-hub/jobs/page.tsx`):

```tsx
import { JobsListClient } from "@/components/meta-hub/JobsListClient";

export default async function JobsPage({ params }) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  
  return (
    <JobsListClient
      workspaceId={ctx.currentWorkspace.id}
      workspaceSlug={workspaceSlug}
    />
  );
}
```

Add job detail page (`[workspaceSlug]/meta-hub/jobs/[jobId]/page.tsx`):

```tsx
import { JobDetailClient } from "@/components/meta-hub/JobDetailClient";

export default async function JobDetailPage({ params }) {
  const { workspaceSlug, jobId } = await params;
  const ctx = await getAppContext(workspaceSlug);
  
  return (
    <JobDetailClient
      workspaceId={ctx.currentWorkspace.id}
      workspaceSlug={workspaceSlug}
      jobId={jobId}
    />
  );
}
```

## ✅ Testing Checklist

- [ ] Run migration successfully
- [ ] Sync templates (verify variable_count populated)
- [ ] Open send test modal (check N inputs for N variables)
- [ ] Send test message successfully
- [ ] Open param mapping editor
- [ ] Save param mappings (manual/contact_field/expression)
- [ ] Create batch job (verify items created)
- [ ] Manually trigger worker: `curl -X POST http://localhost:3000/api/cron/wa-send-worker -H "Authorization: Bearer your-secret"`
- [ ] Verify items sent (check wa_send_logs)
- [ ] View jobs list (check progress bars)
- [ ] View job detail (check items table, filters)
- [ ] Export failed items CSV

## 🐛 Common Issues

### Migration Fails
- Check if `wa_templates` already exists → migration is idempotent
- Verify `workspaces` table exists (FK constraint)

### Worker Not Processing
- Check `CRON_SECRET` matches in route and Vercel env
- Verify job status is "pending" or "processing"
- Check rate limit (may be waiting for window reset)
- Inspect logs in Vercel dashboard

### Template Variables Not Detected
- Ensure template body uses format `{{1}}`, `{{2}}` (curly braces, numbers)
- Sync templates again after migration

### Param Mapping Not Applied
- Verify mappings saved via API
- Check contact has required fields (for contact_field mode)
- Inspect `wa_send_job_items.params` JSON in database

## 📈 Next Steps / Enhancements

- [ ] Add template variable preview in param editor
- [ ] Support header/button parameters (current: body only)
- [ ] Retry failed items from UI
- [ ] Schedule jobs for future send
- [ ] A/B testing (multiple templates per job)
- [ ] Real-time job progress via WebSocket/SSE
- [ ] Template analytics (open rates, click rates)
- [ ] Bulk contact import CSV → wa_contacts
- [ ] Tag management UI for audience segmentation
- [ ] Template performance dashboard

---

**Implementation Status**: ✅ Complete & Ready for Testing

All files created, routes implemented, UI components built. Apply migration, configure cron, and test!
