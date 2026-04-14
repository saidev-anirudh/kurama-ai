import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "elevenlabs";

export async function POST(request: NextRequest) {
  try {
    const { text } = (await request.json()) as { text?: string };
    if (!text?.trim()) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";
    if (!apiKey) {
      console.error("[kurama-tts] missing ELEVENLABS_API_KEY");
      return NextResponse.json({ error: "ElevenLabs API key missing." }, { status: 500 });
    }

    const client = new ElevenLabsClient({ apiKey });
    const audioStream = await client.textToSpeech.convert(voiceId, {
      text,
      model_id: process.env.ELEVENLABS_MODEL_ID ?? "eleven_turbo_v2_5",
      output_format: "mp3_44100_128",
      voice_settings: {
        stability: Number(process.env.ELEVENLABS_STABILITY ?? 0.42),
        similarity_boost: Number(process.env.ELEVENLABS_SIMILARITY_BOOST ?? 0.86),
        style: Number(process.env.ELEVENLABS_STYLE ?? 0.32),
        use_speaker_boost: true,
      },
    });

    const chunks: Uint8Array[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const size = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const merged = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return new NextResponse(merged, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[kurama-tts] convert failed", error);
    return NextResponse.json({ error: "TTS conversion failed." }, { status: 500 });
  }
}
