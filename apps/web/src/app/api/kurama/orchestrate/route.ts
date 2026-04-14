import { NextRequest } from "next/server";
import { proxyGatewayJson } from "../_gateway";

export async function POST(request: NextRequest) {
  return proxyGatewayJson(request, "/orchestrate");
}
