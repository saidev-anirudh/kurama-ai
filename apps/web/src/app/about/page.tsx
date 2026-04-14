import { HologramCore } from "@/components/hologram/hologram-core";
import { PageFrame } from "@/components/aurora/page-frame";
import { profile } from "@/lib/content/resume";

export default function AboutPage() {
  return (
    <PageFrame>
      <HologramCore title="About Sai" subtitle={profile.summary} />
      <section className="content-page mt-6">
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
    </PageFrame>
  );
}
