/*
 * Vérification anti-robot des formulaires publics — cahier des charges V2 §16.
 * Google reCAPTCHA v3 (invisible, basé sur un score).
 *
 * `RECAPTCHA_SECRET_KEY` absent  → vérification désactivée (`skipped: true`),
 * utile en local et tant que les clés ne sont pas fournies.
 * Google injoignable → on ne bloque pas un visiteur légitime (`skipped: true`).
 */
const SECRET = process.env.RECAPTCHA_SECRET_KEY ?? "";
const MIN_SCORE = 0.5;

export type RecaptchaResult =
  | { ok: true; skipped?: boolean; score?: number }
  | { ok: false; reason: string };

type SiteVerify = {
  success: boolean;
  score?: number;
  action?: string;
  "error-codes"?: string[];
};

export async function verifyRecaptcha(
  token: unknown,
  expectedAction: string,
): Promise<RecaptchaResult> {
  if (!SECRET) return { ok: true, skipped: true };
  if (typeof token !== "string" || token.length < 10) {
    return { ok: false, reason: "Vérification anti-robot manquante. Rechargez la page." };
  }

  let data: SiteVerify;
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: SECRET, response: token }),
    });
    data = (await res.json()) as SiteVerify;
  } catch {
    return { ok: true, skipped: true };
  }

  if (!data.success) {
    return { ok: false, reason: "Vérification anti-robot échouée. Réessayez." };
  }
  if (data.action && data.action !== expectedAction) {
    return { ok: false, reason: "Vérification anti-robot invalide." };
  }
  if (typeof data.score === "number" && data.score < MIN_SCORE) {
    return { ok: false, reason: "Demande refusée. Contactez-nous par téléphone." };
  }
  return { ok: true, score: data.score };
}
