import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok", service: "benzamia-promotion-web", timestamp: new Date().toISOString() });
}
