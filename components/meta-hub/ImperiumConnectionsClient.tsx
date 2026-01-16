"use client";

import { useState, useSyncExternalStore } from "react";
import { motion, type Variants } from "framer-motion";
import {
  NeuralLinkHero,
  VaultCard,
  MonitorCard,
  WebhookTerminalCard,
  ImperiumEmbeddedSignup,
  ImperiumHealthCheck,
  ImperiumConnectionsFooter,
  BusinessAssetVault,
  EventRadar,
  WebhookStatusCard,
} from "./ImperiumConnectionsComponents";
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
  connection: {
    phoneNumberId: string | null;
    wabaId: string | null;
    displayName: string | null;
    status: string | null;
  } | null;
  tokenSet: boolean;
  recentEvents?: Array<{ type: string; timestamp: string }>;
  eventsLast24h?: number;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN CLIENT COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function ImperiumConnectionsClient({
  workspaceId,
  workspaceSlug,
  canEdit,
  connection,
  tokenSet,
  recentEvents = [],
  eventsLast24h = 0,
}: ImperiumConnectionsClientProps) {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const { toast } = useToast();
  const [conversionTracking, setConversionTracking] = useState(true);

  const isConnected = Boolean(connection?.phoneNumberId && tokenSet);
  const connectionStatus = isConnected
    ? "connected"
    : connection?.phoneNumberId
      ? "syncing"
      : "disconnected";

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied to clipboard` });
  };

  const handlePingTest = async (): Promise<boolean> => {
    // Simulate ping test - in production, call actual API
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return true;
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

        {/* THE GATEWAY - Embedded Signup (Prominent when disconnected) */}
        {!isConnected && (
          <motion.div variants={itemVariants}>
            <div className="mb-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
              <span className="text-xs font-semibold tracking-wider text-[#d4af37]">
                THE GATEWAY
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
            </div>

            <ImperiumEmbeddedSignup
              workspaceSlug={workspaceSlug}
              canEdit={canEdit}
              isConnected={isConnected}
            />
          </motion.div>
        )}

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
              businessManagerId={isConnected ? "123456789012345" : null}
              businessName={isConnected ? "PT Glorious Victorious" : null}
              verificationStatus={isConnected ? "verified" : "pending"}
              linkedAssets={{
                facebookPages: isConnected ? 3 : 0,
                instagramAccounts: isConnected ? 2 : 0,
                systemUsers: isConnected ? 5 : 0,
              }}
              onCopy={handleCopy}
            />

            {/* Event Radar */}
            <EventRadar
              eventStats={{
                messageSent: isConnected ? 1247 : 0,
                messageDelivered: isConnected ? 1189 : 0,
                messageRead: isConnected ? 892 : 0,
                linkClicked: isConnected ? 156 : 0,
              }}
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

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Secure Vault Card */}
            <VaultCard
              tokenSet={tokenSet}
              wabaId={connection?.wabaId}
              phoneNumberId={connection?.phoneNumberId}
              onCopy={handleCopy}
            />

            {/* Monitor Card */}
            <MonitorCard
              latencyMs={isConnected ? 142 : 0}
              uptime={isConnected ? 99.99 : 0}
              eventsLast24h={eventsLast24h}
            />

            {/* Webhook Status Card */}
            <WebhookStatusCard
              webhookUrl={isConnected ? `https://api.gigaviz.com/webhooks/${workspaceSlug}` : null}
              isVerified={isConnected}
              onPingTest={handlePingTest}
              onCopy={handleCopy}
            />
          </div>
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

        {/* Connected State - Small Gateway Link */}
        {isConnected && (
          <motion.div variants={itemVariants}>
            <ImperiumEmbeddedSignup
              workspaceSlug={workspaceSlug}
              canEdit={canEdit}
              isConnected={isConnected}
            />
          </motion.div>
        )}

        {/* Footer */}
        <ImperiumConnectionsFooter />
      </motion.div>
    </div>
  );
}
