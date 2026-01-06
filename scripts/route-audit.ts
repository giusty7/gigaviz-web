import crypto from "crypto";
import fs from "fs";
import path from "path";

type AuditEntry = {
  url: string;
  finalUrl: string;
  status: number;
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  h1: string | null;
  contentHash: string | null;
};

const projectRoot = path.resolve(__dirname, "..");
const auditDir = path.join(projectRoot, "audit");
const navPath = path.join(auditDir, "nav-urls.json");
const reachablePath = path.join(auditDir, "reachable-urls.json");
const reportPath = path.join(auditDir, "audit-report.md");

const baseUrl =
  process.env.AUDIT_BASE_URL ||
  process.env.APP_BASE_URL ||
  "http://localhost:3000";
const baseOrigin = new URL(baseUrl).origin;

const MAX_REDIRECTS = 6;
const HTML_MIME = "text/html";

function normalizePath(rawPath: string) {
  if (!rawPath) return "/";
  const url = rawPath.split("#")[0].split("?")[0] || "/";
  if (url === "/") return "/";
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function toInternalPath(href: string): string | null {
  const trimmed = href.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("#")) return null;
  if (trimmed.startsWith("mailto:")) return null;
  if (trimmed.startsWith("tel:")) return null;
  if (trimmed.startsWith("javascript:")) return null;

  try {
    const url = trimmed.startsWith("http")
      ? new URL(trimmed)
      : new URL(trimmed, baseOrigin);
    if (url.origin !== baseOrigin) return null;
    return normalizePath(url.pathname);
  } catch {
    return null;
  }
}

function stripHtml(raw: string) {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|div|li|br|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseAttributes(tag: string) {
  const attrs: Record<string, string> = {};
  const regex = /([a-zA-Z:-]+)\s*=\s*["']([^"']*)["']/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(tag))) {
    attrs[match[1].toLowerCase()] = match[2].trim();
  }
  return attrs;
}

function extractMetaDescription(html: string) {
  const metaTags = html.match(/<meta[^>]*>/gi) || [];
  for (const tag of metaTags) {
    const attrs = parseAttributes(tag);
    if (attrs.name === "description" && attrs.content) {
      return attrs.content;
    }
  }
  return null;
}

function extractCanonical(html: string) {
  const linkTags = html.match(/<link[^>]*>/gi) || [];
  for (const tag of linkTags) {
    const attrs = parseAttributes(tag);
    if (attrs.rel === "canonical" && attrs.href) {
      return attrs.href;
    }
  }
  return null;
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripHtml(match[1]) : null;
}

function extractH1(html: string) {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return match ? stripHtml(match[1]) : null;
}

function extractMainText(html: string) {
  const match = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (match) return stripHtml(match[1]);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) return stripHtml(bodyMatch[1]);
  return stripHtml(html);
}

function hashContent(text: string | null) {
  if (!text) return null;
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

async function fetchWithRedirects(urlPath: string) {
  const chain: string[] = [];
  let current = new URL(urlPath, baseOrigin).toString();
  let status = 0;
  let body = "";

  for (let i = 0; i <= MAX_REDIRECTS; i += 1) {
    let response: Response;
    try {
      response = await fetch(current, { redirect: "manual" });
    } catch (error) {
      return { status: 0, finalUrl: current, chain, body: "", error };
    }

    status = response.status;
    const location = response.headers.get("location");
    const isRedirect = status >= 300 && status < 400 && location;

    if (isRedirect) {
      const nextUrl = new URL(location, current).toString();
      chain.push(nextUrl);
      current = nextUrl;
      continue;
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes(HTML_MIME)) {
      body = await response.text();
    }
    return { status, finalUrl: current, chain, body };
  }

  return { status, finalUrl: current, chain, body };
}

function extractLinks(html: string) {
  const links = new Set<string>();
  const regex = /<a[^>]+href=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    const href = match[1];
    const path = toInternalPath(href);
    if (path) links.add(path);
  }
  return Array.from(links);
}

function loadNavUrls() {
  if (!fs.existsSync(navPath)) {
    throw new Error(`Missing nav URLs file at ${navPath}`);
  }
  const raw = fs.readFileSync(navPath, "utf8");
  const parsed = JSON.parse(raw) as string[];
  const normalized = parsed.map((entry) => normalizePath(entry));
  if (!normalized.includes("/")) normalized.unshift("/");
  return Array.from(new Set(normalized));
}

function writeJson(target: string, data: unknown) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function writeReport(lines: string[]) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, lines.join("\n") + "\n", "utf8");
}

function collectAppRoutes() {
  const appDir = path.join(projectRoot, "app");
  const routes: string[] = [];

  function walk(dir: string, segments: string[]) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "api") continue;
        if (entry.name.startsWith(".")) continue;
        if (entry.name.startsWith("@")) continue;
        const nextSegments = entry.name.startsWith("(") && entry.name.endsWith(")")
          ? segments
          : [...segments, entry.name];
        walk(fullPath, nextSegments);
      } else if (entry.isFile()) {
        if (!/^page\.(t|j)sx?$/.test(entry.name)) continue;
        const route = "/" + segments.join("/");
        const normalized = normalizePath(route);
        routes.push(normalized);
      }
    }
  }

  if (fs.existsSync(appDir)) {
    walk(appDir, []);
  }

  return Array.from(new Set(routes)).sort();
}

function patternToRegex(route: string) {
  const escaped = route
    .split("/")
    .map((part) => {
      if (part.startsWith("[[...") && part.endsWith("]]")) return "(.*)?";
      if (part.startsWith("[...") && part.endsWith("]")) return ".+";
      if (part.startsWith("[") && part.endsWith("]")) return "[^/]+";
      return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
  return new RegExp(`^${escaped}$`);
}

function findOrphans(fsRoutes: string[], navUrls: string[], reachableUrls: string[]) {
  const navSet = new Set(navUrls.map((entry) => normalizePath(entry)));
  const reachableSet = new Set(reachableUrls.map((entry) => normalizePath(entry)));
  const excludedPrefixes = ["/admin", "/dashboard", "/auth"];
  const reachableByPattern = (pattern: string) => {
    const regex = patternToRegex(pattern);
    for (const pathItem of reachableSet) {
      if (regex.test(pathItem)) return true;
    }
    return false;
  };

  return fsRoutes.filter((route) => {
    if (excludedPrefixes.some((prefix) => route === prefix || route.startsWith(prefix + "/"))) {
      return false;
    }
    if (navSet.has(route)) return false;
    if (reachableSet.has(route)) return false;
    if (route.includes("[") && reachableByPattern(route)) return false;
    return true;
  });
}

async function main() {
  const navUrls = loadNavUrls();
  const queue: string[] = [...navUrls];
  const seen = new Set<string>();
  const results: AuditEntry[] = [];
  const reachablePaths: string[] = [];
  const redirectChains: Array<{ url: string; finalUrl: string; chain: string[] }> = [];

  while (queue.length > 0) {
    const next = queue.shift();
    if (!next) continue;
    const normalized = normalizePath(next);
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    const { status, finalUrl, chain, body } = await fetchWithRedirects(normalized);
    const finalPath = normalizePath(new URL(finalUrl).pathname);

    const title = body ? extractTitle(body) : null;
    const metaDescription = body ? extractMetaDescription(body) : null;
    const canonical = body ? extractCanonical(body) : null;
    const h1 = body ? extractH1(body) : null;
    const mainText = body ? extractMainText(body) : null;
    const contentHash = hashContent(mainText);

    if (chain.length > 0) {
      redirectChains.push({ url: normalized, finalUrl, chain });
    }

    results.push({
      url: normalized,
      finalUrl: finalPath,
      status,
      title,
      metaDescription,
      canonical,
      h1,
      contentHash,
    });

    reachablePaths.push(normalized);
    reachablePaths.push(finalPath);

    if (status >= 200 && status < 400 && body) {
      const links = extractLinks(body);
      for (const link of links) {
        if (!seen.has(link)) queue.push(link);
      }
    }
  }

  writeJson(reachablePath, results);

  const broken = results.filter((entry) => entry.status >= 400 || entry.status === 0);
  const missing = results.filter((entry) => entry.status === 404);
  const canonicalGroups = new Map<string, string[]>();
  const hashGroups = new Map<string, string[]>();

  for (const entry of results) {
    if (entry.canonical) {
      const key = entry.canonical;
      const list = canonicalGroups.get(key) || [];
      list.push(entry.url);
      canonicalGroups.set(key, list);
    }
    if (entry.contentHash) {
      const list = hashGroups.get(entry.contentHash) || [];
      list.push(entry.url);
      hashGroups.set(entry.contentHash, list);
    }
  }

  const canonicalDuplicates = Array.from(canonicalGroups.entries()).filter(
    ([, urls]) => urls.length > 1
  );
  const hashDuplicates = Array.from(hashGroups.entries()).filter(([, urls]) => urls.length > 1);

  const fsRoutes = collectAppRoutes();
  const orphans = findOrphans(fsRoutes, navUrls, reachablePaths);

  const reportLines: string[] = [
    "# Route Audit Report",
    "",
    `Base URL: ${baseOrigin}`,
    "",
    "A) Broken links (status >= 400)",
    broken.length === 0
      ? "- None"
      : broken.map((entry) => `- ${entry.url} -> ${entry.status}`).join("\n"),
    "",
    "B) Missing pages (404)",
    missing.length === 0
      ? "- None"
      : missing.map((entry) => `- ${entry.url}`).join("\n"),
    "",
    "C) Redirect chains",
    redirectChains.length === 0
      ? "- None"
      : redirectChains
          .map((entry) => `- ${entry.url} -> ${entry.chain.join(" -> ")}`)
          .join("\n"),
    "",
    "D) Duplicate candidates",
    canonicalDuplicates.length === 0 && hashDuplicates.length === 0
      ? "- None"
      : [
          canonicalDuplicates.length
            ? "Canonical duplicates:\n" +
              canonicalDuplicates.map(([key, urls]) => `- ${key}: ${urls.join(", ")}`).join("\n")
            : "Canonical duplicates:\n- None",
          hashDuplicates.length
            ? "Content hash duplicates:\n" +
              hashDuplicates.map(([key, urls]) => `- ${key}: ${urls.join(", ")}`).join("\n")
            : "Content hash duplicates:\n- None",
        ].join("\n"),
    "",
    "E) Orphan routes (fs only)",
    orphans.length === 0 ? "- None" : orphans.map((route) => `- ${route}`).join("\n"),
  ];

  writeReport(reportLines);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
