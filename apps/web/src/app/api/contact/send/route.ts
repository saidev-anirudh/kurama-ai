import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { fromEmail, subject, body } = (await request.json()) as {
    fromEmail?: string;
    subject?: string;
    body?: string;
  };
  if (!fromEmail?.trim() || !subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "fromEmail, subject, body are required." }, { status: 400 });
  }

  const to = "anirudhsaidev1@gmail.com";
  const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    `${body}\n\nFrom: ${fromEmail}`,
  )}`;
  return NextResponse.json({ mailto });
}
