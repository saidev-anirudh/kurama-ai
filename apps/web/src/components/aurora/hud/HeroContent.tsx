"use client";

import { motion } from "framer-motion";

export default function HeroContent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 1.8 }}
      className="fixed bottom-16 left-1/2 -translate-x-1/2 text-center max-w-2xl z-40 px-4"
    >
      <div className="w-px h-12 bg-gradient-to-b from-transparent to-neon-cyan/30 mx-auto mb-6" />
      <h1 className="font-organic italic text-4xl lg:text-6xl text-foreground mb-4 leading-tight">
        Intelligence that <span className="text-neon-orange text-glow-orange">breathes</span> with your intent.
      </h1>
      <p className="text-muted-foreground font-body text-sm lg:text-base max-w-lg mx-auto leading-relaxed mb-8">
        A fluid-state neural processor that adapts its architectural geometry to the complexity of your queries.
      </p>
      <div className="flex gap-4 justify-center">
        <motion.a
          href="#kurama-voice"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex px-8 py-3 bg-neon-orange text-primary-foreground font-display text-xs uppercase tracking-widest rounded-full cursor-pointer"
          style={{ boxShadow: "var(--shadow-neon-orange)" }}
        >
          Initiate
        </motion.a>
        <motion.a
          href="/about"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex px-8 py-3 border border-border text-foreground font-display text-xs uppercase tracking-widest rounded-full hover:bg-secondary/50 transition-colors cursor-pointer"
        >
          Observe
        </motion.a>
      </div>
    </motion.div>
  );
}
