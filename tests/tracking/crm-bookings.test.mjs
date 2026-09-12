import assert from "node:assert/strict";
import test from "node:test";

const mod = await import("../../src/lib/crm/bookings.ts");

const base = {
  externalRef: "site-mty5xt88-svicfy",
  projectSlug: "residence-la-cite",
  fullName: "Ahmed Kard",
  phone: "0561739762",
  preferredDate: "2026-09-16",
  preferredTime: "Matin (9h – 12h)",
  marketingConsent: true,
  source: {},
  idempotencyKey: "11111111-2222-3333-4444-555555555555",
  submittedAt: new Date("2026-09-12T12:00:00.000Z"),
};

test("créneau converti en UTC au format exact du contrat", () => {
  // Alger = UTC+1 : 9 h locales -> 08:00 UTC, millisecondes explicites.
  assert.equal(mod.slotToUtcStart("2026-09-16", "Matin (9h – 12h)"), "2026-09-16T08:00:00.000Z");
  assert.equal(
    mod.slotToUtcStart("2026-09-16", "Après-midi (13h – 17h)"),
    "2026-09-16T12:00:00.000Z",
  );
  assert.equal(mod.slotToUtcStart("2026-09-16", "Soirée"), null, "créneau inconnu -> null");
  assert.equal(mod.slotToUtcStart("16/09/2026", "Matin (9h – 12h)"), null, "date invalide -> null");
});

test("le corps ne contient que les champs autorisés", () => {
  const p = mod.buildBookingPayload(base);
  const permis = new Set([
    "external_booking_id",
    "project_ref",
    "starts_at",
    "duration_minutes",
    "client",
    "desired_unit_types",
    "notes",
    "preferred_contact_channel",
    "attribution",
    "privacy_notice",
    "marketing_consent",
  ]);
  for (const k of Object.keys(p)) assert.ok(permis.has(k), `champ inconnu refusé : ${k}`);
  for (const k of Object.keys(p.client)) {
    assert.ok(["first_name", "last_name", "phone", "email"].includes(k), k);
  }
  assert.equal(p.duration_minutes, 30);
  assert.equal(p.client.first_name, "Ahmed");
  assert.equal(p.client.last_name, "Kard");
  assert.equal(p.marketing_consent.granted, true);
  assert.ok(p.privacy_notice.version && p.privacy_notice.acknowledged_at);
  // Le corps doit rester sous la limite de 16 384 octets.
  assert.ok(Buffer.byteLength(JSON.stringify(p)) < 16384);
});

test("un nom en un seul mot reste accepté par le contrat", () => {
  const p = mod.buildBookingPayload({ ...base, fullName: "Karim" });
  assert.equal(p.client.first_name, "Karim");
  assert.equal(p.client.last_name, "Karim", "les deux champs sont obligatoires");
});

test("attribution : seulement les sept clés, en snake_case", () => {
  const p = mod.buildBookingPayload({
    ...base,
    source: {
      utmSource: "facebook",
      utmMedium: "cpc",
      gclid: "abc",
      pageUrl: "https://exemple",
      referrer: "https://autre",
    },
  });
  assert.deepEqual(p.attribution, { utm_source: "facebook", utm_medium: "cpc", gclid: "abc" });
});

test("le canal e-mail n'est envoyé que si une adresse existe", () => {
  const sans = mod.buildBookingPayload({ ...base, preferredChannel: "Email" });
  assert.equal(sans.preferred_contact_channel, undefined);
  const avec = mod.buildBookingPayload({
    ...base,
    preferredChannel: "Email",
    email: "a@b.co",
  });
  assert.equal(avec.preferred_contact_channel, "email");
  const wa = mod.buildBookingPayload({ ...base, preferredChannel: "WhatsApp" });
  assert.equal(wa.preferred_contact_channel, "whatsapp");
});

test("sans configuration CRM, l'envoi est inerte", async () => {
  const res = await mod.submitBookingToCrm(base);
  assert.equal(res.status, "skipped", "aucun appel réseau sans URL ni jeton");
});

test("notes et typologie sont tronquées aux limites du contrat", () => {
  const p = mod.buildBookingPayload({
    ...base,
    note: "x".repeat(5000),
    typology: "y".repeat(200),
  });
  assert.equal(p.notes.length, 2000);
  assert.equal(p.desired_unit_types[0].length, 80);
});
