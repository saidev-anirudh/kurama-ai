"use client";

import { useEffect, useState } from "react";
import { blogs } from "@/lib/content/resume";

type MediumPost = { title: string; link: string; description: string };

export function BlogList() {
  const [posts, setPosts] = useState<MediumPost[]>([]);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/medium/posts");
      if (!response.ok) return;
      const payload = (await response.json()) as { posts: MediumPost[] };
      setPosts(payload.posts ?? []);
    })();
  }, []);

  return (
    <section className="content-page">
      <p className="hud-eyebrow">Archive</p>
      <h1>Blog</h1>
      <ul className="blog-list">
        {blogs.map((post) => (
          <li key={post.title}>
            <strong>{post.title}</strong>
            <span className="muted">{post.description}</span>
          </li>
        ))}
      </ul>

      <h2>Medium Connector</h2>
      <p className="muted">Live posts from Medium feed.</p>
      <ul className="blog-list">
        {posts.map((post) => (
          <li key={post.link}>
            <strong>
              <a href={post.link} target="_blank" rel="noreferrer">
                {post.title}
              </a>
            </strong>
            <span className="muted">{post.description}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
