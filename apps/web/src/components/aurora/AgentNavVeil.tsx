"use client";

import { motion } from "framer-motion";
import { useVoiceStore } from "@/store/voice-store";

/** Biolume-style overlay during agent-driven navigation while TTS can still play. */
export function AgentNavVeil() {
  const active = useVoiceStore((s) => s.agentNavVeil);
  const target = useVoiceStore((s) => s.agentNavTarget);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[18] overflow-hidden"
      initial={false}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="absolute -inset-[35%] opacity-[0.55]"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, hsl(var(--neon-cyan) / 0.14) 80deg, transparent 160deg, hsl(var(--neon-orange) / 0.12) 240deg, transparent 320deg)",
        }}
        animate={{ rotate: active ? 360 : 0 }}
        transition={
          active
            ? { duration: 14, repeat: Number.POSITIVE_INFINITY, ease: "linear" }
            : { duration: 0.6, ease: "easeOut" }
        }
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/40"
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      />
      {target ? (
        <motion.div
          className="absolute bottom-28 left-1/2 z-[19] -translate-x-1/2 font-display text-[10px] uppercase tracking-[0.35em] text-primary/90 text-glow-cyan"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: active ? 1 : 0, y: active ? 0 : 8 }}
          transition={{ duration: 0.35 }}
        >
          Routing · {target}
        </motion.div>
      ) : null}
    </motion.div>
  );
}
