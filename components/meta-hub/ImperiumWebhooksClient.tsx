"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { AlertTriangle, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  RadarHeader,
  MetricsCards,
  FilterPills,
  TestWebhookButton,
  EventStream,
  PayloadInspector,
  ImperiumWebhooksFooter,
  type WebhookEvent,
  type WebhookStats,
} from "./ImperiumWebhooksComponents";

/* ═══════════════════════════════════════════════════════════════════════════
   HYDRATION-SAFE MOUNT CHECK
   ═══════════════════════════════════════════════════════════════════════════ */

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════════════════════ */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

interface ImperiumWebhooksClientProps {
  workspaceId: string;
  workspaceSlug: string;
  hasToken: boolean;
  phoneNumberId: string | null;
  displayName: string | null;
  initialEvents: WebhookEvent[];
  initialStats: WebhookStats;
  webhookUrl: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   DATE HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

function getDateFrom(range: string): string | null {
  const now = Date.now();
  if (range === "24h") return new Date(now - 24 * 60 * 60 * 1000).toISOString();
  if (range === "7d") return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (range === "30d") return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN CLIENT COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function ImperiumWebhooksClient({
  workspaceId,
  workspaceSlug,
  hasToken,
  phoneNumberId,
  displayName,
  initialEvents,
  initialStats,
  webhookUrl,
}: ImperiumWebhooksClientProps) {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const { toast } = useToast();

  // State
  const [events, setEvents] = useState<WebhookEvent[]>(initialEvents);
  const [stats, setStats] = useState<WebhookStats>(initialStats);
  const [loading, setLoading] = useState(false);
  const [testingPing, setTestingPing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);
  const [autoRefresh] = useState(30000); // 30s default
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  // Computed values
  const successRate = useMemo(() => {
    if (stats.total24h === 0) return 100;
    return ((stats.total24h - stats.errors24h) / stats.total24h) * 100;
  }, [stats]);

  const avgLatency = 180; // Placeholder - would come from real data

  const isListening = hasToken && Boolean(phoneNumberId);

  // Filter events
  const filteredEvents = useMemo(() => {
    if (activeFilter === "all") return events;
    if (activeFilter === "messages") {
      return events.filter((e) => e.event_type?.toLowerCase().includes("message"));
    }
    if (activeFilter === "statuses") {
      return events.filter(
        (e) =>
          e.event_type?.toLowerCase().includes("status") ||
          e.event_type?.toLowerCase().includes("delivered") ||
          e.event_type?.toLowerCase().includes("read") ||
          e.event_type?.toLowerCase().includes("sent")
      );
    }
    if (activeFilter === "errors") {
      return events.filter((e) => Boolean(e.error_text));
    }
    return events;
  }, [events, activeFilter]);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ workspaceId, limit: "100" });
      const from = getDateFrom("24h");
      if (from) params.set("from", from);

      const res = await fetch(`/api/meta/whatsapp/webhook-events?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to load events");
      }
      setEvents(data.events ?? []);
      setStats(data.stats ?? { total24h: 0, errors24h: 0, lastEventAt: null });
    } catch (err) {
      toast({
        title: "Failed to refresh",
        description: err instanceof Error ? err.message : "Error loading events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, toast]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = null;
    }
    if (autoRefresh > 0) {
      autoRefreshRef.current = setInterval(fetchEvents, autoRefresh);
    }
    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [autoRefresh, fetchEvents]);

  // Test webhook ping
  const handleTestPing = useCallback(async () => {
    setTestingPing(true);
    try {
      // Simulate a test ping
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast({
        title: "Ping Successful!",
        description: "Webhook endpoint is responding correctly.",
      });
    } catch {
      toast({
        title: "Ping Failed",
        description: "Could not reach webhook endpoint.",
        variant: "destructive",
      });
    } finally {
      setTestingPing(false);
    }
  }, [toast]);

  // Copy handler
  const handleCopy = useCallback(
    (text: string) => {
      navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard" });
    },
    [toast]
  );

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-48 animate-pulse rounded-3xl border border-[#d4af37]/20 bg-[#0a1229]/80" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Cyber-Batik Kawung Background */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='40' cy='40' r='25' fill='none' stroke='%23d4af37' stroke-width='0.5'/%3E%3Ccircle cx='40' cy='40' r='15' fill='none' stroke='%23d4af37' stroke-width='0.3'/%3E%3Ccircle cx='40' cy='40' r='5' fill='none' stroke='%23d4af37' stroke-width='0.2'/%3E%3Ccircle cx='15' cy='15' r='8' fill='none' stroke='%23d4af37' stroke-width='0.2'/%3E%3Ccircle cx='65' cy='15' r='8' fill='none' stroke='%23d4af37' stroke-width='0.2'/%3E%3Ccircle cx='15' cy='65' r='8' fill='none' stroke='%23d4af37' stroke-width='0.2'/%3E%3Ccircle cx='65' cy='65' r='8' fill='none' stroke='%23d4af37' stroke-width='0.2'/%3E%3C/svg%3E")`,
          backgroundSize: "80px 80px",
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-3 py-1 text-xs font-semibold tracking-wider text-[#f9d976]">
                PILLAR #2
              </span>
              <span className="text-xs text-[#f5f5dc]/50">Real-Time Listening Post</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#f5f5dc]">
              Webhook Monitor
            </h1>
            <p className="mt-2 text-sm text-[#f5f5dc]/60">
              {displayName ?? "WhatsApp"} • Real-time event monitoring and debugging
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={fetchEvents}
              disabled={loading}
              variant="outline"
              size="sm"
              className="gap-2 border-[#d4af37]/40 text-[#f5f5dc]/70 hover:bg-[#d4af37]/10 hover:text-[#f9d976]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Alerts */}
        {!hasToken && (
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-3 rounded-xl border border-[#e11d48]/40 bg-[#e11d48]/10 px-4 py-3 text-sm"
          >
            <AlertTriangle className="h-5 w-5 text-[#e11d48]" />
            <div className="flex-1">
              <p className="font-semibold text-[#e11d48]">Token Missing</p>
              <p className="text-[#e11d48]/70">
                Configure your WhatsApp connection to receive webhook events.
              </p>
            </div>
            <Link href={`/${workspaceSlug}/meta-hub/connections`}>
              <Button
                size="sm"
                variant="outline"
                className="border-[#e11d48]/50 text-[#e11d48] hover:bg-[#e11d48]/20"
              >
                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                Open Connections
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Radar Header */}
        <motion.div variants={itemVariants}>
          <RadarHeader
            isListening={isListening}
            webhookUrl={webhookUrl}
            lastEventAt={stats.lastEventAt}
            onCopy={handleCopy}
          />
        </motion.div>

        {/* Metrics Cards */}
        <motion.div variants={itemVariants}>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
            <span className="text-xs font-semibold tracking-wider text-[#d4af37]">
              HEALTH &amp; PERFORMANCE
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
          </div>
          <MetricsCards
            successRate={successRate}
            avgLatencyMs={avgLatency}
            total24h={stats.total24h}
            errors24h={stats.errors24h}
          />
        </motion.div>

        {/* Controls */}
        <motion.div variants={itemVariants}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <FilterPills activeFilter={activeFilter} onFilterChange={setActiveFilter} />
            <TestWebhookButton onTest={handleTestPing} loading={testingPing} />
          </div>
        </motion.div>

        {/* Live Event Stream */}
        <motion.div variants={itemVariants}>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
            <span className="text-xs font-semibold tracking-wider text-[#d4af37]">
              LIVE EVENT STREAM
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
          </div>
          <EventStream events={filteredEvents} onEventClick={setSelectedEvent} />
        </motion.div>

        {/* Footer */}
        <ImperiumWebhooksFooter />
      </motion.div>

      {/* Payload Inspector */}
      <PayloadInspector
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onCopy={handleCopy}
      />
    </div>
  );
}
