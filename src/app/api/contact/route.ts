import { NextResponse } from "next/server";
import { verifyRecaptcha } from "@/lib/recaptcha";

export const dynamic = "force-dynamic";

/**
 * Message du formulaire de contact.
 * TODO (phase 3) : envoi via SMTP Hostinger vers contact@benzamiapromotion.com,
 * accusé de réception à l'expéditeur, notification à l'équipe.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "Requête invalide." }, { status: 400 });
  }

  // Anti-abus (CDC §16) : piège + reCAPTCHA v3.
  if (typeof body.company === "string" && body.company.trim() !== "") {
    return NextResponse.json({ ok: true }); // bot : on absorbe sans rien traiter
  }
  const captcha = await verifyRecaptcha(body.recaptchaToken, "contact");
  if (!captcha.ok) {
    return NextResponse.json({ ok: false, reason: captcha.reason }, { status: 403 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const messageText = String(body.message ?? "").trim();
  const consent = body.consent === true;

  const errors: string[] = [];
  if (name.length < 2) errors.push("nom");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.push("email");
  if (messageText.length < 10) errors.push("message");
  if (!consent) errors.push("consentement");

  if (errors.length > 0) {
    return NextResponse.json(
      { ok: false, reason: `Champs à corriger : ${errors.join(", ")}.` },
      { status: 422 },
    );
  }

  return NextResponse.json({ ok: true });
}
