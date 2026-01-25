# WhatsApp Contacts & Audience - Quick Start Guide

## Overview
The Contacts & Audience system lets you manage WhatsApp contacts, create segments, and send targeted batch campaigns from inside the Gigaviz app.

## Key Features
- ✅ **Contacts Management**: Add, edit, and organize contacts with tags and custom fields
- ✅ **Bulk Import**: Paste numbers or upload CSV files
- ✅ **Segments**: Create rule-based audiences for targeted campaigns
- ✅ **Opt-in Tracking**: Track consent status (opted_in, opted_out, unknown)
- ✅ **Auto-capture**: Automatically save contacts from inbound WhatsApp messages
- ✅ **Privacy**: Phone numbers masked by default in UI

## Getting Started

### 1. Access Contacts
Navigate to: **WhatsApp Command Center → Contacts tab**

### 2. Add Your First Contact

**Option A: Manual Entry**
1. Click "Add Contact"
2. Enter phone number (e.g., +62 812-3456-7890 or 08123456789)
3. Add name, tags, opt-in status
4. Click "Create"

**Option B: Bulk Paste**
1. Click "Bulk Paste"
2. Paste phone numbers (one per line)
3. Optionally: Format as `phone,name` per line
4. Apply tags to all
5. Click "Import"

**Option C: CSV Import**
1. Prepare CSV file with columns: `Phone`, `Name`, etc.
2. Click "Import CSV"
3. Upload file
4. Map CSV columns to contact fields
5. Preview and confirm

### 3. Create a Segment

**Use Case**: Target specific groups (e.g., "Jakarta customers who opted in")

1. Go to **Segments tab**
2. Click "Create Segment"
3. Set rules:
   - Include tags: `jakarta`, `customer`
   - Exclude tags: `unsubscribed`
   - Opt-in only: Toggle ON
   - Custom field filters: `city equals Jakarta`
4. Preview audience count
5. Save segment

### 4. Send a Batch Campaign

1. Go to **Jobs → Create Batch Campaign**
2. Select template
3. **Audience step**:
   - Choose segment OR
   - Select tags OR
   - Upload CSV for one-off send
4. Map template parameters (if needed)
5. Preview estimated recipients
6. Submit job

⚠️ **Opt-in Enforcement**: By default, campaigns only send to `opted_in` contacts. Opted-out contacts are automatically excluded.

## Contact Fields

| Field | Description | Format |
|-------|-------------|--------|
| `normalized_phone` | Digits-only phone number | `6281234567890` |
| `display_name` | Contact name | Optional |
| `tags` | Array of tags | `["vip", "jakarta"]` |
| `custom_fields` | Flexible key-value data | `{"city": "Jakarta", "source": "webform"}` |
| `opt_in_status` | Consent status | `unknown` / `opted_in` / `opted_out` |
| `last_seen_at` | Last inbound message | Auto-updated |

## Phone Number Format

**Accepted Inputs**:
- `+62 812-3456-7890`
- `62 812 345 6789`
- `08123456789` (assumes Indonesia → `6281234567890`)

**Normalized Storage**: All digits, no special characters
- Stored as: `6281234567890`
- Displayed as: `+62 812-****-7890` (masked)

## Tags Best Practices

✅ **Do**:
- Use lowercase: `jakarta`, `vip`, `newsletter_subscriber`
- Keep short and consistent
- Use for segmentation: `customer`, `lead`, `partner`

❌ **Don't**:
- Use spaces or special characters
- Create too many overlapping tags
- Store complex data in tags (use `custom_fields` instead)

## Auto-Capture from Inbound

When a contact sends a WhatsApp message:
1. System automatically upserts contact by phone
2. Updates `last_seen_at` timestamp
3. Preserves existing `opt_in_status` (no automatic opt-in)
4. Does NOT overwrite existing `display_name` or tags

**To Test**:
1. Send a message to your WhatsApp Business number
2. Check webhook logs: `Upserted contact: [phone]`
3. Verify contact appears in Contacts list

## Segments vs Tags

| Feature | Tags | Segments |
|---------|------|----------|
| **Use Case** | Simple grouping | Complex filtering |
| **Examples** | `vip`, `jakarta` | "VIP customers in Jakarta who opted in" |
| **Rules** | One or more tags | Include/exclude tags + custom field filters + opt-in |
| **Reusable** | Yes | Yes |

## Privacy & Security

- ✅ Phone numbers masked in UI by default (click eye icon to reveal)
- ✅ All API endpoints require workspace authentication
- ✅ RLS enforces workspace isolation in database
- ✅ Opt-out contacts excluded from campaigns by default

## Troubleshooting

### Contact not showing up after import
- Check phone format (must be valid 10-15 digits)
- Look for duplicates (same workspace + phone = conflict)
- Verify workspace context in filters

### Segment shows 0 contacts
- Preview segment to see which contacts match
- Check rules (exclude tags may be too broad)
- Ensure contacts have required tags

### CSV import shows many invalid rows
- Check phone column has valid numbers
- Ensure CSV uses comma separator (not semicolon)
- Verify column mapping matches your CSV headers

## Next Steps

1. **Import existing contacts**: Use CSV import with your customer database
2. **Tag by source**: Apply tags like `shopify`, `webform`, `manual`
3. **Create core segments**: `active_customers`, `leads`, `vip`
4. **Test campaign**: Send test message to a small segment before full send
5. **Monitor opt-outs**: Regularly check opt-out rate and respect unsubscribes

## API Access (Advanced)

See `CONTACTS_TECH.md` for full API documentation and integration examples.

---

**Need Help?** Contact support or check the full technical documentation.
