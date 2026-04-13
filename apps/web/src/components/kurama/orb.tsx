import type { KuramaMode } from "@/store/voice-store";

export function KuramaOrb({ state }: { state: KuramaMode }) {
  return (
    <div className="orb-shell">
      <div className={`orb-core orb-${state}`} />
      <div className={`orb-ring orb-ring-${state}`} />
      <p className="orb-label">Kurama: {state}</p>
    </div>
  );
}
