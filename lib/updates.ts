/**
 * Updates/Changelog system - Single source of truth
 * Reads MDX files from /content/updates
 * Serves both marketing (public) and in-app (protected) surfaces
 */

import "server-only";
import { cache } from "react";
import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

const updatesDirectory = path.join(process.cwd(), "content", "updates");

// Zod schema for frontmatter validation
const UpdateFrontmatterSchema = z.object({
  title: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  summary: z.string(),
  audience: z.array(z.enum(["public", "app"])),
  tags: z.array(z.string()).optional().default([]),
  type: z.enum(["shipped", "improved", "fixed", "security"]),
});

export type UpdateType = z.infer<typeof UpdateFrontmatterSchema>["type"];
export type UpdateAudience = "public" | "app";

export type Update = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  audience: UpdateAudience[];
  tags: string[];
  type: UpdateType;
  content: string;
};

/**
 * Get all update files from the updates directory
 */
async function getUpdateFiles(): Promise<string[]> {
  try {
    const files = await fs.readdir(updatesDirectory);
    return files.filter((file) => file.endsWith(".mdx") || file.endsWith(".md"));
  } catch {
    // Directory doesn't exist yet
    return [];
  }
}

/**
 * Parse a single update file
 */
async function parseUpdateFile(filename: string): Promise<Update | null> {
  try {
    const filePath = path.join(updatesDirectory, filename);
    const fileContents = await fs.readFile(filePath, "utf8");
    const { data, content } = matter(fileContents);

    // Validate frontmatter
    const validated = UpdateFrontmatterSchema.parse(data);

    const slug = filename.replace(/\.(mdx?|md)$/, "");

    return {
      slug,
      title: validated.title,
      date: validated.date,
      summary: validated.summary,
      audience: validated.audience,
      tags: validated.tags,
      type: validated.type,
      content: content.trim(),
    };
  } catch {
    console.warn(`[updates] Failed to parse ${filename}`);
    return null;
  }
}

/**
 * Get all updates, sorted by date descending
 */
export const getAllUpdates = cache(
  async (options?: {
    audience?: UpdateAudience;
    limit?: number;
  }): Promise<Update[]> => {
    const files = await getUpdateFiles();
    const updates = await Promise.all(files.map(parseUpdateFile));

    const validUpdates = updates.filter((u): u is Update => u !== null);

    // Filter by audience if specified
    const filtered = options?.audience
      ? validUpdates.filter((u) => u.audience.includes(options.audience!))
      : validUpdates;

    // Sort by date descending
    const sorted = filtered.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Limit if specified
    return options?.limit ? sorted.slice(0, options.limit) : sorted;
  }
);

/**
 * Get latest N updates for a specific audience
 */
export const getLatestUpdates = cache(
  async (options: {
    audience: UpdateAudience;
    limit?: number;
  }): Promise<Update[]> => {
    const allUpdates = await getAllUpdates({ audience: options.audience });
    return allUpdates.slice(0, options.limit || 10);
  }
);

/**
 * Get a single update by slug
 */
export const getUpdateBySlug = cache(
  async (
    slug: string,
    options?: { audience?: UpdateAudience }
  ): Promise<Update | null> => {
    const allUpdates = await getAllUpdates(options);
    return allUpdates.find((u) => u.slug === slug) || null;
  }
);

/**
 * Format date for display
 */
export function formatUpdateDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
