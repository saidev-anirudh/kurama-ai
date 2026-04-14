"use client";

import { motion } from "framer-motion";

export default function HudOverlay() {
  return (
    <>
      <div className="fixed top-4 left-4 size-5 border-l border-t border-neon-cyan/40 z-40" />
      <div className="fixed top-4 right-4 size-5 border-r border-t border-neon-cyan/40 z-40" />
      <div className="fixed bottom-4 left-4 size-5 border-l border-b border-neon-cyan/40 z-40" />
      <div className="fixed bottom-4 right-4 size-5 border-r border-b border-neon-cyan/40 z-40" />

      <div className="fixed top-1/2 left-4 -translate-y-1/2 w-px h-32 bg-gradient-to-b from-transparent via-neon-cyan/30 to-transparent z-40" />
      <div className="fixed top-1/2 right-4 -translate-y-1/2 w-px h-32 bg-gradient-to-b from-transparent via-neon-cyan/30 to-transparent z-40" />

      <div className="fixed inset-0 scanline-overlay opacity-20 z-30 pointer-events-none" />

      <div className="fixed inset-0 hud-grid z-0 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="fixed left-8 bottom-24 z-40 animate-float"
      >
        <div className="hud-panel p-4 border-l-2 border-l-neon-cyan/50 rounded-sm">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Synaptic Flow</div>
          <div className="text-xl tabular-nums font-light text-foreground">
            1,402 <span className="text-xs text-neon-cyan">TH/s</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 1.5 }}
        className="fixed right-8 bottom-32 z-40 animate-float"
        style={{ animationDelay: "2s" }}
      >
        <div className="hud-panel p-4 border-r-2 border-r-neon-orange/50 rounded-sm">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Growth Ratio</div>
          <div className="text-xl tabular-nums font-light text-foreground">
            +84.2<span className="text-xs text-neon-orange">%</span>
          </div>
        </div>
      </motion.div>
    </>
  );
}
