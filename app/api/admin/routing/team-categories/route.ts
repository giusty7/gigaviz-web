import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminWorkspace } from "@/lib/supabase/route";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const mappingItemSchema = z.object({
  team_id: z.string().uuid("Invalid team ID"),
  category_id: z.string().uuid("Invalid category ID"),
  is_active: z.boolean().optional().default(true),
});

const mappingsBodySchema = z.object({
  mapping: mappingItemSchema.optional(),
  mappings: z.array(mappingItemSchema).optional(),
}).refine(
  (d) => d.mapping || (d.mappings && d.mappings.length > 0),
  { message: "Provide 'mapping' or 'mappings'" }
);

type MappingInput = {
  team_id?: unknown;
  category_id?: unknown;
  is_active?: unknown;
};

type TeamRow = { id: string; name: string | null };
type CategoryRow = { id: string; key: string; label: string };

function parseBool(value: unknown) {
  if (value === true || value === false) return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function normalizeMapping(input: MappingInput) {
  const teamId = typeof input.team_id === "string" ? input.team_id : "";
  const categoryId = typeof input.category_id === "string" ? input.category_id : "";
  const isActive = parseBool(input.is_active);
  if (!teamId || !categoryId) return null;
  return {
    team_id: teamId,
    category_id: categoryId,
    is_active: isActive ?? true,
  };
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = await requireAdminWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;

  const { data: teamsRaw, error: teamErr } = await db
    .from("teams")
    .select("id, name")
    .eq("workspace_id", workspaceId);

  if (teamErr) {
    return withCookies(NextResponse.json({ error: teamErr.message }, { status: 500 }));
  }

  const { data: categoriesRaw, error: catErr } = await db
    .from("routing_categories")
    .select("id, key, label")
    .eq("workspace_id", workspaceId);

  if (catErr) {
    return withCookies(NextResponse.json({ error: catErr.message }, { status: 500 }));
  }

  const teams = (teamsRaw ?? []) as TeamRow[];
  const categories = (categoriesRaw ?? []) as CategoryRow[];

  if (teams.length === 0 || categories.length === 0) {
    return withCookies(NextResponse.json({ mappings: [] }));
  }

  const teamIds = teams.map((t) => t.id);
  const categoryIds = categories.map((c) => c.id);

  const { data: mappingsRaw, error: mapErr } = await db
    .from("team_categories")
    .select("id, team_id, category_id, is_active")
    .in("team_id", teamIds)
    .in("category_id", categoryIds);

  if (mapErr) {
    return withCookies(NextResponse.json({ error: mapErr.message }, { status: 500 }));
  }

  const teamById = Object.fromEntries(teams.map((t) => [t.id, t]));
  const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]));

  const mappings = (mappingsRaw ?? []).map((row: {
    id: string;
    team_id: string;
    category_id: string;
    is_active: boolean;
  }) => ({
    id: row.id,
    teamId: row.team_id,
    categoryId: row.category_id,
    isActive: row.is_active,
    teamName: teamById[row.team_id]?.name ?? null,
    categoryKey: categoryById[row.category_id]?.key ?? null,
    categoryLabel: categoryById[row.category_id]?.label ?? null,
  }));

  return withCookies(NextResponse.json({ mappings }));
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = await requireAdminWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const raw = await req.json();
  const body = mappingsBodySchema.parse(raw);

  const list = body.mappings ?? (body.mapping ? [body.mapping] : []);

  const { data: teamsRaw, error: teamErr } = await db
    .from("teams")
    .select("id, name")
    .eq("workspace_id", workspaceId);

  if (teamErr) {
    return withCookies(NextResponse.json({ error: teamErr.message }, { status: 500 }));
  }

  const { data: categoriesRaw, error: catErr } = await db
    .from("routing_categories")
    .select("id, key, label")
    .eq("workspace_id", workspaceId);

  if (catErr) {
    return withCookies(NextResponse.json({ error: catErr.message }, { status: 500 }));
  }

  const teams = (teamsRaw ?? []) as TeamRow[];
  const categories = (categoriesRaw ?? []) as CategoryRow[];
  const teamIds = new Set(teams.map((t) => t.id));
  const categoryIds = new Set(categories.map((c) => c.id));

  const payload = list
    .map(normalizeMapping)
    .filter(
      (item): item is { team_id: string; category_id: string; is_active: boolean } => {
        if (!item) return false;
        return teamIds.has(item.team_id) && categoryIds.has(item.category_id);
      }
    );

  if (payload.length === 0) {
    return withCookies(NextResponse.json({ error: "invalid_mappings" }, { status: 400 }));
  }

  const { data: mappingsRaw, error } = await db
    .from("team_categories")
    .upsert(payload, { onConflict: "team_id,category_id" })
    .select("id, team_id, category_id, is_active");

  if (error) {
    return withCookies(NextResponse.json({ error: error.message }, { status: 500 }));
  }

  const teamById = Object.fromEntries(teams.map((t) => [t.id, t]));
  const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]));

  const mappings = (mappingsRaw ?? []).map((row: {
    id: string;
    team_id: string;
    category_id: string;
    is_active: boolean;
  }) => ({
    id: row.id,
    teamId: row.team_id,
    categoryId: row.category_id,
    isActive: row.is_active,
    teamName: teamById[row.team_id]?.name ?? null,
    categoryKey: categoryById[row.category_id]?.key ?? null,
    categoryLabel: categoryById[row.category_id]?.label ?? null,
  }));

  return withCookies(NextResponse.json({ mappings }));
});
