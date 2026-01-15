"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

export function AuthTrustBadge() {
  return (
    <div className="flex justify-center">
      <Link href="/trust" className="group">
        <motion.div
          className="relative inline-flex items-center gap-2 rounded-full border border-[#d4af37]/40 bg-gradient-to-r from-[#d4af37]/15 to-[#f9d976]/10 px-4 py-2 text-xs font-medium text-[#d4af37] shadow-lg shadow-[#d4af37]/10 transition-all hover:border-[#d4af37]/60 hover:shadow-[#d4af37]/25"
          animate={{
            boxShadow: [
              "0 0 20px rgba(212, 175, 55, 0.1)",
              "0 0 30px rgba(212, 175, 55, 0.2)",
              "0 0 20px rgba(212, 175, 55, 0.1)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Shield className="h-3.5 w-3.5" />
          <span className="font-semibold tracking-wide">
            Official Technology Provider — WhatsApp Business Platform
          </span>
        </motion.div>
      </Link>
    </div>
  );
}
