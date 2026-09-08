import { createServerSupabaseClient } from "./server";

/**
 * Persistance durable des demandes des formulaires publics.
 * `skipped: true` = Supabase non configuré (mode MVP) — ce n'est pas une erreur.
 */
export type StoreResult =
  | { ok: true; id: string }
  | { ok: false; skipped: true }
  | { ok: false; skipped?: false; error: string };

function client() {
  try {
    return createServerSupabaseClient();
  } catch {
    return null;
  }
}

export type ContactMessageRow = {
  name: string;
  email: string;
  phone?: string;
  message: string;
  consent: boolean;
  source: Record<string, unknown>;
};

export async function saveContactMessage(
  row: ContactMessageRow,
): Promise<StoreResult> {
  const sb = client();
  if (!sb) return { ok: false, skipped: true };
  const { data, error } = await sb
    .from("contact_messages")
    .insert({
      name: row.name,
      email: row.email,
      phone: row.phone ?? null,
      message: row.message,
      consent: row.consent,
      source: row.source,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id as string };
}

export type VisitRequestRow = {
  idempotencyKey?: string;
  externalRef: string;
  projectSlug: string;
  fullName: string;
  phone: string;
  email?: string;
  preferredDate: string;
  preferredTime: string;
  typology?: string;
  preferredChannel?: string;
  note?: string;
  marketingConsent: boolean;
  source: Record<string, unknown>;
};

export async function saveVisitRequest(
  row: VisitRequestRow,
): Promise<StoreResult> {
  const sb = client();
  if (!sb) return { ok: false, skipped: true };

  const payload = {
    idempotency_key: row.idempotencyKey ?? null,
    external_ref: row.externalRef,
    project_slug: row.projectSlug,
    full_name: row.fullName,
    phone: row.phone,
    email: row.email ?? null,
    preferred_date: row.preferredDate,
    preferred_time: row.preferredTime,
    typology: row.typology ?? null,
    preferred_channel: row.preferredChannel ?? null,
    note: row.note ?? null,
    marketing_consent: row.marketingConsent,
    source: row.source,
  };

  // Idempotence : un retour du même formulaire (retry, double-clic) ne crée
  // pas de doublon et renvoie la demande existante.
  const query = row.idempotencyKey
    ? sb
        .from("visit_requests")
        .upsert(payload, { onConflict: "idempotency_key" })
    : sb.from("visit_requests").insert(payload);

  const { data, error } = await query.select("id").single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id as string };
}

/** Met à jour le statut d'envoi d'email d'une ligne (best-effort). */
export async function markEmailStatus(
  table: "contact_messages" | "visit_requests",
  id: string,
  status: "sent" | "skipped" | "failed",
): Promise<void> {
  const sb = client();
  if (!sb) return;
  await sb.from(table).update({ email_status: status }).eq("id", id);
}
