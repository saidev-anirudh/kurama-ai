"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useVoiceControls } from "@/store/voice-controls";
import { useVoiceStore } from "@/store/voice-store";

export default function HeroContent() {
  const { ready, enableMic } = useVoiceControls();
  const micAllowed = useVoiceStore((s) => s.micAllowed);
  const mode = useVoiceStore((s) => s.mode);
  const [busy, setBusy] = useState(false);

  async function onInitiate() {
    if (!ready || busy || micAllowed) return;
    setBusy(true);
    try {
      await enableMic();
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 1.8 }}
      className="pointer-events-auto fixed bottom-16 left-1/2 z-40 max-w-2xl -translate-x-1/2 px-4 text-center"
    >
      <div className="mx-auto mb-6 h-12 w-px bg-gradient-to-b from-transparent to-neon-cyan/30" />
      <h1 className="mb-3 font-organic text-4xl italic leading-tight text-foreground lg:text-6xl">
        Intelligence that <span className="text-neon-orange text-glow-orange">breathes</span> with your intent.
      </h1>
      <p className="mx-auto mb-2 max-w-lg font-body text-sm leading-relaxed text-muted-foreground lg:text-base">
        Voice-first Kurama layer: validate, orchestrate, and speak through the same neural mesh you see in the void.
      </p>
      <p className="mx-auto mb-8 max-w-md font-body text-xs uppercase tracking-[0.2em] text-muted-foreground/90">
        {micAllowed
          ? mode === "speaking"
            ? "Core vocalizing — you can still interrupt by speaking."
            : mode === "thinking"
              ? "Reasoning across tools and memory."
              : "Live microphone; ask about Sai, projects, or routes."
          : "Grant microphone access once to open a continuous uplink."}
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        {!micAllowed ? (
          <motion.button
            type="button"
            disabled={!ready || busy}
            onClick={() => void onInitiate()}
            whileHover={ready && !busy ? { scale: 1.05 } : undefined}
            whileTap={ready && !busy ? { scale: 0.95 } : undefined}
            className="inline-flex cursor-pointer items-center justify-center rounded-full bg-neon-orange px-8 py-3 font-display text-xs uppercase tracking-widest text-primary-foreground shadow-[var(--shadow-neon-orange)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {!ready ? "Bootstrapping…" : busy ? "Opening uplink…" : "Initiate uplink"}
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-6 py-2.5 font-display text-[10px] uppercase tracking-[0.25em] text-primary"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Neural link live
          </motion.div>
        )}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            href="/about"
            className="inline-flex items-center justify-center rounded-full border border-border px-8 py-3 font-display text-xs uppercase tracking-widest text-foreground transition-colors hover:bg-secondary/50"
          >
            Observe dossier
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
