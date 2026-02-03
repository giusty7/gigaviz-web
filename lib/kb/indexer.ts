import { createHash } from "crypto";
import { readFile, readdir, stat } from "fs/promises";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { load } from "cheerio";
import type { AnyNode, Element } from "domhandler";
import { XMLParser } from "fast-xml-parser";
import pLimit from "p-limit";
import { generateEmbedding } from "@/lib/helper/embeddings";
import type { IndexerConfig } from "./env";

export type SourceKind = "page" | "doc" | "release" | "faq" | "suggestion";

export type IndexerStats = {
  pagesFetched: number;
  pagesSkipped: number;
  docsIngested: number;
  chunksWritten: number;
  unchangedSources: number;
};

export class KBIndexer {
  private config: IndexerConfig;
  private supabase: SupabaseClient;
  private stats: IndexerStats = {
    pagesFetched: 0,
    pagesSkipped: 0,
    docsIngested: 0,
    chunksWritten: 0,
    unchangedSources: 0,
  };
  private runId: string | null = null;

  constructor(config: IndexerConfig) {
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  async run(mode: "all" | "docs" | "web") {
    await this.recordRun("running");
    try {
      if (mode === "docs") {
        await this.runDocs();
      } else if (mode === "web") {
        await this.runWeb();
      } else {
        await this.runDocs();
        await this.runWeb();
      }
      await this.recordRun("success");
    } catch (err) {
      await this.recordRun("failed", err instanceof Error ? err.message : String(err));
      throw err;
    }
  }

  async runAll() {
    return this.run("all");
  }

  async runDocs() {
    const roots = ["docs/knowledge", "docs"];
    const files = await this.collectMarkdownFiles(roots);
    for (const file of files) {
      const content = await readFile(file, "utf-8");
      const slug = this.slugFromPath(file);
      await this.upsertSource({
        slug,
        title: path.basename(file),
        url: null,
        kind: "doc",
        workspaceId: null,
        content,
      });
      this.stats.docsIngested += 1;
    }
  }

  async runWeb() {
    const urls = await this.collectSiteUrls();
    const limit = pLimit(5);
    const tasks = Array.from(urls).map((url) =>
      limit(async () => {
        if (!this.isAllowedUrl(url)) {
          this.stats.pagesSkipped += 1;
          return;
        }

        const html = await this.fetchPage(url);
        if (!html) {
          this.stats.pagesSkipped += 1;
          return;
        }

        const content = this.extractMainText(html);
        if (!content.trim()) {
          this.stats.pagesSkipped += 1;
          return;
        }

        const slug = this.slugFromUrl(url);
        await this.upsertSource({
          slug,
          title: slug,
          url,
          kind: "page",
          workspaceId: null,
          content,
        });
        this.stats.pagesFetched += 1;
      })
    );

    await Promise.all(tasks);
  }

  getStats(): IndexerStats {
    return { ...this.stats };
  }

  private async recordRun(status: "running" | "success" | "failed", error?: string) {
    if (status === "running") {
      const { data } = await this.supabase
        .from("gv_kb_index_runs")
        .insert({ status, stats: this.stats })
        .select("id")
        .single();
      this.runId = data?.id ?? null;
      return;
    }

    if (this.runId) {
      await this.supabase
        .from("gv_kb_index_runs")
        .update({ status, stats: this.stats, ended_at: new Date().toISOString(), error: error ?? null })
        .eq("id", this.runId);
    } else {
      await this.supabase
        .from("gv_kb_index_runs")
        .insert({ status, stats: this.stats, ended_at: new Date().toISOString(), error: error ?? null });
    }
  }

  private async collectMarkdownFiles(roots: string[]): Promise<string[]> {
    const files: string[] = [];
    const seen = new Set<string>();

    const walk = async (dir: string) => {
      let entries: import("fs").Dirent[];
      try {
        entries = await readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (seen.has(full)) continue;
        seen.add(full);
        try {
          if (entry.isDirectory()) {
            await walk(full);
          } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
            // double-check in case of symlink
            const st = await stat(full);
            if (st.isFile()) files.push(full);
          }
        } catch {
          continue;
        }
      }
    };

    for (const root of roots) {
      await walk(root);
    }

    return files;
  }

  private async collectSiteUrls(): Promise<Set<string>> {
    const urls = new Set<string>();
    const add = (u: string) => {
      try {
        const parsed = new URL(u);
        if (parsed.protocol === "https:" && this.isAllowedDomain(parsed.hostname)) {
          urls.add(parsed.toString());
        }
      } catch {
        /* ignore */
      }
    };

    for (const seed of this.config.seedUrls) add(seed);

    const parser = new XMLParser({ ignoreAttributes: false });
    for (const sitemapUrl of this.config.sitemapUrls) {
      try {
        const res = await fetch(sitemapUrl, { headers: { "User-Agent": this.config.userAgent } });
        if (!res.ok) continue;
        const xml = await res.text();
        const parsed = parser.parse(xml) as { urlset?: { url?: Array<{ loc?: string }> } };
        const locs = parsed.urlset?.url ?? [];
        for (const entry of locs) {
          if (entry?.loc) add(entry.loc);
        }
      } catch {
        continue;
      }
    }

    return new Set(Array.from(urls).slice(0, this.config.maxPagesPerRun));
  }

  private isAllowedDomain(hostname: string): boolean {
    return this.config.allowedDomains.some((d) => hostname === d || hostname.endsWith(`.${d}`));
  }

  private isBlockedPath(pathname: string): boolean {
    return this.config.blockedPathPrefixes.some((prefix) => pathname.startsWith(prefix));
  }

  private hasBlockedQuery(url: URL): boolean {
    for (const [key] of url.searchParams) {
      if (this.config.blockedQueryKeys.includes(key.toLowerCase())) return true;
    }
    return false;
  }

  private isAllowedUrl(raw: string): boolean {
    try {
      const url = new URL(raw);
      if (url.protocol !== "https:") return false;
      if (!this.isAllowedDomain(url.hostname)) return false;
      if (this.isBlockedPath(url.pathname)) return false;
      if (this.hasBlockedQuery(url)) return false;
      return true;
    } catch {
      return false;
    }
  }

  private async fetchPage(url: string): Promise<string | null> {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": this.config.userAgent },
        redirect: "follow",
      });
      if (!res.ok) return null;
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html")) return null;
      return await res.text();
    } catch {
      return null;
    }
  }

  private extractMainText(html: string): string {
    const $ = load(html);
    $("script,style,noscript,header,footer,nav,form").remove();
    const main = $("main");
    const root = main.length ? main : $("body");
    const textParts: string[] = [];
    root.find("h1,h2,h3,h4,p,li").each((_, el: AnyNode) => {
      if (!this.isElementNode(el)) return;
      const text = $(el).text().trim();
      if (text) textParts.push(text);
    });
    return textParts.join("\n\n");
  }

  private isElementNode(node: AnyNode): node is Element {
    return (node as Element).type === "tag";
  }

  private chunkText(content: string): string[] {
    const max = this.config.chunkMaxChars;
    const overlap = this.config.chunkOverlapChars;
    const chunks: string[] = [];
    let i = 0;
    while (i < content.length) {
      const end = Math.min(content.length, i + max);
      chunks.push(content.slice(i, end));
      if (end === content.length) break;
      i = end - overlap;
      if (i < 0) i = 0;
    }
    return chunks;
  }

  private hashContent(content: string): string {
    return createHash("sha256").update(content).digest("hex");
  }

  private async embedText(text: string): Promise<number[]> {
    try {
      return await generateEmbedding(text);
    } catch (error) {
      console.error("Embedding generation failed:", error);
      // Fallback to zero-vector if API fails
      return Array(this.config.embedDim).fill(0);
    }
  }

  private async upsertSource(params: {
    slug: string;
    title: string | null;
    url: string | null;
    kind: SourceKind;
    workspaceId: string | null;
    content: string;
  }) {
    const contentHash = this.hashContent(params.content);
    const { data: existing } = await this.supabase
      .from("gv_kb_sources")
      .select("id, content_hash")
      .eq("slug", params.slug)
      .is("workspace_id", params.workspaceId)
      .maybeSingle();

    if (existing?.content_hash === contentHash) {
      this.stats.unchangedSources += 1;
      return;
    }

    let sourceId = existing?.id;
    if (existing) {
      await this.supabase
        .from("gv_kb_sources")
        .update({ content_hash: contentHash, title: params.title, url: params.url, kind: params.kind })
        .eq("id", existing.id);
    } else {
      const insertRes = await this.supabase
        .from("gv_kb_sources")
        .insert({
          slug: params.slug,
          title: params.title,
          url: params.url,
          kind: params.kind,
          workspace_id: params.workspaceId,
          content_hash: contentHash,
          is_public: params.workspaceId === null,
        })
        .select("id")
        .single();
      if (insertRes.data?.id) sourceId = insertRes.data.id;
    }

    if (!sourceId) return;

    // Replace chunks when content changes
    await this.supabase.from("gv_kb_chunks").delete().eq("source_id", sourceId);

    const chunks = this.chunkText(params.content);
    let index = 0;
    const rows = [] as Array<{
      source_id: string;
      workspace_id: string | null;
      chunk_index: number;
      content: string;
      embedding: number[];
    }>;

    for (const chunk of chunks) {
      const embedding = await this.embedText(chunk);
      rows.push({
        source_id: sourceId,
        workspace_id: params.workspaceId,
        chunk_index: index,
        content: chunk,
        embedding,
      });
      index += 1;
    }

    if (rows.length > 0) {
      await this.supabase.from("gv_kb_chunks").insert(rows);
      this.stats.chunksWritten += rows.length;
    }
  }

  private slugFromPath(filePath: string): string {
    const rel = filePath.replace(/^docs\//, "");
    const noExt = rel.replace(/\.md$/i, "");
    return noExt.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
  }

  private slugFromUrl(raw: string): string {
    try {
      const url = new URL(raw);
      const pathSlug = url.pathname.replace(/\/+$/, "").replace(/^\//, "");
      return (pathSlug || "home").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
    } catch {
      return "unknown";
    }
  }
}
