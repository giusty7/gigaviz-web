"use client";
import { logger } from "@/lib/logging";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Filter, Plus, Star, Trash2, RefreshCw, Share2 } from "lucide-react";

interface SavedFilter {
  id: string;
  name: string;
  description: string | null;
  page: string;
  filters: Record<string, unknown>;
  is_default: boolean;
  is_shared: boolean;
  created_at: string;
}

const PAGES = [
  { value: "workspaces", label: "Workspaces" },
  { value: "customers", label: "Customers" },
  { value: "tickets", label: "Tickets" },
  { value: "system-logs", label: "System Logs" },
];

export default function SavedFiltersClient() {
  const t = useTranslations("opsUI");
  const [filters, setFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState("workspaces");
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [filterName, setFilterName] = useState("");
  const [filterDescription, setFilterDescription] = useState("");
  const [isShared, setIsShared] = useState(false);

  const fetchFilters = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ops/saved-filters?page=${selectedPage}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setFilters(data.filters || []);
      }
    } catch (err) {
      logger.error("Failed to fetch filters:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPage]);

  const handleCreate = async () => {
    if (!filterName) return;
    try {
      await fetch("/api/ops/saved-filters", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: filterName,
          description: filterDescription || null,
          page: selectedPage,
          filters: {},
          is_shared: isShared,
        }),
      });
      setShowForm(false);
      setFilterName("");
      setFilterDescription("");
      setIsShared(false);
      fetchFilters();
    } catch (err) {
      logger.error("Create failed:", err);
    }
  };

  const handleDelete = async (filterId: string) => {
    try {
      await fetch("/api/ops/saved-filters", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          filter_id: filterId,
        }),
      });
      fetchFilters();
    } catch (err) {
      logger.error("Delete failed:", err);
    }
  };

  const handleSetDefault = async (filterId: string) => {
    try {
      await fetch("/api/ops/saved-filters", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_default",
          filter_id: filterId,
          page: selectedPage,
        }),
      });
      fetchFilters();
    } catch (err) {
      logger.error("Set default failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("operations.savedFilters.title")}</h1>
          <p className="text-zinc-400">{t("operations.savedFilters.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchFilters}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white hover:bg-zinc-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            {t("operations.savedFilters.addFilter")}
          </button>
        </div>
      </div>

      {/* Page Selector */}
      <div className="flex gap-2">
        {PAGES.map((page) => (
          <button
            key={page.value}
            onClick={() => setSelectedPage(page.value)}
            className={`rounded-lg px-4 py-2 text-sm ${
              selectedPage === page.value
                ? "bg-zinc-700 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
            }`}
          >
            {page.label}
          </button>
        ))}
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-xl border border-green-900/50 bg-green-950/20 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Filter className="h-5 w-5 text-green-400" />
            {t("operations.savedFilters.createFilter")}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">{t("operations.savedFilters.filterName")}</label>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="e.g., Active Team Workspaces"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder:text-zinc-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-400">Description</label>
              <input
                type="text"
                value={filterDescription}
                onChange={(e) => setFilterDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder:text-zinc-500"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="rounded border-zinc-600 bg-zinc-800"
              />
              {t("operations.savedFilters.shared")}
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-white hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!filterName}
              className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {t("operations.savedFilters.createFilter")}
            </button>
          </div>
        </div>
      )}

      {/* Filters List */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Filters for {PAGES.find((p) => p.value === selectedPage)?.label}
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : filters.length === 0 ? (
          <div className="py-8 text-center">
            <Filter className="mx-auto h-10 w-10 text-zinc-600" />
            <p className="mt-4 text-zinc-400">
              No saved filters for this page yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filters.map((filter) => (
              <div
                key={filter.id}
                className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/50 p-4"
              >
                <div className="flex items-center gap-3">
                  {filter.is_default && (
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  )}
                  <div>
                    <p className="font-medium text-white">{filter.name}</p>
                    {filter.description && (
                      <p className="text-sm text-zinc-400">{filter.description}</p>
                    )}
                  </div>
                  {filter.is_shared && (
                    <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">
                      <Share2 className="h-3 w-3" />
                      {t("operations.savedFilters.shared")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!filter.is_default && (
                    <button
                      onClick={() => handleSetDefault(filter.id)}
                      className="text-zinc-400 hover:text-amber-400"
                      title="Set as default"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(filter.id)}
                    className="text-zinc-400 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
