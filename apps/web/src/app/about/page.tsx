import { HologramCore } from "@/components/hologram/hologram-core";
import { profile } from "@/lib/content/resume";

export default function AboutPage() {
  return (
    <main>
      <HologramCore title="About Sai" subtitle={profile.summary} />
      <section className="content-page">
        <h2>Passions</h2>
        <p className="muted">
          I enjoy architecting voice AI systems, productionizing multi-agent workflows, and turning
          complex AI capabilities into intuitive products.
        </p>
        <ul className="timeline-list">
          {profile.highlights.map((item) => (
            <li key={item}>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
