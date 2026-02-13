"use client";

import { useState } from "react";
import { BadgeCheck, Loader2, AlertTriangle, Send, Globe, Building2, Languages, Link2, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

/* ═══════════════════════════════════════════════════════════════════
   OBA (Official Business Account) Blue Tick Request Card
   ═══════════════════════════════════════════════════════════════════ */

type ObaStatus =
  | { type: "unknown" }
  | { type: "checking" }
  | { type: "not_requested" }
  | { type: "pending" }
  | { type: "approved"; name?: string }
  | { type: "rejected"; reasons?: string[] }
  | { type: "error"; message: string };

interface ObaRequestCardProps {
  workspaceId: string;
  phoneNumberId: string;
  canEdit: boolean;
}

export function ObaRequestCard({
  workspaceId,
  phoneNumberId,
  canEdit,
}: ObaRequestCardProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<ObaStatus>({ type: "unknown" });
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form fields
  const [businessName, setBusinessName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [country, setCountry] = useState("Indonesia");
  const [language, setLanguage] = useState("Indonesian");
  const [supportingInfo, setSupportingInfo] = useState("");
  const [supportingLinks, setSupportingLinks] = useState("");

  const normalizeUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  /* ── Check OBA status ──────────────────────────────────────── */
  const checkStatus = async () => {
    setStatus({ type: "checking" });
    try {
      const res = await fetch(
        `/api/meta-hub/connections/${phoneNumberId}/oba`,
        {
          headers: { "x-workspace-id": workspaceId },
        }
      );
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setStatus({
          type: "error",
          message: data?.message || `HTTP ${res.status}`,
        });
        return;
      }

      const oba = data?.official_business_account;

      if (!oba || oba === "" || oba === "none") {
        setStatus({ type: "not_requested" });
      } else if (typeof oba === "object") {
        if (oba.rejection_reasons?.length) {
          setStatus({ type: "rejected", reasons: oba.rejection_reasons });
        } else if (oba.id || oba.name) {
          setStatus({ type: "approved", name: oba.name });
        } else {
          setStatus({ type: "pending" });
        }
      } else if (typeof oba === "string") {
        // Could be an enum like "pending", "approved", etc.
        if (oba.toLowerCase().includes("approv")) {
          setStatus({ type: "approved" });
        } else if (oba.toLowerCase().includes("reject")) {
          setStatus({ type: "rejected" });
        } else {
          setStatus({ type: "pending" });
        }
      } else {
        setStatus({ type: "not_requested" });
      }
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to check",
      });
    }
  };

  /* ── Submit OBA request ────────────────────────────────────── */
  const submitRequest = async () => {
    const normalizedWebsiteUrl = normalizeUrl(websiteUrl);
    if (!normalizedWebsiteUrl) {
      toast({
        title: "Business Website required",
        description: "Please fill a valid website URL before submitting.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const links = supportingLinks
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.startsWith("http"));

      const payload: Record<string, unknown> = {};
      if (businessName) payload.parent_business_or_brand = businessName;
      payload.business_website_url = normalizedWebsiteUrl;
      if (country) payload.primary_country_of_operation = country;
      if (language) payload.primary_language = language;
      if (supportingInfo)
        payload.additional_supporting_information = supportingInfo;
      if (links.length > 0) payload.supporting_links = links;

      const res = await fetch(
        `/api/meta-hub/connections/${phoneNumberId}/oba`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-workspace-id": workspaceId,
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast({
          title: "OBA Request Failed",
          description: data?.message || `Error ${res.status}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "✅ OBA Request Submitted!",
        description:
          "Your Official Business Account (blue tick) request has been submitted to Meta. Review can take up to several business days.",
      });
      setShowForm(false);
      setStatus({ type: "pending" });
    } catch (err) {
      toast({
        title: "Request Error",
        description:
          err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Status badge ──────────────────────────────────────────── */
  const StatusBadge = () => {
    switch (status.type) {
      case "unknown":
        return (
          <span className="text-xs text-[#f5f5dc]/40">
            Click &quot;Check Status&quot; to see current OBA status
          </span>
        );
      case "checking":
        return (
          <span className="flex items-center gap-1.5 text-xs text-cyan-300">
            <Loader2 className="h-3 w-3 animate-spin" />
            Checking...
          </span>
        );
      case "not_requested":
        return (
          <span className="rounded-full border border-[#f5f5dc]/20 bg-[#f5f5dc]/5 px-2 py-0.5 text-xs text-[#f5f5dc]/60">
            Not Requested
          </span>
        );
      case "pending":
        return (
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-300">
            ⏳ Pending Review
          </span>
        );
      case "approved":
        return (
          <span className="flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-300">
            <BadgeCheck className="h-3 w-3" />
            Verified {status.name ? `(${status.name})` : ""}
          </span>
        );
      case "rejected":
        return (
          <div>
            <span className="rounded-full border border-red-400/30 bg-red-400/10 px-2 py-0.5 text-xs text-red-300">
              ❌ Rejected
            </span>
            {status.reasons && status.reasons.length > 0 && (
              <p className="mt-1 text-xs text-red-300/70">
                {status.reasons.join(", ")}
              </p>
            )}
          </div>
        );
      case "error":
        return (
          <span className="flex items-center gap-1 text-xs text-red-400">
            <AlertTriangle className="h-3 w-3" />
            {status.message}
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#0a1229]/90 to-[#0a1229]/70 p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-400/10">
            <BadgeCheck className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#f5f5dc]">
              Official Business Account
            </h3>
            <p className="text-xs text-[#f5f5dc]/50">
              Request blue tick verification from Meta
            </p>
          </div>
        </div>
        <StatusBadge />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={checkStatus}
          disabled={status.type === "checking"}
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400/30 bg-blue-400/10 px-3 py-1.5 text-xs font-medium text-blue-300 transition-colors hover:bg-blue-400/20 disabled:opacity-50"
        >
          {status.type === "checking" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <BadgeCheck className="h-3 w-3" />
          )}
          Check Status
        </button>

        {canEdit && status.type !== "approved" && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-400/20"
          >
            <Send className="h-3 w-3" />
            {showForm ? "Cancel" : "Request Blue Tick"}
          </button>
        )}
      </div>

      {/* OBA Request Form */}
      {showForm && (
        <div className="mt-4 space-y-3 rounded-xl border border-blue-400/10 bg-[#0a1229]/60 p-4">
          <p className="text-xs text-[#f5f5dc]/50">
            Fill in your business details for the OBA review. All fields are
            optional but providing more info increases approval chances.
          </p>

          {/* Business Name */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#f5f5dc]/70">
              <Building2 className="h-3 w-3" />
              Business / Brand Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Gigaviz Indonesia"
              className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229] px-3 py-2 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:border-blue-400/50 focus:outline-none"
            />
          </div>

          {/* Website URL */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#f5f5dc]/70">
              <Globe className="h-3 w-3" />
              Business Website
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://gigaviz.com"
              className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229] px-3 py-2 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:border-blue-400/50 focus:outline-none"
            />
          </div>

          {/* Country & Language */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#f5f5dc]/70">
                <Globe className="h-3 w-3" />
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Indonesia"
                className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229] px-3 py-2 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:border-blue-400/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#f5f5dc]/70">
                <Languages className="h-3 w-3" />
                Language
              </label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="Indonesian"
                className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229] px-3 py-2 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:border-blue-400/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Supporting Info */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#f5f5dc]/70">
              <FileText className="h-3 w-3" />
              Additional Supporting Information
            </label>
            <textarea
              value={supportingInfo}
              onChange={(e) => setSupportingInfo(e.target.value)}
              placeholder="Tell Meta why your business should be verified..."
              rows={3}
              className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229] px-3 py-2 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:border-blue-400/50 focus:outline-none"
            />
          </div>

          {/* Supporting Links */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#f5f5dc]/70">
              <Link2 className="h-3 w-3" />
              Supporting Links (one URL per line, max 10)
            </label>
            <textarea
              value={supportingLinks}
              onChange={(e) => setSupportingLinks(e.target.value)}
              placeholder={"https://news-article-about-your-brand.com\nhttps://industry-directory-listing.com"}
              rows={3}
              className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229] px-3 py-2 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:border-blue-400/50 focus:outline-none"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={submitRequest}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-500 hover:to-blue-400 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit OBA Request
            </button>
            <p className="text-[10px] text-[#f5f5dc]/40">
              Note: <code>success: true</code> means the request was
              submitted, not yet approved. Review may take several business
              days.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
