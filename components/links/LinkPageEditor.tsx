"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Save,
  Eye,
  ExternalLink,
  Trash2,
  MessageCircle,
  Link2,
  ShoppingBag,
  Type,
  Share2,
  Globe,
  Loader2,
  ChevronDown,
  ChevronUp,
  Copy,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LinkItem } from "@/types/links";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";


type PageData = {
  id: string;
  title: string;
  slug: string;
  bio: string | null;
  avatar_url: string | null;
  theme: Record<string, string> | null;
  seo_title: string | null;
  seo_description: string | null;
  published: boolean;
};

interface LinkPageEditorProps {
  workspaceSlug: string;
  page: PageData;
  items: LinkItem[];
}

const LINK_TYPE_META: Record<string, { icon: typeof Link2; label: string; color: string }> = {
  url: { icon: Globe, label: "URL", color: "text-blue-400" },
  whatsapp: { icon: MessageCircle, label: "WhatsApp", color: "text-emerald-400" },
  product: { icon: ShoppingBag, label: "Product", color: "text-amber-400" },
  heading: { icon: Type, label: "Heading", color: "text-[#f5f5dc]/60" },
  social: { icon: Share2, label: "Social", color: "text-purple-400" },
};

export function LinkPageEditor({ workspaceSlug, page: initialPage, items: initialItems }: LinkPageEditorProps) {
  const t = useTranslations("linksUI");
  const base = `/${workspaceSlug}/links`;
  const apiBase = `/api/links/pages/${initialPage.id}?workspace_id=${workspaceSlug}`;
  const publicBase = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = `${publicBase}/l/${initialPage.slug}`;

  const [page, setPage] = useState(initialPage);
  const [items, setItems] = useState<LinkItem[]>(initialItems);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editSettings, setEditSettings] = useState(false);
  const [addType, setAddType] = useState<string | null>(null);

  /* ── Page settings save ── */
  const savePage = useCallback(
    async (patch: Partial<PageData>) => {
      setSaving(true);
      try {
        const res = await fetch(apiBase, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const json = await res.json();
        if (json.ok) setPage((p) => ({ ...p, ...json.page }));
      } catch { /* noop */ }
      setSaving(false);
    },
    [apiBase]
  );

  /* ── Toggle publish ── */
  const togglePublish = () => savePage({ published: !page.published });

  /* ── Add item ── */
  const addItem = async (type: string) => {
    setAdding(true);
    const defaults: Record<string, Record<string, unknown>> = {
      url: { title: "My Link", url: "https://", link_type: "url" },
      whatsapp: { title: "Chat on WhatsApp", link_type: "whatsapp", metadata: { phone: "+62", message: "Hi! I found you via your bio page" } },
      product: { title: "Product", link_type: "product", metadata: { price: 0, currency: "IDR" } },
      heading: { title: "Section Title", link_type: "heading" },
      social: { title: "Instagram", link_type: "social", url: "https://instagram.com/", metadata: { platform: "instagram" } },
    };

    try {
      const res = await fetch(`/api/links/pages/${page.id}/items?workspace_id=${workspaceSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defaults[type] ?? defaults.url),
      });
      const json = await res.json();
      if (json.ok) setItems((prev) => [...prev, json.item]);
    } catch { /* noop */ }
    setAdding(false);
    setAddType(null);
  };

  /* ── Update item ── */
  const updateItem = async (itemId: string, patch: Partial<LinkItem>) => {
    try {
      const res = await fetch(`/api/links/items/${itemId}?workspace_id=${workspaceSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (json.ok) setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, ...json.item } : i)));
    } catch { /* noop */ }
  };

  /* ── Delete item ── */
  const deleteItem = async (itemId: string) => {
    try {
      await fetch(`/api/links/items/${itemId}?workspace_id=${workspaceSlug}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch { /* noop */ }
  };

  /* ── Move item (drag-and-drop) ── */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex).map((it, i) => ({
      ...it,
      sort_order: i,
    }));
    setItems(reordered);

    // Persist reorder
    fetch(`/api/links/pages/${page.id}/items?workspace_id=${workspaceSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: reordered.map((it) => ({ id: it.id, sort_order: it.sort_order })) }),
    }).catch(() => {});
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl).catch(() => {});
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={base}
            className="rounded-lg p-1.5 text-[#f5f5dc]/40 transition hover:bg-[#f5f5dc]/[0.04] hover:text-[#f5f5dc]/70 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-[#f5f5dc] tracking-tight truncate">{page.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-[#f5f5dc]/30 font-mono">/l/{page.slug}</span>
              <button onClick={handleCopyUrl} className="text-[#f5f5dc]/20 hover:text-[#f5f5dc]/50 transition" title="Copy public URL">
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {page.published && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-1.5 text-[#f5f5dc]/40 transition hover:bg-[#f5f5dc]/[0.04] hover:text-[#f5f5dc]/70"
              title="Open public page"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <button
            onClick={togglePublish}
            disabled={saving}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[11px] font-semibold transition flex items-center gap-1.5",
              page.published
                ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                : "bg-[#d4af37] text-[#050a18] hover:bg-[#d4af37]/90"
            )}
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
            {page.published ? t("published") : t("publish")}
          </button>
        </div>
      </div>

      {/* Two-column layout: editor + preview */}
      <div className="grid gap-4 lg:grid-cols-[1fr,320px]">
        {/* Left: editor */}
        <div className="space-y-3">
          {/* Page settings toggle */}
          <button
            onClick={() => setEditSettings(!editSettings)}
            className="flex w-full items-center justify-between rounded-xl border border-[#f5f5dc]/[0.06] bg-[#f5f5dc]/[0.02] px-4 py-2.5 text-[11px] font-medium text-[#f5f5dc]/50 transition hover:bg-[#f5f5dc]/[0.04]"
          >
            <span>{t("pageSettings")}</span>
            {editSettings ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {editSettings && (
            <PageSettingsForm page={page} onSave={savePage} saving={saving} />
          )}

          {/* Link items (drag-and-drop sortable) */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {items.map((item) => (
                  <SortableItemRow
                    key={item.id}
                    item={item}
                    onUpdate={updateItem}
                    onDelete={deleteItem}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Add link */}
          {addType ? (
            <div className="rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/[0.03] p-3">
              <p className="text-[11px] font-medium text-[#f5f5dc]/60 mb-2">{t("chooseType")}</p>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(LINK_TYPE_META).map(([type, meta]) => (
                  <button
                    key={type}
                    onClick={() => addItem(type)}
                    disabled={adding}
                    className="flex flex-col items-center gap-1 rounded-lg border border-[#f5f5dc]/[0.06] bg-[#f5f5dc]/[0.02] px-2 py-2 text-[10px] text-[#f5f5dc]/50 transition hover:bg-[#f5f5dc]/[0.06] hover:text-[#f5f5dc]/80"
                  >
                    <meta.icon className={cn("h-4 w-4", meta.color)} />
                    {meta.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setAddType(null)}
                className="mt-2 text-[10px] text-[#f5f5dc]/30 hover:text-[#f5f5dc]/50 transition"
              >
                {t("cancel")}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddType("pick")}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#f5f5dc]/[0.08] bg-[#f5f5dc]/[0.01] px-4 py-3 text-[11px] font-medium text-[#f5f5dc]/40 transition hover:bg-[#f5f5dc]/[0.03] hover:text-[#f5f5dc]/60 hover:border-[#d4af37]/20"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("addLink")}
            </button>
          )}
        </div>

        {/* Right: live preview */}
        <div className="hidden lg:block">
          <div className="sticky top-4">
            <p className="text-[10px] uppercase tracking-wider text-[#f5f5dc]/30 mb-2">{t("previewLabel")}</p>
            <MiniPreview page={page} items={items} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Page settings form ── */
function PageSettingsForm({
  page,
  onSave,
  saving,
}: {
  page: PageData;
  onSave: (patch: Partial<PageData>) => void;
  saving: boolean;
}) {
  const t = useTranslations("linksUI");
  const [title, setTitle] = useState(page.title);
  const [bio, setBio] = useState(page.bio ?? "");
  const [seoTitle, setSeoTitle] = useState(page.seo_title ?? "");
  const [seoDesc, setSeoDesc] = useState(page.seo_description ?? "");
  const [tab, setTab] = useState<"general" | "appearance" | "seo">("general");

  // Theme state
  const theme = page.theme ?? {};
  const [bg, setBg] = useState(theme.bg ?? "#0f172a");
  const [textColor, setTextColor] = useState(theme.text ?? "#f5f5dc");
  const [accent, setAccent] = useState(theme.accent ?? "#d4af37");
  const [buttonStyle, setButtonStyle] = useState<string>(theme.buttonStyle ?? "filled");
  const [radius, setRadius] = useState<string>(theme.radius ?? "lg");

  const PRESETS = [
    { name: "Midnight Gold", bg: "#0f172a", text: "#f5f5dc", accent: "#d4af37" },
    { name: "Ocean Blue", bg: "#0c1929", text: "#e2e8f0", accent: "#38bdf8" },
    { name: "Forest", bg: "#0a1f0f", text: "#ecfdf5", accent: "#34d399" },
    { name: "Sunset", bg: "#1c0a12", text: "#fef2f2", accent: "#fb923c" },
    { name: "Lavender", bg: "#1a0a2e", text: "#f0e7ff", accent: "#a78bfa" },
    { name: "Clean Light", bg: "#f8fafc", text: "#0f172a", accent: "#2563eb" },
    { name: "Snow", bg: "#ffffff", text: "#1e293b", accent: "#e11d48" },
    { name: "Cream", bg: "#fffbeb", text: "#292524", accent: "#d97706" },
  ];

  const tabs = [
    { key: "general" as const, label: "tabGeneral" as const },
    { key: "appearance" as const, label: "tabAppearance" as const },
    { key: "seo" as const, label: "tabSeo" as const },
  ];

  const saveGeneral = () => onSave({ title, bio: bio || null });
  const saveSeo = () => onSave({ seo_title: seoTitle || null, seo_description: seoDesc || null });
  const saveTheme = () => onSave({ theme: { bg, text: textColor, accent, buttonStyle, radius } } as Partial<PageData>);

  return (
    <div className="rounded-xl border border-[#f5f5dc]/[0.06] bg-[#f5f5dc]/[0.02] overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-[#f5f5dc]/[0.06]">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={cn(
              "flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition",
              tab === tabItem.key
                ? "text-[#d4af37] border-b-2 border-[#d4af37] bg-[#d4af37]/[0.04]"
                : "text-[#f5f5dc]/30 hover:text-[#f5f5dc]/50"
            )}
          >
            {t(tabItem.label)}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {/* General tab */}
        {tab === "general" && (
          <>
            <div>
              <label className="block text-[10px] font-medium text-[#f5f5dc]/40 mb-1">{t("title")}</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-[#f5f5dc]/[0.08] bg-transparent px-3 py-1.5 text-sm text-[#f5f5dc] focus:border-[#d4af37]/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-[#f5f5dc]/40 mb-1">{t("bio")}</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-[#f5f5dc]/[0.08] bg-transparent px-3 py-1.5 text-sm text-[#f5f5dc] focus:border-[#d4af37]/40 focus:outline-none resize-none"
                maxLength={300}
              />
            </div>
            <button
              onClick={saveGeneral}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#f5f5dc]/[0.06] px-3 py-1.5 text-[11px] font-medium text-[#f5f5dc]/60 transition hover:bg-[#f5f5dc]/[0.10]"
            >
              <Save className="h-3 w-3" />
              {t("save")}
            </button>
          </>
        )}

        {/* Appearance tab */}
        {tab === "appearance" && (
          <>
            {/* Theme presets */}
            <div>
              <label className="block text-[10px] font-medium text-[#f5f5dc]/40 mb-2">{t("presets")}</label>
              <div className="grid grid-cols-4 gap-1.5">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setBg(preset.bg);
                      setTextColor(preset.text);
                      setAccent(preset.accent);
                    }}
                    className={cn(
                      "rounded-lg p-1.5 border transition hover:scale-[1.03]",
                      bg === preset.bg && textColor === preset.text && accent === preset.accent
                        ? "border-[#d4af37]/60 ring-1 ring-[#d4af37]/30"
                        : "border-[#f5f5dc]/[0.06]"
                    )}
                    title={preset.name}
                  >
                    <div className="rounded-md overflow-hidden h-8 flex flex-col" style={{ background: preset.bg }}>
                      <div className="flex-1 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full" style={{ background: preset.accent }} />
                      </div>
                      <div className="h-1.5" style={{ background: preset.accent + "30" }} />
                    </div>
                    <p className="text-[7px] text-[#f5f5dc]/30 mt-1 text-center truncate">{preset.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Color pickers */}
            <div className="grid grid-cols-3 gap-2">
              <ColorField label={t("background")} value={bg} onChange={setBg} />
              <ColorField label={t("text")} value={textColor} onChange={setTextColor} />
              <ColorField label={t("accent")} value={accent} onChange={setAccent} />
            </div>

            {/* Button style */}
            <div>
              <label className="block text-[10px] font-medium text-[#f5f5dc]/40 mb-1.5">{t("buttonStyle")}</label>
              <div className="flex gap-1.5">
                {(["filled", "outline", "soft"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setButtonStyle(s)}
                    className={cn(
                      "flex-1 rounded-lg px-2 py-2 text-[10px] font-medium capitalize transition",
                      s === "filled" && "border",
                      s === "outline" && "border",
                      s === "soft" && "border",
                      buttonStyle === s
                        ? "border-[#d4af37]/50 bg-[#d4af37]/10 text-[#d4af37]"
                        : "border-[#f5f5dc]/[0.06] text-[#f5f5dc]/30 hover:text-[#f5f5dc]/50"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Border radius */}
            <div>
              <label className="block text-[10px] font-medium text-[#f5f5dc]/40 mb-1.5">{t("cornerRadius")}</label>
              <div className="flex gap-1.5">
                {(["none", "sm", "md", "lg", "full"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    className={cn(
                      "flex-1 border px-2 py-2 text-[10px] font-medium uppercase transition",
                      radius === r
                        ? "border-[#d4af37]/50 bg-[#d4af37]/10 text-[#d4af37]"
                        : "border-[#f5f5dc]/[0.06] text-[#f5f5dc]/30 hover:text-[#f5f5dc]/50",
                      r === "none" && "rounded-none",
                      r === "sm" && "rounded",
                      r === "md" && "rounded-md",
                      r === "lg" && "rounded-lg",
                      r === "full" && "rounded-full"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={saveTheme}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#d4af37]/10 px-3 py-1.5 text-[11px] font-medium text-[#d4af37] transition hover:bg-[#d4af37]/20"
            >
              <Save className="h-3 w-3" />
              {t("applyTheme")}
            </button>
          </>
        )}

        {/* SEO tab */}
        {tab === "seo" && (
          <>
            <div>
              <label className="block text-[10px] font-medium text-[#f5f5dc]/40 mb-1">{t("seoTitle")}</label>
              <input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full rounded-lg border border-[#f5f5dc]/[0.08] bg-transparent px-3 py-1.5 text-sm text-[#f5f5dc] focus:border-[#d4af37]/40 focus:outline-none"
                placeholder={page.title}
                maxLength={120}
              />
              <p className="text-[9px] text-[#f5f5dc]/20 mt-0.5">{t("seoTitleHint")}</p>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-[#f5f5dc]/40 mb-1">{t("seoDescription")}</label>
              <textarea
                value={seoDesc}
                onChange={(e) => setSeoDesc(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-[#f5f5dc]/[0.08] bg-transparent px-3 py-1.5 text-sm text-[#f5f5dc] focus:border-[#d4af37]/40 focus:outline-none resize-none"
                placeholder={page.bio ?? t("seoDescPlaceholder")}
                maxLength={300}
              />
            </div>
            <button
              onClick={saveSeo}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#f5f5dc]/[0.06] px-3 py-1.5 text-[11px] font-medium text-[#f5f5dc]/60 transition hover:bg-[#f5f5dc]/[0.10]"
            >
              <Save className="h-3 w-3" />
              {t("saveSeo")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Color picker field ── */
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-[#f5f5dc]/40 mb-1">{label}</label>
      <div className="flex items-center gap-1.5 rounded-lg border border-[#f5f5dc]/[0.08] bg-transparent px-2 py-1">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-5 w-5 rounded border-0 cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-[10px] font-mono text-[#f5f5dc]/50 focus:outline-none w-0"
          maxLength={7}
        />
      </div>
    </div>
  );
}

/* ── Sortable item row (drag-and-drop) ── */
function SortableItemRow({
  item,
  onUpdate,
  onDelete,
}: {
  item: LinkItem;
  onUpdate: (id: string, patch: Partial<LinkItem>) => void;
  onDelete: (id: string) => void;
}) {
  const t = useTranslations("linksUI");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [url, setUrl] = useState(item.url ?? "");
  const meta = LINK_TYPE_META[item.link_type] ?? LINK_TYPE_META.url;
  const Icon = meta.icon;

  const save = () => {
    const patch: Record<string, unknown> = { title };
    if (item.link_type !== "heading") patch.url = url || null;
    onUpdate(item.id, patch as Partial<LinkItem>);
    setEditing(false);
  };

  if (item.link_type === "heading") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-2 rounded-xl border border-[#f5f5dc]/[0.04] bg-transparent px-3 py-2"
      >
        <button
          {...attributes}
          {...listeners}
          className="text-[#f5f5dc]/15 hover:text-[#f5f5dc]/40 transition cursor-grab active:cursor-grabbing touch-none shrink-0"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <Type className="h-3 w-3 text-[#f5f5dc]/30 shrink-0" />
        {editing ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => e.key === "Enter" && save()}
            className="flex-1 bg-transparent text-xs font-semibold text-[#f5f5dc]/70 focus:outline-none"
            autoFocus
          />
        ) : (
          <span
            onClick={() => setEditing(true)}
            className="flex-1 text-xs font-semibold text-[#f5f5dc]/50 cursor-text truncate"
          >
            {item.title}
          </span>
        )}
        <button onClick={() => onDelete(item.id)} className="text-[#f5f5dc]/20 hover:text-red-400/70 transition p-0.5">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-[#f5f5dc]/[0.06] bg-[#f5f5dc]/[0.02] px-3 py-2.5 group"
    >
      <div className="flex items-center gap-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="text-[#f5f5dc]/15 hover:text-[#f5f5dc]/40 transition cursor-grab active:cursor-grabbing touch-none shrink-0"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Icon + type */}
        <div className={cn("shrink-0", meta.color)}>
          <Icon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-1.5">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-xs font-medium text-[#f5f5dc] focus:outline-none border-b border-[#f5f5dc]/[0.08] pb-1"
                placeholder="Link title"
                autoFocus
              />
              {item.link_type === "whatsapp" ? (
                <div className="flex gap-2">
                  <input
                    value={(item.metadata as Record<string, string>)?.phone ?? ""}
                    onChange={(e) => onUpdate(item.id, { metadata: { ...item.metadata as Record<string, unknown>, phone: e.target.value } } as Partial<LinkItem>)}
                    className="flex-1 bg-transparent text-[11px] text-[#f5f5dc]/50 focus:outline-none border-b border-[#f5f5dc]/[0.06] pb-1 font-mono"
                    placeholder="+628xxx"
                  />
                </div>
              ) : (
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-transparent text-[11px] text-[#f5f5dc]/40 focus:outline-none border-b border-[#f5f5dc]/[0.06] pb-1 font-mono"
                  placeholder="https://"
                />
              )}
              <div className="flex gap-2">
                <button onClick={save} className="text-[10px] text-[#d4af37] hover:underline">{t("save")}</button>
                <button onClick={() => setEditing(false)} className="text-[10px] text-[#f5f5dc]/30 hover:underline">{t("cancel")}</button>
              </div>
            </div>
          ) : (
            <div onClick={() => setEditing(true)} className="cursor-text">
              <p className="text-xs font-medium text-[#f5f5dc] truncate">{item.title}</p>
              <p className="text-[10px] text-[#f5f5dc]/30 truncate font-mono">
                {item.link_type === "whatsapp"
                  ? `wa.me/${(((item.metadata as Record<string, string>)?.phone ?? "").replace(/[^0-9]/g, ""))}`
                  : item.url ?? "—"}
              </p>
            </div>
          )}
        </div>

        {/* Visibility + delete */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={() => onUpdate(item.id, { visible: !item.visible })}
            className={cn("p-1 rounded transition", item.visible ? "text-[#f5f5dc]/30 hover:text-[#f5f5dc]/60" : "text-red-400/40 hover:text-red-400/70")}
            title={item.visible ? "Hide link" : "Show link"}
          >
            {item.visible ? <Eye className="h-3 w-3" /> : <Eye className="h-3 w-3 line-through" />}
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1 rounded text-[#f5f5dc]/20 hover:text-red-400/70 transition"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Mini phone preview ── */
function MiniPreview({ page, items }: { page: PageData; items: LinkItem[] }) {
  const t = useTranslations("linksUI");
  const visibleItems = items.filter((i) => i.visible);
  const theme = page.theme ?? {};
  const bg = theme.bg ?? "#0f172a";
  const text = theme.text ?? "#f5f5dc";
  const accent = theme.accent ?? "#d4af37";

  return (
    <div
      className="rounded-2xl border border-[#f5f5dc]/[0.08] overflow-hidden shadow-lg"
      style={{ width: 280, maxHeight: 480 }}
    >
      {/* Phone frame */}
      <div className="overflow-y-auto p-5 space-y-3" style={{ background: bg, maxHeight: 480 }}>
        {/* Avatar + title */}
        <div className="text-center space-y-1">
          <div
            className="mx-auto h-14 w-14 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ background: accent + "20", color: accent }}
          >
            {page.title.charAt(0).toUpperCase()}
          </div>
          <p className="text-sm font-bold" style={{ color: text }}>{page.title}</p>
          {page.bio && <p className="text-[10px] opacity-60" style={{ color: text }}>{page.bio}</p>}
        </div>

        {/* Items */}
        {visibleItems.map((item) => {
          if (item.link_type === "heading") {
            return (
              <p key={item.id} className="text-[10px] font-semibold uppercase tracking-wider pt-1" style={{ color: text, opacity: 0.4 }}>
                {item.title}
              </p>
            );
          }
          const meta = LINK_TYPE_META[item.link_type] ?? LINK_TYPE_META.url;
          return (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition"
              style={{ background: accent + "15", color: text, border: `1px solid ${accent}30` }}
            >
              <meta.icon className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
              <span className="truncate">{item.title}</span>
            </div>
          );
        })}

        {visibleItems.length === 0 && (
          <p className="text-[10px] text-center opacity-30 py-4" style={{ color: text }}>{t("noLinksYet")}</p>
        )}

        {/* Powered by */}
        <p className="text-[8px] text-center opacity-20 pt-2" style={{ color: text }}>
          {t("poweredBy")}
        </p>
      </div>
    </div>
  );
}
