/**
 * Automated withErrorHandler rollout script.
 * Wraps all API route exported functions with withErrorHandler.
 *
 * Usage: node scripts/wrap-routes.js
 */

const fs = require("fs");
const path = require("path");

const BASE = path.resolve(__dirname, "..");
const API_DIR = path.join(BASE, "app", "api");

// Routes to skip (webhooks with signature verification, auth callbacks, SSE streams)
const SKIP_PATHS = [
  "auth/callback/route.ts",
  "meta/oauth/callback/route.ts",
  "webhooks/meta/whatsapp/route.ts",
  "webhooks/whatsapp/route.ts",
  "webhooks/outbox-trigger/route.ts",
  "whatsapp/webhook/route.ts",
  "meta/instagram/webhook/route.ts",
  "meta/messenger/webhook/route.ts",
  "meta/data-deletion/route.ts",
  "meta/deauthorize/route.ts",
  "meta/webhooks/route.ts",
  "helper/conversations/[id]/messages/stream/route.ts",
];

function shouldSkip(filePath) {
  const rel = path.relative(API_DIR, filePath).replace(/\\/g, "/");
  return SKIP_PATHS.includes(rel);
}

function findRouteFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...findRouteFiles(full));
    else if (entry.name === "route.ts") files.push(full);
  }
  return files;
}

/** Skip over a string/template literal starting at pos (the opening quote). Returns pos after closing quote. */
function skipStringLiteral(text, pos) {
  const quote = text[pos];
  let i = pos + 1;

  if (quote === "`") {
    while (i < text.length) {
      if (text[i] === "\\" && i + 1 < text.length) { i += 2; continue; }
      if (text[i] === "`") return i + 1;
      if (text[i] === "$" && i + 1 < text.length && text[i + 1] === "{") {
        i += 2;
        let d = 1;
        while (i < text.length && d > 0) {
          if (text[i] === '"' || text[i] === "'" || text[i] === "`") {
            i = skipStringLiteral(text, i);
            continue;
          }
          if (text[i] === "{") d++;
          else if (text[i] === "}") d--;
          if (d > 0) i++;
        }
        if (i < text.length) i++;
        continue;
      }
      i++;
    }
    return i;
  }

  while (i < text.length) {
    if (text[i] === "\\" && i + 1 < text.length) { i += 2; continue; }
    if (text[i] === quote) return i + 1;
    i++;
  }
  return i;
}

/** Find matching closing brace for the opening brace at openPos */
function findClosingBrace(text, openPos) {
  let depth = 1;
  let i = openPos + 1;

  while (i < text.length && depth > 0) {
    const c = text[i];
    if (c === '"' || c === "'" || c === "`") { i = skipStringLiteral(text, i); continue; }
    if (c === "/" && i + 1 < text.length && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      i++; continue;
    }
    if (c === "/" && i + 1 < text.length && text[i + 1] === "*") {
      i += 2;
      while (i + 1 < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i += 2; continue;
    }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return i; }
    i++;
  }
  return -1;
}

/** Find matching closing paren for the opening paren at openPos */
function findClosingParen(text, openPos) {
  let depth = 1;
  let i = openPos + 1;

  while (i < text.length && depth > 0) {
    const c = text[i];
    if (c === '"' || c === "'" || c === "`") { i = skipStringLiteral(text, i); continue; }
    if (c === "/" && i + 1 < text.length && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      i++; continue;
    }
    if (c === "/" && i + 1 < text.length && text[i + 1] === "*") {
      i += 2;
      while (i + 1 < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i += 2; continue;
    }
    if (c === "(") depth++;
    else if (c === ")") { depth--; if (depth === 0) return i; }
    i++;
  }
  return -1;
}

function transformFile(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");

  if (content.includes("withErrorHandler")) {
    return { status: "already" };
  }

  // Find all exported function declarations: export [async] function METHOD(
  const pattern = /export\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*\(/g;
  const matches = [];
  let m;
  while ((m = pattern.exec(content)) !== null) {
    matches.push({
      start: m.index,
      isAsync: !!m[1],
      method: m[2],
      openParen: m.index + m[0].length - 1,
    });
  }

  if (matches.length === 0) {
    return { status: "no-funcs" };
  }

  // Process from last to first (preserve positions)
  matches.reverse();

  const wrappedMethods = [];

  for (const match of matches) {
    const closeParen = findClosingParen(content, match.openParen);
    if (closeParen === -1) continue;

    // Find opening brace of function body (skip return type annotation)
    let openBrace = -1;
    for (let i = closeParen + 1; i < content.length; i++) {
      if (content[i] === "{") { openBrace = i; break; }
    }
    if (openBrace === -1) continue;

    const closeBrace = findClosingBrace(content, openBrace);
    if (closeBrace === -1) continue;

    // Extract parameter list
    const params = content.substring(match.openParen + 1, closeParen);

    // Extract function body (between { and })
    const body = content.substring(openBrace + 1, closeBrace);

    // Build replacement: export const METHOD = withErrorHandler(async (params) => { body });
    const replacement = `export const ${match.method} = withErrorHandler(async (${params}) => {${body}});`;

    content = content.substring(0, match.start) + replacement + content.substring(closeBrace + 1);
    wrappedMethods.push(match.method);
  }

  if (wrappedMethods.length === 0) {
    return { status: "no-transform" };
  }

  // Add import statement after the last import in the file
  const importLine = 'import { withErrorHandler } from "@/lib/api/with-error-handler";';
  const lines = content.split("\n");
  let insertAfter = -1;

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i];
    if (
      t.includes(' from "') || t.includes(" from '") ||
      t.includes('\tfrom "') || t.includes("\tfrom '") ||
      t.trimStart().startsWith('import "') || t.trimStart().startsWith("import '")
    ) {
      insertAfter = i;
    }
  }

  if (insertAfter >= 0) {
    lines.splice(insertAfter + 1, 0, importLine);
  } else {
    lines.unshift(importLine);
  }

  content = lines.join("\n");

  fs.writeFileSync(filePath, content, "utf-8");
  return { status: "ok", methods: wrappedMethods.reverse() };
}

// === MAIN ===
const files = findRouteFiles(API_DIR);
console.log(`Found ${files.length} route files\n`);

let wrapCount = 0;
let skipCount = 0;
let errCount = 0;

for (const file of files) {
  const rel = path.relative(API_DIR, file).replace(/\\/g, "/");

  if (shouldSkip(file)) {
    console.log(`SKIP  ${rel}`);
    skipCount++;
    continue;
  }

  try {
    const result = transformFile(file);
    if (result.status === "ok") {
      console.log(`✓ [${result.methods.join(",")}] ${rel}`);
      wrapCount++;
    } else {
      console.log(`-  (${result.status}) ${rel}`);
      skipCount++;
    }
  } catch (err) {
    console.error(`✗ ERROR ${rel}: ${err.message}`);
    errCount++;
  }
}

console.log(`\n=== SUMMARY ===`);
console.log(`Wrapped: ${wrapCount}`);
console.log(`Skipped: ${skipCount}`);
console.log(`Errors:  ${errCount}`);
