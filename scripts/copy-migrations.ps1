# Manual Migration Helper Script
# Copies migration SQL files to clipboard for pasting in Supabase Dashboard

Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         SUPABASE MANUAL MIGRATION HELPER                      ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "📍 Dashboard SQL Editor: " -NoNewline
Write-Host "https://supabase.com/dashboard/project/szzqjwqpzboaofygnebn/sql`n" -ForegroundColor Yellow

$migrations = @(
    @{
        Name = "Saved Views (M2)"
        File = "supabase\migrations\20260130000000_wa_saved_views.sql"
        Tables = "wa_saved_views"
    },
    @{
        Name = "Automation Rules (M3)"
        File = "supabase\migrations\20260131000000_automation_rules.sql"
        Tables = "automation_rules, automation_executions"
    },
    @{
        Name = "Usage Events (M4)"
        File = "supabase\migrations\20260131100000_usage_events.sql"
        Tables = "usage_events, usage_stats_daily (view)"
    }
)

$index = 1
foreach ($migration in $migrations) {
    Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
    Write-Host "  MIGRATION $index: $($migration.Name)" -ForegroundColor Green
    Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
    
    $file = $migration.File
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        Write-Host "📄 File: $file" -ForegroundColor White
        Write-Host "📊 Size: $size bytes" -ForegroundColor White
        Write-Host "🗂️  Creates: $($migration.Tables)" -ForegroundColor White
        Write-Host ""
        
        # Copy to clipboard
        Get-Content $file | Set-Clipboard
        Write-Host "✅ COPIED TO CLIPBOARD!" -ForegroundColor Green
        Write-Host "👉 Now paste in Supabase SQL Editor and click RUN" -ForegroundColor Yellow
        Write-Host ""
        
        # Wait for user confirmation
        if ($index -lt $migrations.Count) {
            Write-Host "Press Enter when done to copy next migration..." -ForegroundColor Cyan
            Read-Host
            Write-Host ""
        }
    } else {
        Write-Host "❌ File not found: $file" -ForegroundColor Red
    }
    
    $index++
}

Write-Host "`n══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "  ✅ ALL MIGRATIONS COPIED!" -ForegroundColor Green
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "`n📝 Verification Query (run in SQL Editor):" -ForegroundColor Cyan
Write-Host @"

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'wa_saved_views',
  'automation_rules', 
  'automation_executions',
  'usage_events'
)
ORDER BY table_name;

"@ -ForegroundColor White

Write-Host "Expected: 4 tables returned ✅`n" -ForegroundColor Yellow

# Also copy verification query
$verifyQuery = @"
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'wa_saved_views',
  'automation_rules', 
  'automation_executions',
  'usage_events'
)
ORDER BY table_name;
"@

Write-Host "Press Enter to copy verification query to clipboard..." -ForegroundColor Cyan
Read-Host
$verifyQuery | Set-Clipboard
Write-Host "✅ Verification query copied! Paste and run to confirm.`n" -ForegroundColor Green

Write-Host "🎉 Done! All migrations should now be applied.`n" -ForegroundColor Green
