import type { KuramaMode } from "@/store/voice-store";

export function KuramaOrb({ state }: { state: KuramaMode }) {
  return (
    <div className="orb-shell">
      <div className={`orb-aura orb-${state}`} />
      <div className={`orb-grid orb-${state}`} />
      <div className={`orb-grid orb-grid-secondary orb-${state}`} />
      <div className={`orb-core orb-${state}`} />
      <div className={`orb-ring orb-ring-${state}`} />
      <div className={`orb-ring orb-ring-secondary orb-ring-${state}`} />
      <div className={`orb-ring orb-ring-tertiary orb-ring-${state}`} />
      <div className={`orb-particles orb-${state}`} />
      <div className={`orb-blocks orb-${state}`} />
      <p className="orb-label">Kurama: {state}</p>
    </div>
  );
}
