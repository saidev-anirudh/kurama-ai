import { NextResponse } from "next/server";

function extractTagContent(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]><\\/${tag}>|<${tag}>(.*?)<\\/${tag}>`, "g");
  const values: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    values.push((match[1] ?? match[2] ?? "").trim());
  }
  return values;
}

export async function GET() {
  const handle = process.env.MEDIUM_HANDLE ?? "@sai44dev44";
  const response = await fetch(`https://medium.com/feed/${handle}`, { cache: "no-store" });
  if (!response.ok) {
    return NextResponse.json({ handle, posts: [] });
  }
  const xml = await response.text();
  const titles = extractTagContent(xml, "title").slice(2, 8);
  const links = extractTagContent(xml, "link").slice(1, 7);
  const descriptions = extractTagContent(xml, "description").slice(1, 7);

  const posts = titles.map((title, index) => ({
    title,
    link: links[index] ?? "https://medium.com",
    description: (descriptions[index] ?? "").replace(/<[^>]+>/g, "").slice(0, 220),
  }));
  return NextResponse.json({ handle, posts });
}
