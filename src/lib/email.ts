import nodemailer, { type Transporter } from "nodemailer";

/**
 * SMTP Hostinger — cahier des charges V2 §12.
 * `skipped: true` = SMTP non configuré (mode MVP) — ce n'est pas une erreur.
 * Aucune clé/mot de passe n'est jamais exposé côté client (pas de `NEXT_PUBLIC_`).
 */
export const EMAIL_FROM =
  process.env.EMAIL_FROM ??
  "BENZAMIA Promotion <contact@benzamiapromotion.com>";

export const CONTACT_RECIPIENT =
  process.env.CONTACT_RECIPIENT ?? "contact@benzamiapromotion.com";

/** Email de secours si le stockage durable échoue (voir docs/CALENDRIER-IMMOPROX.md). */
export const BOOKING_FALLBACK_EMAIL =
  process.env.BOOKING_FALLBACK_EMAIL ?? CONTACT_RECIPIENT;

let cached: Transporter | null = null;

function transporter(): Transporter | null {
  const host = process.env.HOSTINGER_SMTP_HOST;
  if (!host) return null;
  if (!cached) {
    const port = Number(process.env.HOSTINGER_SMTP_PORT ?? 465);
    cached = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: process.env.HOSTINGER_SMTP_USER,
        pass: process.env.HOSTINGER_SMTP_PASSWORD,
      },
    });
  }
  return cached;
}

export type SendResult = { ok: true } | { ok: false; skipped?: boolean };

export async function sendMail(opts: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<SendResult> {
  const t = transporter();
  if (!t) return { ok: false, skipped: true };
  try {
    await t.sendMail({
      from: EMAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      replyTo: opts.replyTo,
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Gabarit HTML minimal à la charte (rouge Benzamia). */
export function emailHtml(title: string, bodyHtml: string): string {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f6f6f4;font-family:Arial,Helvetica,sans-serif;color:#3a3a3a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e3e8ef;border-radius:8px;overflow:hidden">
<tr><td style="background:#a50000;height:6px"></td></tr>
<tr><td style="padding:28px 28px 8px">
<div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#a50000;font-weight:bold">BENZAMIA Promotion</div>
<h1 style="margin:8px 0 16px;font-size:20px;color:#0a0a0a">${title}</h1>
${bodyHtml}
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #e3e8ef;font-size:12px;color:#8a8a8a">
BENZAMIA Promotion — Résidence La Cité, Chlef · contact@benzamiapromotion.com
</td></tr>
</table></td></tr></table></body></html>`;
}
