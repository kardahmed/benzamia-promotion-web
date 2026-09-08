import { NextResponse } from "next/server";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { saveContactMessage, markEmailStatus } from "@/lib/supabase/store";
import { notifyContactMessage } from "@/lib/notifications";
import { sendServerLead, requestClientInfo } from "@/lib/tracking/server";

export const dynamic = "force-dynamic";

/**
 * Message du formulaire de contact — cahier des charges V2 §12.
 * Flux : validation → anti-abus → stockage Supabase → e-mail équipe
 * (reply-to = expéditeur) + accusé de réception. Le message est considéré
 * « envoyé » dès qu'il est stocké OU transmis par e-mail.
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
  const phone = String(body.phone ?? "").trim() || undefined;
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

  const source =
    body.source && typeof body.source === "object"
      ? (body.source as Record<string, unknown>)
      : {};

  const stored = await saveContactMessage({
    name,
    email,
    phone,
    message: messageText,
    consent,
    source,
  });

  const { team } = await notifyContactMessage({ name, email, phone, message: messageText });

  // Mesure serveur (GA4 MP + Meta CAPI) — inerte sans secrets, jamais bloquant.
  const a =
    body.analytics && typeof body.analytics === "object"
      ? (body.analytics as Record<string, unknown>)
      : {};
  const { ip, userAgent } = requestClientInfo(request);
  const fireLead = () => {
    if (typeof a.eventId !== "string") return;
    void sendServerLead({
      leadType: "contact",
      eventId: a.eventId,
      clientId: typeof a.clientId === "string" ? a.clientId : undefined,
      email,
      phone,
      fullName: name,
      fbp: typeof a.fbp === "string" ? a.fbp : undefined,
      fbc: typeof a.fbc === "string" ? a.fbc : undefined,
      pageUrl: typeof a.pageUrl === "string" ? a.pageUrl : undefined,
      userAgent,
      ip,
      leadSource: "site",
    });
  };

  if (stored.ok) {
    void markEmailStatus(
      "contact_messages",
      stored.id,
      team.ok ? "sent" : team.skipped ? "skipped" : "failed",
    );
    fireLead();
    return NextResponse.json({ ok: true });
  }

  // Ni stocké, ni envoyé → échec réel.
  if (!stored.skipped && !team.ok) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          "Envoi impossible pour le moment. Réessayez, ou écrivez-nous à contact@benzamiapromotion.com.",
      },
      { status: 503 },
    );
  }
  // Supabase absent (MVP) mais e-mail parti (ou lui aussi absent) → on accepte.
  if (team.ok || team.skipped) {
    fireLead();
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json(
    {
      ok: false,
      reason:
        "Envoi impossible pour le moment. Réessayez, ou écrivez-nous à contact@benzamiapromotion.com.",
    },
    { status: 503 },
  );
}
