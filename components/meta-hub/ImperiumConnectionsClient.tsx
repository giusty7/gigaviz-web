"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import {
  NeuralLinkHero,
  MonitorCard,
  WebhookTerminalCard,
  ImperiumHealthCheck,
  ImperiumConnectionsFooter,
  BusinessAssetVault,
  EventRadar,
  WebhookStatusCard,
  SandboxSettingsCard,
} from "./ImperiumConnectionsComponents";
import { WhatsappConnectionForm } from "./WhatsappConnectionForm";
import { WhatsappEmbeddedSignup } from "./WhatsappEmbeddedSignup";
import { useToast } from "@/components/ui/use-toast";

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

interface ImperiumConnectionsClientProps {
  workspaceId: string;
  workspaceSlug: string;
  canEdit: boolean;
  canTest: boolean;
  connection: {
    phoneNumberId: string | null;
    wabaId: string | null;
    displayName: string | null;
    status: string | null;
    lastTestedAt: string | null;
    lastTestResult: string | null;
  } | null;
  tokenSet: boolean;
  recentEvents?: Array<{ type: string; timestamp: string }>;
  eventsLast24h?: number;
  webhookUrl: string;
  connectionTestEnvMissing?: string[];
  webhookTestEnvMissing?: string[];
  sandboxEnabled?: boolean;
  sandboxWhitelist?: string[];
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN CLIENT COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function ImperiumConnectionsClient({
  workspaceId,
  workspaceSlug,
  canEdit,
  canTest,
  connection,
  tokenSet,
  recentEvents = [],
  eventsLast24h = 0,
  webhookUrl,
  connectionTestEnvMissing = [],
  webhookTestEnvMissing = [],
  sandboxEnabled = false,
  sandboxWhitelist = [],
}: ImperiumConnectionsClientProps) {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversionTracking, setConversionTracking] = useState(true);
  const [localSandboxEnabled, setLocalSandboxEnabled] = useState(sandboxEnabled);
  const [localWhitelist, setLocalWhitelist] = useState(sandboxWhitelist);

  const isConnected = Boolean(connection?.phoneNumberId && tokenSet);
  const connectionStatus = isConnected
    ? "connected"
    : connection?.phoneNumberId
      ? "syncing"
      : "disconnected";

  const searchParamsString = searchParams?.toString() ?? "";
  const embeddedToastHandledRef = useRef(false);

  useEffect(() => {
    const embedded = searchParams?.get("embedded");
    if (!embedded) return;

    const skipToast = embeddedToastHandledRef.current && embedded === "error";
    if (skipToast) {
      embeddedToastHandledRef.current = false;
    }

    if (!skipToast && embedded === "success") {
      toast({
        title: "Embedded Sign Up completed",
        description: "WhatsApp Business connection saved.",
      });
    } else if (!skipToast && embedded === "error") {
      toast({
        title: "Embedded Sign Up failed",
        description: "Retry or use manual connection.",
        variant: "destructive",
      });
    }

    const nextParams = new URLSearchParams(searchParamsString);
    nextParams.delete("embedded");
    const suffix = nextParams.toString();
    router.replace(
      `/${workspaceSlug}/meta-hub/connections${suffix ? `?${suffix}` : ""}`
    );
  }, [router, searchParams, searchParamsString, toast, workspaceSlug]);

  const handleEmbeddedResult = useCallback(
    (result: "success" | "error") => {
      embeddedToastHandledRef.current = result === "error";
      const nextParams = new URLSearchParams(searchParamsString);
      nextParams.set("embedded", result);
      const suffix = nextParams.toString();
      router.replace(`/${workspaceSlug}/meta-hub/connections?${suffix}`);
      router.refresh();
    },
    [router, searchParamsString, workspaceSlug]
  );

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied to clipboard` });
  };

  const handlePingTest = async (): Promise<boolean> => {
    if (webhookTestEnvMissing.length > 0) {
      toast({
        title: "Missing environment variables",
        description: `Set one of ${webhookTestEnvMissing.join(", ")} to enable webhook tests.`,
        variant: "destructive",
      });
      return false;
    }
    if (!canTest) {
      toast({
        title: "Access denied",
        description: "Admin access is required to run webhook tests.",
        variant: "destructive",
      });
      return false;
    }
    try {
      const res = await fetch("/api/meta/whatsapp/webhooks/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.message || data?.reason || "Webhook test failed");
      }
      toast({ title: "Webhook ping successful", description: "Endpoint verified." });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Webhook test failed";
      toast({ title: "Webhook ping failed", description: msg, variant: "destructive" });
      return false;
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-80 animate-pulse rounded-3xl border border-[#d4af37]/20 bg-[#0a1229]/80" />
        <div className="grid gap-6 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Cyber-Batik Parang Background - 4% opacity */}
      <div className="pointer-events-none fixed inset-0 z-0 batik-pattern opacity-[0.04]" />

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
              <span className="text-xs text-[#f5f5dc]/50">Neural Infrastructure</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#f5f5dc]">
              Neural Gateway &amp; Asset Commander
            </h1>
            <p className="mt-2 text-sm text-[#f5f5dc]/60">
              God-Level Integration Center for Meta WhatsApp Business API with military-grade precision.
            </p>
          </div>
        </motion.div>

        {/* Neural Link Hero */}
        <motion.div variants={itemVariants}>
          <NeuralLinkHero
            status={connectionStatus}
            wabaId={connection?.wabaId}
            phoneNumberId={connection?.phoneNumberId}
            displayName={connection?.displayName}
            tokenSet={tokenSet}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
            <span className="text-xs font-semibold tracking-wider text-emerald-300">
              EMBEDDED SIGN UP
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
          </div>

          <WhatsappEmbeddedSignup
            workspaceSlug={workspaceSlug}
            canEdit={canEdit}
            isConnected={isConnected}
            onResult={handleEmbeddedResult}
          />
        </motion.div>

        {/* THE GATEWAY - Connection Form */}
        <motion.div variants={itemVariants}>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
            <span className="text-xs font-semibold tracking-wider text-[#d4af37]">
              THE GATEWAY
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
          </div>

          <WhatsappConnectionForm
            workspaceId={workspaceId}
            workspaceSlug={workspaceSlug}
            canEdit={canEdit}
            canRunTests={canTest}
            connectionTestEnvMissing={connectionTestEnvMissing}
            initialPhoneNumberId={connection?.phoneNumberId ?? null}
            initialWabaId={connection?.wabaId ?? null}
            initialDisplayName={connection?.displayName ?? null}
            status={connection?.status ?? null}
            lastTestedAt={connection?.lastTestedAt ?? null}
            lastTestResult={connection?.lastTestResult ?? null}
            tokenSet={tokenSet}
          />
        </motion.div>

        {/* BUSINESS ASSET VAULT - Meta Business Intelligence */}
        <motion.div variants={itemVariants}>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
            <span className="text-xs font-semibold tracking-wider text-blue-400">
              META BUSINESS INTELLIGENCE
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Business Asset Vault */}
            <BusinessAssetVault
              businessManagerId={null}
              businessName={null}
              verificationStatus={null}
              linkedAssets={null}
              onCopy={handleCopy}
            />

            {/* Event Radar */}
            <EventRadar
              eventsLast24h={eventsLast24h}
              conversionTrackingEnabled={conversionTracking}
              onToggleConversionTracking={() => setConversionTracking(!conversionTracking)}
            />
          </div>
        </motion.div>

        {/* TECHNICAL VAULT - Infrastructure Grid */}
        <motion.div variants={itemVariants}>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
            <span className="text-xs font-semibold tracking-wider text-[#d4af37]">
              TECHNICAL VAULT
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <MonitorCard
              latencyMs={null}
              uptime={null}
              eventsLast24h={eventsLast24h}
            />
            <SandboxSettingsCard
              workspaceId={workspaceId}
              sandboxEnabled={localSandboxEnabled}
              whitelist={localWhitelist}
              canEdit={canEdit}
              onUpdate={(enabled, wl) => {
                setLocalSandboxEnabled(enabled);
                setLocalWhitelist(wl);
              }}
            />
          </div>
        </motion.div>

        {/* WEBHOOK VAULT */}
        <motion.div variants={itemVariants}>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
            <span className="text-xs font-semibold tracking-wider text-cyan-400">
              WEBHOOK VAULT
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
          </div>

          <WebhookStatusCard
            webhookUrl={webhookUrl}
            isVerified={eventsLast24h > 0}
            onPingTest={isConnected ? handlePingTest : undefined}
            onCopy={handleCopy}
            pingDisabledReason={
              webhookTestEnvMissing.length > 0
                ? `Missing env: ${webhookTestEnvMissing.join(", ")}`
                : !canTest
                  ? "Admin access required"
                  : undefined
            }
          />
        </motion.div>

        {/* Webhook Terminal - Live Events */}
        <motion.div variants={itemVariants}>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#e11d48]/40 to-transparent" />
            <span className="text-xs font-semibold tracking-wider text-[#e11d48]">
              WEBHOOK STREAM
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#e11d48]/40 to-transparent" />
          </div>

          <WebhookTerminalCard
            recentEvents={recentEvents}
            workspaceSlug={workspaceSlug}
          />
        </motion.div>

        {/* Health Check Section */}
        <motion.div variants={itemVariants}>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
            <span className="text-xs font-semibold tracking-wider text-emerald-400">
              SYSTEM DIAGNOSTICS
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
          </div>

          <ImperiumHealthCheck
            workspaceId={workspaceId}
            workspaceSlug={workspaceSlug}
          />
        </motion.div>

        {/* Footer */}
        <ImperiumConnectionsFooter />
      </motion.div>
    </div>
  );
}
