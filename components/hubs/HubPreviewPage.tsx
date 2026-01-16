"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Clock, ArrowRight, CheckCircle2, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import type { HubDef } from "@/lib/hubs";
import { COPY_EN } from "@/lib/copy/en";

export function HubPreviewPage({ hub, workspaceSlug }: { hub: HubDef; workspaceSlug: string }) {
  const { toast } = useToast();
  const isOpen = hub.status === "OPEN";
  const targetHref = `/${workspaceSlug}/${hub.slug}`;
  const copy = COPY_EN.hubs;

  return (
    <div className="relative space-y-6">
      {/* Cyber-Batik Pattern Background */}
      <div className="pointer-events-none fixed inset-0 batik-pattern opacity-[0.03]" aria-hidden />

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge
              className={`border uppercase tracking-widest text-[10px] font-bold ${
                isOpen
                  ? "border-[#10b981]/40 bg-[#10b981]/15 text-[#10b981]"
                  : "border-[#d4af37]/40 bg-[#d4af37]/15 text-[#d4af37]"
              }`}
            >
              {isOpen ? (
                <>
                  <span className="relative mr-1.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10b981]" />
                  </span>
                  {copy.statusOpen}
                </>
              ) : (
                <>
                  <Clock className="mr-1.5 h-3 w-3" />
                  {copy.statusComingSoon}
                </>
              )}
            </Badge>
            <span className="text-xs text-[#f5f5dc]/40">{copy.workspacePreview}</span>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37]">{copy.overview}</p>
            <p className="text-sm text-[#f5f5dc]/60">{hub.title}</p>
            <h1 className="mt-1 text-2xl font-bold md:text-3xl">
              <span className="bg-gradient-to-r from-[#d4af37] via-[#f9d976] to-[#d4af37] bg-clip-text text-transparent">
                {hub.description}
              </span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOpen ? (
            <Link href={targetHref}>
              <Button className="bg-gradient-to-r from-[#d4af37] to-[#f9d976] text-[#050a18] font-semibold hover:from-[#f9d976] hover:to-[#d4af37] shadow-lg shadow-[#d4af37]/20">
                {copy.open}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              onClick={() => toast({ title: copy.notifyToast })}
              className="border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 hover:border-[#d4af37]/50"
            >
              <Bell className="mr-2 h-4 w-4" />
              {copy.notifyMe}
            </Button>
          )}
        </div>
      </motion.div>

      {/* How It Works Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-6 backdrop-blur-xl"
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background: "radial-gradient(ellipse at top right, rgba(212, 175, 55, 0.08) 0%, transparent 50%)",
          }}
          aria-hidden
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-[#d4af37]" />
            <h2 className="text-base font-semibold text-[#f5f5dc]">{copy.howItWorks}</h2>
          </div>
          <ol className="space-y-4">
            {hub.flow.map((step, idx) => (
              <motion.li
                key={step.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="flex gap-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10 text-sm font-bold text-[#d4af37]">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#f5f5dc]">{step.title}</p>
                  <p className="text-sm text-[#f5f5dc]/60">{step.desc}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </motion.div>

      {/* What You Can Do Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative overflow-hidden rounded-2xl border border-[#d4af37]/15 bg-[#0a1229]/60 p-6 backdrop-blur-xl"
      >
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
          <h2 className="text-base font-semibold text-[#f5f5dc]">{copy.whatYouCanDo}</h2>
        </div>
        <ul className="grid gap-2 md:grid-cols-2">
          {hub.bullets.map((item, idx) => (
            <motion.li
              key={item}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + idx * 0.05 }}
              className="rounded-xl border border-[#d4af37]/10 bg-[#050a18]/50 px-4 py-3 text-sm text-[#f5f5dc]/80 transition-all hover:border-[#d4af37]/30 hover:bg-[#d4af37]/5"
            >
              {item}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* What's Next - Coming Soon Modules */}
      {!isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative overflow-hidden rounded-2xl border border-[#e11d48]/20 bg-[#0a1229]/60 p-6 backdrop-blur-xl"
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              background: "radial-gradient(ellipse at bottom left, rgba(225, 29, 72, 0.08) 0%, transparent 50%)",
            }}
            aria-hidden
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-[#e11d48]" />
              <h2 className="text-base font-semibold text-[#f5f5dc]">{copy.whatsNext}</h2>
            </div>
            <p className="text-sm text-[#f5f5dc]/60 mb-4">{copy.whatsNextBody}</p>
            
            {/* Awaiting Sovereignty Empty State */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#d4af37]/30 bg-[#050a18]/30 p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10">
                <Clock className="h-8 w-8 text-[#d4af37]" />
              </div>
              <p className="text-sm font-semibold text-[#d4af37]">Awaiting Sovereignty</p>
              <p className="mt-1 text-xs text-[#f5f5dc]/50">This pillar is being prepared for the Empire.</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast({ title: copy.notifyToast })}
                className="mt-4 border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10"
              >
                <Bell className="mr-2 h-3.5 w-3.5" />
                {copy.notifyMe}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
