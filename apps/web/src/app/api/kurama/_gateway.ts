import { NextRequest, NextResponse } from "next/server";

function gatewayBaseUrl(): string {
  return (
    process.env.KURAMA_GATEWAY_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_KURAMA_GATEWAY_URL?.replace(/\/$/, "") ||
    "http://localhost:8080"
  );
}

function gatewayAuthHeader(): Record<string, string> {
  const token = process.env.KURAMA_API_TOKEN || process.env.NEXT_PUBLIC_KURAMA_API_TOKEN;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function proxyGatewayJson(
  request: NextRequest,
  path: "/validate" | "/orchestrate",
): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const base = gatewayBaseUrl();
  const url = `${base}${path}`;
  const upstream = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...gatewayAuthHeader(),
    },
    body: JSON.stringify(body),
  });

  const text = await upstream.text();
  const contentType = upstream.headers.get("content-type") || "application/json";

  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "content-type": contentType,
      "cache-control": "no-store",
    },
  });
}
