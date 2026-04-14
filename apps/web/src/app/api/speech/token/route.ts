import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;

  if (!key || !region) {
    console.error("[kurama-stt] missing Azure speech credentials");
    return NextResponse.json({ error: "Azure Speech credentials are missing." }, { status: 500 });
  }

  try {
    const response = await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": "0",
      },
      body: "",
    });

    if (!response.ok) {
      const message = await response.text();
      console.error("[kurama-stt] failed issuing token", { status: response.status, message });
      return NextResponse.json({ error: "Failed to issue speech token", details: message }, { status: 502 });
    }

    const token = await response.text();
    return NextResponse.json({ token, region });
  } catch (error) {
    console.error("[kurama-stt] speech token request failed", error);
    return NextResponse.json({ error: "Speech token request failed." }, { status: 502 });
  }
}
