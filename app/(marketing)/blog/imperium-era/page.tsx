"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  MessageSquare,
  Bot,
  Palette,
  LayoutGrid,
  Store,
  Trophy,
  CreditCard,
  Users,
  TrendingUp,
  Shield,
  Lock,
  Calendar,
  Clock,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Zap,
  Globe,
  type LucideIcon,
} from "lucide-react";

/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
   10-PILLAR DATA
   ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */
type Pillar = {
  id: string;
  name: string;
  tagline: string;
  icon: LucideIcon;
  active: boolean;
};

const PILLARS: Pillar[] = [
  { id: "platform", name: "Platform", tagline: "Multi-tenant SaaS backbone", icon: Building2, active: true },
  { id: "meta-hub", name: "Meta Hub", tagline: "WhatsApp & Meta integrations", icon: MessageSquare, active: true },
  { id: "helper", name: "Helper", tagline: "AI-powered assistant", icon: Bot, active: true },
  { id: "studio", name: "Studio", tagline: "Template & content builder", icon: Palette, active: true },
  { id: "apps", name: "Apps", tagline: "Micro-app marketplace", icon: LayoutGrid, active: true },
  { id: "marketplace", name: "Marketplace", tagline: "Solution directory", icon: Store, active: true },
  { id: "arena", name: "Arena", tagline: "Gamification & leaderboards", icon: Trophy, active: true },
  { id: "pay", name: "Pay", tagline: "Embedded payments", icon: CreditCard, active: false },
  { id: "community", name: "Community", tagline: "Forums & groups", icon: Users, active: false },
  { id: "trade", name: "Trade", tagline: "Commerce automation", icon: TrendingUp, active: false },
];

/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
   ANIMATION VARIANTS
   ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const pillarVariant = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
   ARTICLE METADATA
   ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */
const ARTICLE = {
  title: "Introducing Gigaviz Imperium v2.0",
  subtitle: "A New Era of Trust, Design, and Digital Excellence",
  date: "January 16, 2026",
  readTime: "8 min read",
  author: "Gigaviz Team",
};

/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
   MAIN COMPONENT
   ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */
export default function ImperiumEraBlogPage() {
  return (
    <main className="flex-1">
      {/* ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
          HERO SECTION
         ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <header className="relative overflow-hidden border-b border-[#d4af37]/20">
        {/* Ambient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#050a18] via-[#0a1229] to-[#050a18]" />
          <div className="absolute left-1/4 top-1/4 h-[600px] w-[600px] animate-pulse rounded-full bg-[#d4af37]/5 blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] animate-pulse rounded-full bg-[#e11d48]/5 blur-[120px] [animation-delay:2s]" />
        </div>

        <div className="container relative mx-auto px-4 py-16 md:py-24">
          {/* Back link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              href="/blog"
              className="mb-8 inline-flex items-center gap-2 text-sm text-[#f5f5dc]/60 transition-colors hover:text-[#d4af37]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>
          </motion.div>

          {/* Verified Badge */}
          <motion.div
            className="mb-6 flex justify-center md:justify-start"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 rounded-full border border-[#d4af37]/40 bg-gradient-to-r from-[#d4af37]/15 to-[#f9d976]/10 px-4 py-2 text-xs font-semibold tracking-wide text-[#d4af37]"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(212, 175, 55, 0.1)",
                  "0 0 35px rgba(212, 175, 55, 0.25)",
                  "0 0 20px rgba(212, 175, 55, 0.1)",
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Shield className="h-4 w-4" />
              Official Technology Provider ΓÇö WhatsApp Business Platform
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="mb-4 max-w-4xl bg-gradient-to-r from-[#d4af37] via-[#f9d976] to-[#d4af37] bg-clip-text text-center text-4xl font-bold tracking-tight text-transparent md:text-left md:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {ARTICLE.title}
          </motion.h1>

          <motion.p
            className="mb-8 max-w-2xl text-center text-lg text-[#f5f5dc]/70 md:text-left md:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {ARTICLE.subtitle}
          </motion.p>

          {/* Meta info */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-4 text-sm text-[#f5f5dc]/50 md:justify-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {ARTICLE.date}
            </span>
            <span className="text-[#d4af37]/40">ΓÇó</span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {ARTICLE.readTime}
            </span>
            <span className="text-[#d4af37]/40">ΓÇó</span>
            <span>{ARTICLE.author}</span>
          </motion.div>
        </div>
      </header>

      {/* ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
          ARTICLE CONTENT
         ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <article className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl space-y-16">
          {/* Section 1: The Milestone */}
          <motion.section
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="relative rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/60 p-8 backdrop-blur-xl md:p-12"
          >
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-[#d4af37]/20 via-transparent to-[#e11d48]/20 opacity-50" />
            <div className="relative space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4af37]/20 text-[#d4af37]">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#d4af37] md:text-3xl">
                  The Milestone: Official Meta Verification
                </h2>
              </div>

              <p className="text-[#f5f5dc]/80 leading-relaxed">
                On <strong className="text-[#d4af37]">January 15, 2026</strong>, Gigaviz achieved a significant milestone: 
                official recognition as a <strong className="text-[#f5f5dc]">Technology Provider</strong> on the WhatsApp Business Platform.
              </p>

              <p className="text-[#f5f5dc]/80 leading-relaxed">
                This verification ΓÇö visible directly in Meta&apos;s Business Manager and the official Tech Provider Directory ΓÇö 
                confirms that Gigaviz meets Meta&apos;s technical, security, and policy requirements for building on their platform.
              </p>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { icon: Shield, label: "Verified Status", value: "Technology Provider" },
                  { icon: Calendar, label: "Verification Date", value: "January 6, 2026" },
                  { icon: Globe, label: "Platform", value: "WhatsApp Business" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-[#d4af37]/10 bg-[#050a18]/50 p-4 text-center"
                  >
                    <item.icon className="mx-auto mb-2 h-5 w-5 text-[#d4af37]" />
                    <p className="text-xs text-[#f5f5dc]/50">{item.label}</p>
                    <p className="font-semibold text-[#f5f5dc]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Section 2: The New Identity */}
          <motion.section
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-8"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e11d48]/20 text-[#e11d48]">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-[#f5f5dc] md:text-3xl">
                The Imperium Identity
              </h2>
            </div>

            <p className="text-[#f5f5dc]/80 leading-relaxed">
              With this new chapter comes a new visual identity. <strong className="text-[#d4af37]">Imperium v2.0</strong> introduces 
              a refined color palette that embodies authority, trust, and sophistication.
            </p>

            {/* Color Palette Showcase */}
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { name: "Deep Navy", hex: "#050a18", desc: "Foundation & backgrounds" },
                { name: "Imperial Gold", hex: "#d4af37", desc: "Primary accents & CTAs" },
                { name: "Regal Magenta", hex: "#e11d48", desc: "Focus states & highlights" },
                { name: "Cream", hex: "#f5f5dc", desc: "Typography & content" },
              ].map((color) => (
                <motion.div
                  key={color.name}
                  className="group relative overflow-hidden rounded-xl border border-[#d4af37]/10 bg-[#0a1229]/40 p-4"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
                >
                  <div
                    className="mb-3 h-16 rounded-lg border border-white/10"
                    style={{ backgroundColor: color.hex }}
                  />
                  <p className="font-semibold text-[#f5f5dc]">{color.name}</p>
                  <p className="font-mono text-xs text-[#d4af37]">{color.hex}</p>
                  <p className="mt-1 text-xs text-[#f5f5dc]/50">{color.desc}</p>
                </motion.div>
              ))}
            </div>

            <p className="text-[#f5f5dc]/80 leading-relaxed">
              Every element ΓÇö from the constellation-patterned backgrounds to the glassmorphic cards ΓÇö 
              has been crafted to reflect the premium, enterprise-grade nature of the Gigaviz ecosystem.
            </p>
          </motion.section>

          {/* Section 3: The 10-Pillar Ecosystem */}
          <motion.section
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-8"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4af37]/20 text-[#d4af37]">
                <Zap className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-[#f5f5dc] md:text-3xl">
                The 10-Pillar Ecosystem
              </h2>
            </div>

            <p className="text-[#f5f5dc]/80 leading-relaxed">
              Gigaviz is not a single product ΓÇö it&apos;s an interconnected ecosystem of 10 specialized modules, 
              each designed to handle a specific domain of digital operations. Together, they form a complete 
              infrastructure for modern businesses.
            </p>

            {/* 10-Pillar Grid */}
            <motion.div
              className="grid grid-cols-2 gap-4 sm:grid-cols-5"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <motion.div
                    key={pillar.id}
                    variants={pillarVariant}
                    className={`group relative rounded-xl border p-4 text-center transition-all ${
                      pillar.active
                        ? "border-[#d4af37]/30 bg-[#0a1229]/60 hover:border-[#d4af37]/60 hover:bg-[#d4af37]/10"
                        : "border-white/10 bg-[#0a1229]/30"
                    }`}
                  >
                    <div
                      className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                        pillar.active
                          ? "bg-[#d4af37]/20 text-[#d4af37] group-hover:bg-[#d4af37]/30"
                          : "bg-white/5 text-[#f5f5dc]/30"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    <h3
                      className={`font-semibold ${
                        pillar.active ? "text-[#f5f5dc]" : "text-[#f5f5dc]/40"
                      }`}
                    >
                      {pillar.name}
                    </h3>
                    <p
                      className={`mt-1 text-xs ${
                        pillar.active ? "text-[#f5f5dc]/60" : "text-[#f5f5dc]/30"
                      }`}
                    >
                      {pillar.tagline}
                    </p>

                    {/* Coming Soon badge */}
                    {!pillar.active && (
                      <div className="absolute -right-1 -top-1 flex items-center gap-1 rounded-full bg-[#e11d48] px-2 py-0.5 text-[10px] font-medium text-white">
                        <Lock className="h-2.5 w-2.5" />
                        Soon
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.section>

          {/* Section 4: What This Means */}
          <motion.section
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="relative rounded-2xl border border-[#e11d48]/20 bg-gradient-to-br from-[#e11d48]/5 to-[#d4af37]/5 p-8 md:p-12"
          >
            <h2 className="mb-6 text-2xl font-bold text-[#f5f5dc] md:text-3xl">
              What This Means for You
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              {[
                {
                  title: "Enterprise-Grade Trust",
                  desc: "Build on a platform that meets Meta's rigorous technical and security standards.",
                },
                {
                  title: "Unified Operations",
                  desc: "Connect all your digital touchpoints through one cohesive ecosystem.",
                },
                {
                  title: "Future-Proof Architecture",
                  desc: "Benefit from continuous updates as we expand to all 10 pillars.",
                },
                {
                  title: "Policy-First Design",
                  desc: "Operate with confidence knowing the platform prioritizes compliance.",
                },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#d4af37]/20 text-[#d4af37]">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#f5f5dc]">{item.title}</h3>
                    <p className="text-sm text-[#f5f5dc]/60">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* CTA Section */}
          <motion.section
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center"
          >
            <h2 className="mb-4 text-2xl font-bold text-[#f5f5dc] md:text-3xl">
              Ready to Enter the Imperium?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-[#f5f5dc]/60">
              Join thousands of businesses building on a verified, enterprise-grade platform.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f9d976] px-8 py-3 font-semibold text-[#050a18] shadow-lg shadow-[#d4af37]/25 transition-all hover:scale-105 hover:shadow-[#d4af37]/40"
              >
                <Sparkles className="h-4 w-4" />
                Get Started Free
              </Link>
              <Link
                href="/trust"
                className="inline-flex items-center gap-2 rounded-xl border border-[#d4af37]/30 bg-[#0a1229]/60 px-8 py-3 font-semibold text-[#f5f5dc] transition-all hover:border-[#d4af37]/60 hover:bg-[#d4af37]/10"
              >
                <Shield className="h-4 w-4" />
                View Verification
              </Link>
            </div>
          </motion.section>
        </div>
      </article>

      

    </main>
  );
}
