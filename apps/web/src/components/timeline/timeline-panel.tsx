import { experiences } from "@/lib/content/resume";

export function TimelinePanel() {
  return (
    <section className="content-page">
      <p className="hud-eyebrow">Chronology</p>
      <h1>Career Timeline</h1>
      <ul className="timeline-list">
        {experiences.map((item) => (
          <li key={item.company}>
            <strong>{item.period}</strong>
            <span>
              {item.role} - {item.company}
              <br />
              <small className="muted">{item.impact}</small>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
