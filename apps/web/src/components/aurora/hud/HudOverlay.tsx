"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useVoiceStore } from "@/store/voice-store";

function measureLinkRtt(): Promise<number | null> {
  const t0 = performance.now();
  return fetch("/api/speech/token")
    .then(async (response) => {
      if (!response.ok) return null;
      await response.json();
      return Math.round(performance.now() - t0);
    })
    .catch(() => null);
}

export default function HudOverlay() {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const lastPipelineMs = useVoiceStore((s) => s.lastPipelineMs);
  const linkRttMs = useVoiceStore((s) => s.linkRttMs);
  const mode = useVoiceStore((s) => s.mode);
  const micAllowed = useVoiceStore((s) => s.micAllowed);
  const setVoiceMetrics = useVoiceStore((s) => s.setVoiceMetrics);

  const refreshLink = useCallback(async () => {
    const ms = await measureLinkRtt();
    if (ms != null) setVoiceMetrics({ linkRttMs: ms });
  }, [setVoiceMetrics]);

  useEffect(() => {
    void refreshLink();
    const id = window.setInterval(() => void refreshLink(), 8000);
    return () => window.clearInterval(id);
  }, [refreshLink]);

  const fmt = (v: number | null) => (v == null ? "—" : `${v}`);

  return (
    <>
      <div className="fixed top-4 left-4 z-40 size-5 border-l border-t border-neon-cyan/40" />
      <div className="fixed top-4 right-4 z-40 size-5 border-r border-t border-neon-cyan/40" />
      <div className="fixed bottom-4 left-4 z-40 size-5 border-l border-b border-neon-cyan/40" />
      <div className="fixed bottom-4 right-4 z-40 size-5 border-r border-b border-neon-cyan/40" />

      <div className="fixed top-1/2 left-4 z-40 h-32 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-neon-cyan/30 to-transparent" />
      <div className="fixed top-1/2 right-4 z-40 h-32 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-neon-cyan/30 to-transparent" />

      <div className="pointer-events-none fixed inset-0 z-30 scanline-overlay opacity-20" />

      <div className="pointer-events-none fixed inset-0 z-0 hud-grid" />

      {/* Left: collapsible telemetry (Aurora-style spring + float) */}
      <div className="pointer-events-auto fixed bottom-24 left-0 z-40 flex items-stretch">
        <motion.div
          className="flex"
          initial={false}
          animate={{ x: leftOpen ? 0 : -272 }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
        >
          <aside className="hud-panel w-64 rounded-r-sm border border-l-0 border-neon-cyan/35 p-4 shadow-[0_0_32px_hsl(var(--neon-cyan)/0.08)]">
            <div className="mb-3 text-[10px] font-display uppercase tracking-[0.28em] text-muted-foreground">Telemetry</div>
            <div className="space-y-3">
              <div>
                <div className="mb-0.5 text-[9px] font-display uppercase tracking-widest text-muted-foreground">Link RTT</div>
                <div className="font-display text-xl font-light tabular-nums text-foreground">
                  {fmt(linkRttMs)}
                  <span className="ml-1 text-xs text-neon-cyan">ms</span>
                </div>
                <p className="mt-1 text-[9px] leading-snug text-muted-foreground">Edge → speech token proxy</p>
              </div>
              <div className="border-t border-border/80 pt-3">
                <div className="mb-0.5 text-[9px] font-display uppercase tracking-widest text-muted-foreground">Orchestrate</div>
                <div className="font-display text-xl font-light tabular-nums text-foreground">
                  {fmt(lastPipelineMs)}
                  <span className="ml-1 text-xs text-neon-orange">ms</span>
                </div>
                <p className="mt-1 text-[9px] leading-snug text-muted-foreground">Validate + gateway round-trip</p>
              </div>
            </div>
          </aside>
          <motion.button
            type="button"
            onClick={() => setLeftOpen((o) => !o)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex w-8 shrink-0 flex-col items-center justify-center gap-1 self-center rounded-r-md border border-l-0 border-border bg-card/85 font-display text-[10px] uppercase tracking-widest text-neon-cyan shadow-[inset_0_0_12px_hsl(var(--neon-cyan)/0.06)]"
            aria-expanded={leftOpen}
            aria-label={leftOpen ? "Collapse telemetry" : "Expand telemetry"}
          >
            <span className="text-xs">{leftOpen ? "⟨" : "⟩"}</span>
            <span className="max-w-[6px] break-all text-[7px] leading-tight text-muted-foreground">HUD</span>
          </motion.button>
        </motion.div>
      </div>

      {/* Right: uplink status drawer */}
      <div className="pointer-events-auto fixed bottom-32 right-0 z-40 flex flex-row-reverse items-stretch">
        <motion.div
          className="flex flex-row-reverse"
          initial={false}
          animate={{ x: rightOpen ? 0 : 272 }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
        >
          <aside className="hud-panel w-56 rounded-l-sm border border-r-0 border-neon-orange/35 p-4 shadow-[0_0_28px_hsl(var(--neon-orange)/0.1)]">
            <div className="mb-3 text-[10px] font-display uppercase tracking-[0.28em] text-muted-foreground">Uplink</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${micAllowed}-${mode}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                <div className="font-display text-sm uppercase tracking-[0.2em] text-foreground">
                  {micAllowed ? mode : "standby"}
                </div>
                <p className="mt-2 text-[9px] leading-relaxed text-muted-foreground">
                  {micAllowed ? "Biolume core synced to your microphone." : "Initiate from hero or nav to open the audio channel."}
                </p>
              </motion.div>
            </AnimatePresence>
          </aside>
          <motion.button
            type="button"
            onClick={() => setRightOpen((o) => !o)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex w-8 shrink-0 flex-col items-center justify-center gap-1 self-center rounded-l-md border border-r-0 border-border bg-card/85 font-display text-[10px] uppercase tracking-widest text-neon-orange shadow-[inset_0_0_12px_hsl(var(--neon-orange)/0.06)]"
            aria-expanded={rightOpen}
            aria-label={rightOpen ? "Collapse uplink panel" : "Expand uplink panel"}
          >
            <span className="text-xs">{rightOpen ? "⟩" : "⟨"}</span>
            <span className="max-w-[6px] break-all text-[7px] leading-tight text-muted-foreground">LNK</span>
          </motion.button>
        </motion.div>
      </div>
    </>
  );
}
