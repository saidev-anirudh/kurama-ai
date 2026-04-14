"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useVoiceControls } from "@/store/voice-controls";
import { useVoiceStore } from "@/store/voice-store";

const navItems = [
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Timeline", href: "/career-timeline" },
  { label: "Blog", href: "/blog" },
  { label: "Passions", href: "/passions" },
  { label: "Now", href: "/now" },
  { label: "Labs", href: "/labs" },
  { label: "Contact", href: "/contact" },
];

export default function HudNav() {
  const { ready, enableMic } = useVoiceControls();
  const micAllowed = useVoiceStore((s) => s.micAllowed);
  const [busy, setBusy] = useState(false);

  async function onVoiceNav() {
    if (!ready || busy || micAllowed) return;
    setBusy(true);
    try {
      await enableMic();
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="fixed top-0 w-full z-50 p-6 flex justify-between items-start pointer-events-none"
    >
      <Link href="/" className="pointer-events-auto flex flex-col gap-1 text-left">
        <span className="text-xs font-display tracking-[0.3em] uppercase text-neon-cyan text-glow-cyan">Kurama / Core</span>
        <span className="text-[10px] tracking-widest text-muted-foreground uppercase font-body">Neural Interface v7.4</span>
      </Link>

      <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-3">
        {navItems.map((item, i) => (
          <motion.div
            key={item.href}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
          >
            <Link href={item.href} className={cn("nav-chip text-foreground/70 hover:text-primary inline-block")}>
              {item.label}
            </Link>
          </motion.div>
        ))}
        {!micAllowed ? (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 1.35 }}
            disabled={!ready || busy}
            onClick={() => void onVoiceNav()}
            whileHover={ready && !busy ? { scale: 1.04 } : undefined}
            whileTap={ready && !busy ? { scale: 0.96 } : undefined}
            className={cn(
              "nav-chip border-neon-orange/45 bg-neon-orange/15 text-neon-orange hover:border-neon-orange/70",
              (!ready || busy) && "pointer-events-none opacity-50",
            )}
          >
            {busy ? "Uplink…" : !ready ? "Boot" : "Initiate"}
          </motion.button>
        ) : (
          <motion.span
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className="nav-chip border-primary/35 bg-primary/10 text-primary"
          >
            Live
          </motion.span>
        )}
        <div className="ml-2 px-4 py-2 bg-neon-orange/10 border border-neon-orange/40 rounded-full flex items-center gap-3">
          <div className="size-1.5 rounded-full bg-neon-orange animate-pulse" />
          <span className="text-[10px] tracking-widest uppercase text-neon-orange font-body font-medium">Online</span>
        </div>
      </div>
    </motion.nav>
  );
}
