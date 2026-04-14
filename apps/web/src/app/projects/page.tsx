import { PageFrame } from "@/components/aurora/page-frame";
import { projects } from "@/lib/content/resume";

type Repo = {
  id: number;
  name: string;
  url: string;
  description: string | null;
  stars: number;
  language: string | null;
};

async function getPublicRepos(): Promise<Repo[]> {
  const username = process.env.GITHUB_USERNAME ?? "saidev-anirudh";
  const token = process.env.GITHUB_TOKEN;
  const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });
  if (!response.ok) return [];
  const repos = (await response.json()) as Array<{
    id: number;
    name: string;
    html_url: string;
    description: string | null;
    stargazers_count: number;
    language: string | null;
    fork: boolean;
  }>;
  return repos
    .filter((repo) => !repo.fork)
    .map((repo) => ({
      id: repo.id,
      name: repo.name,
      url: repo.html_url,
      description: repo.description,
      stars: repo.stargazers_count,
      language: repo.language,
    }))
    .slice(0, 8);
}

export default async function ProjectsPage() {
  const repos = await getPublicRepos();
  const username = process.env.GITHUB_USERNAME ?? "saidev-anirudh";
  return (
    <PageFrame>
      <article className="content-page">
        <p className="hud-eyebrow">Repository mesh</p>
        <h1>Projects</h1>
        <p className="hud-subtitle muted">Featured resume projects and public repositories.</p>

      <ul className="timeline-list">
        {projects.map((project) => (
          <li key={project.name}>
            <strong>{project.name}</strong>
            <span>
              {project.details}
              <br />
              <small className="muted">{project.stack}</small>
            </span>
          </li>
        ))}
      </ul>

      <h2>GitHub Public Repositories</h2>
      <p className="muted">Live public repos from GitHub API and contribution graph.</p>
      <img
        alt="GitHub contribution graph"
        src={`https://ghchart.rshah.org/${username}`}
        className="mb-3 w-full rounded-sm border border-border/60 opacity-90 shadow-[0_0_24px_hsl(var(--neon-cyan)/0.12)]"
      />
      <ul className="timeline-list">
        {repos.map((repo) => (
          <li key={repo.id}>
            <strong>
              <a href={repo.url} target="_blank" rel="noreferrer">
                {repo.name}
              </a>
            </strong>
            <span>
              {repo.description ?? "No description provided."}
              <br />
              <small className="muted">
                {repo.language ?? "Unknown"} - {repo.stars} stars
              </small>
            </span>
          </li>
        ))}
      </ul>
      </article>
    </PageFrame>
  );
}
