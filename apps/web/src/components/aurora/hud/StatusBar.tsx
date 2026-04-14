"use client";

import { motion } from "framer-motion";
import { useVoiceStore } from "@/store/voice-store";

function fmtMs(v: number | null) {
  if (v == null) return "—";
  return `${v}`;
}

export default function StatusBar() {
  const mode = useVoiceStore((s) => s.mode);
  const micAllowed = useVoiceStore((s) => s.micAllowed);
  const linkRttMs = useVoiceStore((s) => s.linkRttMs);
  const lastPipelineMs = useVoiceStore((s) => s.lastPipelineMs);

  const loadLabel =
    mode === "thinking" ? "Compute" : mode === "speaking" ? "Vocal" : mode === "listening" ? "Auditory" : "Idle";
  const estTemp = 36 + (mode === "thinking" ? 6 : mode === "speaking" ? 4 : mode === "listening" ? 2 : 0);

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 2.2 }}
      className="fixed bottom-0 z-50 flex w-full items-center justify-between border-t border-border bg-background/60 px-6 py-4 backdrop-blur-sm md:px-8"
    >
      <div className="flex gap-6 md:gap-10">
        <div>
          <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Core load</div>
          <span className="font-display text-sm tabular-nums text-foreground/90">
            {loadLabel}
            <span className="ml-1.5 text-[9px] text-muted-foreground">~{estTemp}°C</span>
          </span>
        </div>
        <div>
          <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Link RTT</div>
          <span className="font-display text-sm tabular-nums text-foreground/90">
            {fmtMs(linkRttMs)}
            <span className="ml-1 text-[9px] text-neon-cyan">ms</span>
          </span>
        </div>
        <div className="hidden sm:block">
          <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Last pipeline</div>
          <span className="font-display text-sm tabular-nums text-foreground/90">
            {fmtMs(lastPipelineMs)}
            <span className="ml-1 text-[9px] text-neon-orange">ms</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`size-2 rounded-full ${micAllowed ? "animate-pulse bg-neon-cyan" : "bg-muted-foreground/50"}`}
          style={micAllowed ? { boxShadow: "0 0 8px hsl(185 100% 50%)" } : undefined}
        />
        <span className="font-body text-[10px] uppercase tracking-widest text-neon-cyan">
          {micAllowed ? `Uplink · ${mode}` : "Awaiting initiate"}
        </span>
      </div>
    </motion.footer>
  );
}
