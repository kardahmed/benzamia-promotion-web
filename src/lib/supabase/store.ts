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

// ─────────────────────────────────────────────────────────────────────────────
// Événements du CRM IMMO PRO-X
// ─────────────────────────────────────────────────────────────────────────────

export type ClaimResult =
  | { claimed: true }
  | { claimed: false; duplicate: true }
  | { claimed: false; duplicate: false; error: string }
  | { claimed: false; skipped: true };

/**
 * Réserve un événement CRM : l'insertion échoue si l'événement a déjà été reçu
 * (clé primaire integration_id + event_id). C'est ce qui rend le rejeu du
 * worker distant sans effet — condition pour ne jamais compter deux fois une
 * visite côté publicité.
 */
export async function claimCrmEvent(args: {
  integrationId: string;
  eventId: string;
  eventType: string;
  payload: unknown;
}): Promise<ClaimResult> {
  const sb = client();
  if (!sb) return { claimed: false, skipped: true };
  const { error } = await sb.from("crm_events").insert({
    integration_id: args.integrationId,
    event_id: args.eventId,
    event_type: args.eventType,
    payload: args.payload as Record<string, unknown>,
  });
  if (!error) return { claimed: true };
  // 23505 = violation de contrainte d'unicité → déjà reçu.
  if ((error as { code?: string }).code === "23505") {
    return { claimed: false, duplicate: true };
  }
  return { claimed: false, duplicate: false, error: error.message };
}

/** Consigne l'issue du traitement d'un événement (best-effort). */
export async function finishCrmEvent(
  integrationId: string,
  eventId: string,
  status: "traite" | "ignore" | "erreur",
  detail?: string,
): Promise<void> {
  const sb = client();
  if (!sb) return;
  await sb
    .from("crm_events")
    .update({ status, detail: detail ?? null, processed_at: new Date().toISOString() })
    .eq("integration_id", integrationId)
    .eq("event_id", eventId);
}

export type VisitRequestRecord = {
  id: string;
  externalRef: string;
  projectSlug: string;
  fullName: string;
  phone: string;
  email?: string;
  status: string;
  marketingConsent: boolean;
};

/** Retrouve la demande à l'origine d'un événement CRM. */
export async function findVisitRequestByExternalRef(
  externalRef: string,
): Promise<VisitRequestRecord | null> {
  const sb = client();
  if (!sb) return null;
  const { data, error } = await sb
    .from("visit_requests")
    .select("id, external_ref, project_slug, full_name, phone, email, status, marketing_consent")
    .eq("external_ref", externalRef)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id as string,
    externalRef: data.external_ref as string,
    projectSlug: data.project_slug as string,
    fullName: data.full_name as string,
    phone: data.phone as string,
    email: (data.email as string | null) ?? undefined,
    status: data.status as string,
    marketingConsent: Boolean(data.marketing_consent),
  };
}

/** Reporte le statut CRM sur la demande d'origine. */
export async function updateVisitRequestFromCrm(
  id: string,
  fields: { status?: string; crmVisitId?: string },
): Promise<void> {
  const sb = client();
  if (!sb) return;
  const patch: Record<string, unknown> = {};
  if (fields.status) patch.status = fields.status;
  if (fields.crmVisitId) patch.crm_visit_id = fields.crmVisitId;
  if (Object.keys(patch).length === 0) return;
  await sb.from("visit_requests").update(patch).eq("id", id);
}
