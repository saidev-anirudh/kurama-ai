const POSTS = [
  { slug: "agent-routing-101", title: "Agent Routing 101", tag: "agents" },
  { slug: "voice-ui-primitives", title: "Voice UI Primitives", tag: "voice" },
  { slug: "futuristic-product-ux", title: "Futuristic Product UX", tag: "design" },
];

export function BlogList() {
  return (
    <section className="content-page">
      <h1>Blog</h1>
      <ul className="blog-list">
        {POSTS.map((post) => (
          <li key={post.slug}>
            <strong>{post.title}</strong>
            <span className="muted">{post.tag}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
