import { NextResponse } from "next/server";

export async function GET() {
  const username = process.env.GITHUB_USERNAME ?? "saidev-anirudh";
  const token = process.env.GITHUB_TOKEN;

  const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to fetch repositories." }, { status: 502 });
  }

  const repos = (await response.json()) as Array<{
    id: number;
    name: string;
    html_url: string;
    description: string | null;
    stargazers_count: number;
    language: string | null;
    fork: boolean;
  }>;

  const publicRepos = repos.filter((repo) => !repo.fork).map((repo) => ({
    id: repo.id,
    name: repo.name,
    url: repo.html_url,
    description: repo.description,
    stars: repo.stargazers_count,
    language: repo.language,
  }));

  return NextResponse.json({ username, repos: publicRepos });
}
