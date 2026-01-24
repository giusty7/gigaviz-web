# VS Code TypeScript Error Fix

## Problem
VS Code menampilkan error:
```
Cannot find module '@/components/meta-hub/MetaHubSettingsClient' or its corresponding type declarations. ts(2307)
```

Padahal:
- ✅ File benar-benar ada
- ✅ `npm run typecheck` berhasil tanpa error
- ✅ `npm run build` berhasil compile
- ✅ Path import sudah benar

## Root Cause
Ini adalah **cache issue** dari VS Code TypeScript Language Server. File baru yang dibuat tidak ter-detect sampai server di-reload.

## Quick Fix (Pilih salah satu)

### Option 1: Restart TS Server (Tercepat)
1. Tekan `Ctrl+Shift+P` (Command Palette)
2. Ketik: `TypeScript: Restart TS Server`
3. Enter

### Option 2: Reload Window
1. Tekan `Ctrl+Shift+P`
2. Ketik: `Developer: Reload Window`
3. Enter

### Option 3: Run Script (Otomatis)
```powershell
.\scripts\fix-vscode-cache.ps1
```
Kemudian restart TS Server dengan Option 1.

### Option 4: Close & Reopen VS Code
Close VS Code sepenuhnya, lalu buka lagi.

## Prevention
Untuk file baru di project besar, VS Code TypeScript server kadang perlu waktu untuk indexing. Tunggu beberapa detik setelah save file baru sebelum import.

## Verification
Setelah reload, error harus hilang. Kalau masih ada:

1. Cek apakah file benar-benar ada:
```powershell
Get-Item components\meta-hub\MetaHubSettingsClient.tsx
```

2. Verify build masih OK:
```powershell
npm run typecheck
npm run build
```

Jika kedua command di atas berhasil, maka error di VS Code adalah false positive dan aman diabaikan.

## Note
Error ini **TIDAK** mempengaruhi:
- ❌ Production build
- ❌ Vercel deployment
- ❌ Runtime aplikasi

Ini murni visual error di VS Code editor.
