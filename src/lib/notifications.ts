import { contact } from "@/content/site";
import { getProject } from "@/content/projects";
import {
  BOOKING_FALLBACK_EMAIL,
  CONTACT_RECIPIENT,
  emailHtml,
  sendMail,
  type SendResult,
} from "./email";

const esc = (s: string) =>
  s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);

const rows = (pairs: [string, string | undefined][]) =>
  pairs
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#8a8a8a;vertical-align:top">${k}</td><td style="padding:4px 0">${esc(
          String(v),
        )}</td></tr>`,
    )
    .join("");

// ── Formulaire de contact ────────────────────────────────────────────────────

export type ContactPayload = {
  name: string;
  email: string;
  phone?: string;
  message: string;
};

export async function notifyContactMessage(
  m: ContactPayload,
): Promise<{ team: SendResult }> {
  const lines = [
    `Nom : ${m.name}`,
    `Email : ${m.email}`,
    m.phone ? `Téléphone : ${m.phone}` : "",
    "",
    m.message,
  ]
    .filter(Boolean)
    .join("\n");

  const team = await sendMail({
    to: CONTACT_RECIPIENT,
    replyTo: m.email,
    subject: `Contact site — ${m.name}`,
    text: lines,
    html: emailHtml(
      "Nouveau message de contact",
      `<table style="font-size:14px">${rows([
        ["Nom", m.name],
        ["Email", m.email],
        ["Téléphone", m.phone],
      ])}</table><p style="margin:16px 0 0;white-space:pre-wrap;font-size:14px">${esc(
        m.message,
      )}</p>`,
    ),
  });

  // Accusé de réception (best-effort, non bloquant).
  if (m.email) {
    void sendMail({
      to: m.email,
      subject: "Votre message a bien été reçu — BENZAMIA Promotion",
      text: `Bonjour ${m.name},\n\nNous avons bien reçu votre message et l'équipe BENZAMIA vous répondra dans les meilleurs délais.\n\nBENZAMIA Promotion\n${contact.phones[0]}`,
      html: emailHtml(
        "Message bien reçu",
        `<p style="font-size:14px">Bonjour ${esc(
          m.name,
        )},</p><p style="font-size:14px">Nous avons bien reçu votre message. L'équipe BENZAMIA vous répondra dans les meilleurs délais.</p><p style="font-size:14px;color:#8a8a8a">Besoin d'une réponse rapide ? ${contact.phones
          .map((p) => esc(p))
          .join(" · ")}</p>`,
      ),
    });
  }

  return { team };
}

// ── Demande de visite ────────────────────────────────────────────────────────

export type VisitPayload = {
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
};

function visitLines(v: VisitPayload): string {
  const projectName = getProject(v.projectSlug)?.name ?? v.projectSlug;
  return [
    `Référence : ${v.externalRef}`,
    `Projet : ${projectName}`,
    `Nom et prénom : ${v.fullName}`,
    `Téléphone : ${v.phone}`,
    v.email ? `Email : ${v.email}` : "",
    `Créneau souhaité : ${v.preferredDate} — ${v.preferredTime}`,
    v.typology ? `Typologie : ${v.typology}` : "",
    v.preferredChannel ? `Canal préféré : ${v.preferredChannel}` : "",
    v.note ? `\nMessage : ${v.note}` : "",
    "",
    `Lieu de visite : ${contact.salesOffice}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function notifyVisitRequest(
  v: VisitPayload,
): Promise<{ team: SendResult }> {
  const projectName = getProject(v.projectSlug)?.name ?? v.projectSlug;

  const team = await sendMail({
    to: CONTACT_RECIPIENT,
    replyTo: v.email,
    subject: `Demande de visite — ${projectName} — ${v.fullName}`,
    text: visitLines(v),
    html: emailHtml(
      "Nouvelle demande de visite",
      `<table style="font-size:14px">${rows([
        ["Référence", v.externalRef],
        ["Projet", projectName],
        ["Nom et prénom", v.fullName],
        ["Téléphone", v.phone],
        ["Email", v.email],
        ["Créneau", `${v.preferredDate} — ${v.preferredTime}`],
        ["Typologie", v.typology],
        ["Canal préféré", v.preferredChannel],
        ["Lieu", contact.salesOffice],
      ])}</table>${
        v.note
          ? `<p style="margin:16px 0 0;white-space:pre-wrap;font-size:14px">${esc(
              v.note,
            )}</p>`
          : ""
      }<p style="margin:16px 0 0;font-size:13px;color:#8a8a8a">À confirmer manuellement avec le client (le site ne planifie rien).</p>`,
    ),
  });

  if (v.email) {
    void sendMail({
      to: v.email,
      subject: "Demande de visite reçue — BENZAMIA Promotion",
      text: `Bonjour ${v.fullName},\n\nVotre demande de visite pour ${projectName} a bien été enregistrée (réf. ${v.externalRef}).\n\nUn conseiller BENZAMIA vous recontacte pour confirmer le rendez-vous. Les visites ont lieu au bureau de vente : ${contact.salesOffice}, du samedi au jeudi de 9h à 17h.\n\nBENZAMIA Promotion\n${contact.phones[0]}`,
      html: emailHtml(
        "Demande de visite reçue",
        `<p style="font-size:14px">Bonjour ${esc(v.fullName)},</p>
<p style="font-size:14px">Votre demande de visite pour <strong>${esc(
          projectName,
        )}</strong> a bien été enregistrée (réf. <code>${esc(
          v.externalRef,
        )}</code>).</p>
<p style="font-size:14px">Un conseiller BENZAMIA vous recontacte pour <strong>confirmer le rendez-vous</strong>. Les visites ont lieu au bureau de vente : <strong>${esc(
          contact.salesOffice,
        )}</strong>, du samedi au jeudi de 9h à 17h.</p>
<p style="font-size:13px;color:#8a8a8a">${contact.phones
          .map((p) => esc(p))
          .join(" · ")}</p>`,
      ),
    });
  }

  return { team };
}

/** Repli : si le stockage durable échoue, on envoie tout par email. */
export async function sendVisitFallback(v: VisitPayload): Promise<SendResult> {
  return sendMail({
    to: BOOKING_FALLBACK_EMAIL,
    subject: `⚠ Demande de visite à traiter manuellement — ${v.fullName}`,
    text: `Le stockage de cette demande a échoué. À saisir manuellement dans IMMO PRO-X.\n\n${visitLines(
      v,
    )}`,
  });
}
