export interface VoiceSessionConfig {
  gatewayUrl: string;
  sessionId?: string;
}

export interface VoiceSessionResponse {
  session_id: string;
  status: string;
}

export async function createVoiceSession(config: VoiceSessionConfig): Promise<VoiceSessionResponse> {
  const response = await fetch(`${config.gatewayUrl}/session/start`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ session_id: config.sessionId }),
  });
  if (!response.ok) {
    throw new Error("Failed to create voice session");
  }
  return (await response.json()) as VoiceSessionResponse;
}
