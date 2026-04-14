import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { fromEmail, draftNotes } = (await request.json()) as {
    fromEmail?: string;
    draftNotes?: string;
  };
  if (!fromEmail?.trim() || !draftNotes?.trim()) {
    return NextResponse.json({ error: "fromEmail and draftNotes are required." }, { status: 400 });
  }

  const apiKey = process.env.AZURE_OPENAI_MAIN_API_KEY;
  const baseUrl = process.env.AZURE_OPENAI_MAIN_BASE_URL?.replace(/\/$/, "");
  const deployment = process.env.AZURE_OPENAI_MAIN_BASE_MODEL;
  const apiVersion = process.env.AZURE_OPENAI_MAIN_API_VERSION ?? "2024-12-01-preview";

  if (!apiKey || !baseUrl || !deployment) {
    return NextResponse.json(
      {
        subject: "Collaboration opportunity with Sai Dev Anirudh",
        body: `Hi Sai,\n\n${draftNotes}\n\nRegards,\n${fromEmail}`,
      },
      { status: 200 },
    );
  }

  const endpoint = `${baseUrl}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": apiKey },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content:
            "Draft concise professional email JSON only. Output: {\"subject\":\"...\",\"body\":\"...\"}. No markdown.",
        },
        {
          role: "user",
          content: `Sender email: ${fromEmail}. Draft notes: ${draftNotes}. Recipient: anirudhsaidev1@gmail.com`,
        },
      ],
      temperature: 0.4,
      max_completion_tokens: 180,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to compose draft." }, { status: 502 });
  }
  const payload = (await response.json()) as { choices: Array<{ message: { content: string } }> };
  const content = payload.choices?.[0]?.message?.content ?? "";
  try {
    const parsed = JSON.parse(content);
    return NextResponse.json({
      subject: String(parsed.subject ?? "Collaboration request"),
      body: String(parsed.body ?? draftNotes),
    });
  } catch {
    return NextResponse.json({
      subject: "Collaboration request",
      body: content || draftNotes,
    });
  }
}
