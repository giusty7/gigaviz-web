import { cache } from "react";
import { promises as fs } from "node:fs";
import path from "node:path";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  published: boolean;
  content: string;
};

type FrontmatterData = {
  title?: string;
  description?: string;
  date?: string;
  tags?: string[];
  published?: boolean;
};

const blogDirectory = path.join(process.cwd(), "content", "blog");

function stripQuotes(value: string) {
  return value.replace(/^["']|["']$/g, "");
}

function parseTags(value: string) {
  if (!value) return [];
  const cleaned = stripQuotes(value);
  if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
    try {
      const normalized = cleaned.replace(/'/g, "\"");
      const parsed = JSON.parse(normalized);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // fall through to comma parsing
    }
  }
  return cleaned
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseFrontmatter(raw: string): { data: FrontmatterData; content: string } {
  if (!raw.startsWith("---")) {
    return { data: {}, content: raw.trim() };
  }

  const end = raw.indexOf("\n---", 3);
  if (end === -1) {
    return { data: {}, content: raw.trim() };
  }

  const frontmatterRaw = raw.slice(3, end).trim();
  const content = raw.slice(end + 4).trimStart();
  const data: FrontmatterData = {};

  frontmatterRaw.split("\n").forEach((line) => {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) return;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!value) return;

    if (key === "published") {
      data.published = value.toLowerCase() === "true";
      return;
    }

    if (key === "tags") {
      data.tags = parseTags(value);
      return;
    }

    if (key === "title") {
      data.title = stripQuotes(value);
      return;
    }

    if (key === "description") {
      data.description = stripQuotes(value);
      return;
    }

    if (key === "date") {
      data.date = stripQuotes(value);
    }
  });

  return { data, content };
}

export const getBlogPosts = cache(async () => {
  let files: string[] = [];
  try {
    files = await fs.readdir(blogDirectory);
  } catch {
    return [] as BlogPost[];
  }

  const posts = await Promise.all(
    files
      .filter((file) => file.endsWith(".mdx"))
      .map(async (file) => {
        const slug = file.replace(/\.mdx$/, "");
        const raw = await fs.readFile(path.join(blogDirectory, file), "utf8");
        const { data, content } = parseFrontmatter(raw);

        return {
          slug,
          title: data.title ?? slug,
          description: data.description ?? "",
          date: data.date ?? "",
          tags: data.tags ?? [],
          published: data.published ?? false,
          content,
        } as BlogPost;
      })
  );

  return posts.sort((a, b) => {
    const left = Date.parse(a.date || "");
    const right = Date.parse(b.date || "");
    return right - left;
  });
});

export const getPublishedPosts = cache(async () => {
  const posts = await getBlogPosts();
  return posts.filter((post) => post.published);
});

export const getPostBySlug = cache(async (slug: string) => {
  const posts = await getBlogPosts();
  return posts.find((post) => post.slug === slug);
});

export function formatBlogDate(date: string) {
  if (!date) return "";
  const formatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
  return formatter.format(new Date(date));
}
