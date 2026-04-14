export function HologramCore({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="content-page">
      <p className="hud-eyebrow">Neural dossier</p>
      <h1>{title}</h1>
      <p className="hud-subtitle muted">{subtitle}</p>
      <div className="holo-grid" aria-hidden>
        <div />
        <div />
        <div />
      </div>
    </section>
  );
}
