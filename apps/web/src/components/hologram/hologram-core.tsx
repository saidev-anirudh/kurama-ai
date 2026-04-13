export function HologramCore({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="content-page">
      <h1>{title}</h1>
      <p className="muted">{subtitle}</p>
      <div className="holo-grid" aria-hidden>
        <div />
        <div />
        <div />
      </div>
    </section>
  );
}
