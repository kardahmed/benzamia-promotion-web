import { NextResponse } from "next/server";
import { trackingStatus } from "@/lib/tracking/server";

export const dynamic = "force-dynamic";

/**
 * État du service. `tracking` dit seulement si chaque secret est présent
 * (booléen) et donne le résultat du dernier envoi de lead — jamais la valeur
 * d'un secret. Sans cela, un refus de Meta restait invisible en production.
 */
export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "benzamia-promotion-web",
    timestamp: new Date().toISOString(),
    tracking: trackingStatus(),
  });
}
