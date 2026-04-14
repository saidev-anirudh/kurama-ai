import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Outer frame for static pages so typography and width match SceneShell routes. */
export function PageFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main
      className={cn(
        "mx-auto w-full max-w-[min(1120px,calc(100vw-2rem))] px-3 py-5 font-body text-foreground md:px-6 md:py-8",
        className,
      )}
    >
      {children}
    </main>
  );
}
