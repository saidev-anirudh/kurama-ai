const MILESTONES = [
  { year: "2021", title: "Started product engineering journey" },
  { year: "2023", title: "Built AI-first systems and workflows" },
  { year: "2025", title: "Focused on multi-agent orchestration" },
];

export function TimelinePanel() {
  return (
    <section className="content-page">
      <h1>Career Timeline</h1>
      <ul className="timeline-list">
        {MILESTONES.map((item) => (
          <li key={item.year}>
            <strong>{item.year}</strong>
            <span>{item.title}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
