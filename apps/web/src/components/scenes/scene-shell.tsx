import type { ReactNode } from "react";

export function SceneShell({
  scene,
  children,
}: {
  scene: "home_hud" | "timeline_hud" | "blog_archive" | "contact_holo";
  children: ReactNode;
}) {
  return <main className={`scene-shell scene-${scene}`}>{children}</main>;
}
