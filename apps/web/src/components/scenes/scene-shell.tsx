import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SceneShell({
  scene,
  children,
}: {
  scene: "home_hud" | "timeline_hud" | "blog_archive" | "contact_holo";
  children: ReactNode;
}) {
  return (
    <main
      className={cn(
        "scene-shell mx-auto w-full max-w-[min(1120px,calc(100vw-2rem))] px-3 py-5 font-body text-foreground md:px-6 md:py-8",
        `scene-${scene}`,
      )}
    >
      {children}
    </main>
  );
}
