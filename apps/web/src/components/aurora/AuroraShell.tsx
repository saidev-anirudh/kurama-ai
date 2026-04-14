"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AssistantShell } from "@/components/kurama/assistant-shell";
import HudNav from "./hud/HudNav";
import HudOverlay from "./hud/HudOverlay";
import HeroContent from "./hud/HeroContent";
import StatusBar from "./hud/StatusBar";

const SceneCanvas = dynamic(() => import("./three/SceneCanvas"), { ssr: false });

export function AuroraShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative text-foreground">
      <SceneCanvas />

      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-background/30 to-background z-[1] pointer-events-none" />
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 40%, hsl(25 100% 50% / 0.04) 0%, transparent 60%)",
        }}
      />

      <HudNav />
      <HudOverlay />

      <AssistantShell>
        <div
          className={cn(
            "relative z-20",
            isHome ? "min-h-screen pb-36" : "min-h-screen pt-24 pb-36",
          )}
        >
          {children}
        </div>
      </AssistantShell>

      {isHome ? <HeroContent /> : null}

      <StatusBar />
    </div>
  );
}
