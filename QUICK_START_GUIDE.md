# WhatsApp Templates Center - Quick Start Guide

## 🚀 Access URLs

Replace `[workspaceSlug]` with your workspace slug (e.g., `my-company`)

### Main Pages
```
Templates (with actions)
→ https://your-domain.com/[workspaceSlug]/meta-hub/messaging/whatsapp

Jobs Dashboard
→ https://your-domain.com/[workspaceSlug]/meta-hub/messaging/whatsapp/jobs

Job Detail
→ https://your-domain.com/[workspaceSlug]/meta-hub/messaging/whatsapp/jobs/[jobId]

Parameter Mapping
→ https://your-domain.com/[workspaceSlug]/meta-hub/messaging/whatsapp/param-defs

Template Param Editor (direct)
→ https://your-domain.com/[workspaceSlug]/meta-hub/messaging/whatsapp/param-defs?templateId=[id]
```

---

## 📱 UI Navigation Flow

```
┌─────────────────────────────────────────────────────────────┐
│  WhatsApp Command Center                                    │
│  [Meta Hub Badge] [Connection Settings] [Webhook Events]    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [Templates] [Jobs] [Param Mapping] [Inbox] [Webhooks]      │ ← Sticky Tabs
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Templates Tab (Default)                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Template 1  │ │ Template 2  │ │ Template 3  │           │
│  │ APPROVED    │ │ PENDING     │ │ REJECTED    │           │
│  │ UTILITY     │ │ MARKETING   │ │ UTILITY     │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ✓ Selected Template: "order_confirmation"            │  │
│  │                                                        │  │
│  │ BODY:                                                  │  │
│  │ "Your order {{1}} is confirmed. Total: {{2}}"        │  │
│  │ Contains 2 parameters                                  │  │
│  │                                                        │  │
│  │ [🧪 Send Test] [⚙️ Edit Param Mapping] [👥 Create Batch] │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Jobs Tab                                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Job: "Black Friday Promo"                             │  │
│  │ Template: welcome_message                             │  │
│  │ Progress: ████████░░ 80% (800/1000)                   │  │
│  │ Status: Processing • Sent: 800 • Failed: 0           │  │
│  │ [View Details]                                        │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Job: "Order Confirmations"                            │  │
│  │ Template: order_confirmation                          │  │
│  │ Progress: ██████████ 100% (250/250)                   │  │
│  │ Status: Completed • Sent: 248 • Failed: 2            │  │
│  │ [View Details]                                        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Param Mapping Tab                                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Template 1  │ │ Template 2  │ │ Template 3  │           │
│  │ 2 params    │ │ 3 params    │ │ 1 param     │           │
│  │ UTILITY     │ │ MARKETING   │ │ UTILITY     │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Action Buttons Explained

### 1. 🧪 Send Test
**When**: Template is APPROVED  
**Opens**: SendTestTemplateModal  
**Use Case**: Quick test before batch send

**Steps**:
1. Click "Send Test" on selected template
2. Enter recipient phone (e.g., 628123456789)
3. Fill parameter values:
   - {{1}} → "12345"
   - {{2}} → "$99.99"
4. See live preview update
5. Click "Send Test"
6. Message sent immediately to WhatsApp

### 2. ⚙️ Edit Param Mapping
**When**: Template has parameters (variable_count > 0)  
**Opens**: ParamMappingEditorModal  
**Use Case**: Define how params are populated in batch

**Steps**:
1. Click "Edit Param Mapping"
2. For each parameter {{1}}, {{2}}, ...:
   
   **Option A: Manual**
   - Use global values (same for all)
   - Example: Promo code "SAVE20"
   
   **Option B: Contact Field**
   - Pull from contact data
   - Source Value: "name", "phone", "email"
   - Example: {{1}} → contact.name → "John Doe"
   
   **Option C: Expression**
   - Template with placeholders
   - Source Value: "Hi {{contact.name}}"
   - Example: {{1}} → "Hi John Doe"

3. Set default fallback (if field missing)
4. Click "Save"

### 3. 👥 Create Batch Campaign
**When**: Template is APPROVED  
**Action**: Navigate to Jobs page  
**Use Case**: Start new batch send campaign

**Future Implementation**:
- Select audience (tags or contact IDs)
- Provide global values (for "manual" params)
- Preview computed params
- Create job → Auto-processes via worker

---

## 🔄 Background Processing

### Vercel Cron Worker
```
Schedule: Every 2 minutes
Endpoint: POST /api/cron/wa-send-worker
Auth: Bearer token (CRON_SECRET)

Process:
1. Fetch pending jobs
2. For each job:
   - Fetch queued items (batch of 10)
   - Check rate limit (messages/minute)
   - Send via WhatsApp Cloud API
   - Update status: queued → sending → sent/failed
   - Log results (hashed phone numbers)
3. Mark job as completed when done
```

### Manual Trigger (Testing)
```bash
curl -X POST https://your-domain.com/api/cron/wa-send-worker \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 📊 Data Flow

### Template Sync
```
User clicks "Sync Templates"
↓
POST /api/meta/whatsapp/templates/sync
↓
Fetch from Meta Graph API
↓
Extract variable_count ({{1}}, {{2}}, ...)
↓
Store in wa_templates with components_json
↓
UI refreshes with updated templates
```

### Send Test
```
User fills params & clicks "Send Test"
↓
POST /api/meta/whatsapp/templates/send-test
{
  templateName, language, to, params
}
↓
Build WhatsApp API payload
↓
Send via Meta Graph API
↓
Return WA message ID
```

### Batch Campaign
```
User creates job (future UI)
↓
POST /api/meta/whatsapp/jobs/create
{
  templateId, audience, paramMapping, globalValues
}
↓
For each contact:
  - Compute params using mappings
  - Create wa_send_job_item (status: queued)
↓
Store wa_send_job with total_recipients
↓
Cron worker picks up queued items
↓
Process in batches, respect rate limits
↓
Update status, create logs
```

---

## 🎨 Styling & Responsiveness

### Color Scheme
- Gold/Yellow: `#d4af37` (gigaviz-gold) - Primary actions, highlights
- Dark Blue: `#0a1229`, `#050a18` - Backgrounds
- Green: `#10b981` - Success, approved, sent
- Red: `#e11d48` - Error, rejected, failed
- Amber: Pending, warnings

### Breakpoints
```css
360px  → Mobile portrait (1 column, stacked)
768px  → Tablet (2 columns, side-by-side)
1024px → Laptop (3 columns, grid layout)
1280px → Desktop (optimized spacing, max width)
```

### Components
- Cards: `rounded-2xl border border-[#d4af37]/20`
- Buttons: Gradient backgrounds with hover effects
- Badges: Rounded pills with status colors
- Progress bars: Filled bars with percentage
- Modals: Backdrop blur with slide-up animation

---

## ✅ Pre-Launch Checklist

### Environment
- [ ] `CRON_SECRET` set in .env.local
- [ ] `CRON_SECRET` added to Vercel dashboard
- [ ] Database migration applied
- [ ] vercel.json deployed with project

### Connections
- [ ] WhatsApp phone number connected
- [ ] Meta token valid and active
- [ ] Webhooks configured (optional for inbox)

### Templates
- [ ] Templates synced from Meta
- [ ] At least one APPROVED template exists
- [ ] Variable counts computed correctly

### Testing
- [ ] Navigate to all tabs (Templates, Jobs, Param Mapping)
- [ ] Select template → Action buttons appear
- [ ] Send test → Modal opens, params render
- [ ] Edit param mapping → Modal opens, save works
- [ ] View jobs list → Data loads
- [ ] View job detail → Items table renders

---

## 🐛 Troubleshooting

### "No templates yet"
→ Click "Sync Templates" button  
→ Verify Meta token is valid  
→ Check phone number connection

### "Template has no parameters"
→ Template body doesn't contain {{1}}, {{2}}, etc.  
→ Param mapping not needed for this template

### Action buttons not showing
→ Template must have status = "APPROVED"  
→ Refresh template list after sync

### Jobs not processing
→ Check CRON_SECRET is set  
→ Verify Vercel Cron is running (Logs tab)  
→ Manually trigger worker to test

### Send test fails
→ Verify phone number format (no + sign)  
→ Check connection is active  
→ Review Meta API errors in response

---

## 📈 Success Indicators

✅ **Navigation works**: All tabs clickable, pages load  
✅ **Template actions visible**: Buttons show on selection  
✅ **Modals open**: Dialogs render without errors  
✅ **API calls succeed**: No 404/500 errors in Network tab  
✅ **Data persists**: Param mappings save, jobs create  
✅ **Worker runs**: Check Vercel logs for cron executions  
✅ **Messages send**: WhatsApp delivers test messages  

---

**Ready to test! 🚀**

Start at: `https://your-domain.com/[workspaceSlug]/meta-hub/messaging/whatsapp`
