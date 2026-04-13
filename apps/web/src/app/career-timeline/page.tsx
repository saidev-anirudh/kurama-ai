import { SceneShell } from "@/components/scenes/scene-shell";
import { TimelinePanel } from "@/components/timeline/timeline-panel";

export default function CareerTimelinePage() {
  return (
    <SceneShell scene="timeline_hud">
      <TimelinePanel />
    </SceneShell>
  );
}
