"use client";

import { motion } from "framer-motion";

export default function StatusBar() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 2.2 }}
      className="fixed bottom-0 w-full px-8 py-4 border-t border-border bg-background/60 backdrop-blur-sm z-50 flex justify-between items-center"
    >
      <div className="flex gap-8">
        <div>
          <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Core Temp</div>
          <span className="text-sm font-display text-foreground/80 tabular-nums">42°C</span>
        </div>
        <div>
          <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Latency</div>
          <span className="text-sm font-display text-foreground/80 tabular-nums">
            0.003<span className="text-[9px] text-neon-cyan ml-1">ms</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="size-2 bg-neon-cyan animate-pulse rounded-full"
          style={{ boxShadow: "0 0 8px hsl(185 100% 50%)" }}
        />
        <span className="text-[10px] text-neon-cyan font-body tracking-widest uppercase">System Ready</span>
      </div>
    </motion.footer>
  );
}
