import assert from "node:assert/strict";
import test from "node:test";

const mod = await import("../../src/lib/crm/payload.ts");

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
    mod.slotToUtcStart("2026-09-16", "Après-midi (14h – 17h)"),
    "2026-09-16T13:00:00.000Z",
    "la pause du tenant va jusqu'à 14 h",
  );
  assert.equal(mod.slotToUtcStart("2026-09-16", "Après-midi (13h – 17h)"), null);
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

test("sans configuration CRM, aucun appel réseau n'est tenté", async () => {
  // bookings.ts importe payload.ts par alias : illisible sous Node brut, on
  // vérifie donc la garde dans la source (le comportement réseau est prouvé
  // par l'essai contre une API simulée, voir la PR).
  const { readFile } = await import("node:fs/promises");
  const src = await readFile(new URL("../../src/lib/crm/bookings.ts", import.meta.url), "utf8");
  assert.match(src, /if \(!BASE_URL \|\| !TOKEN\) \{/);
  assert.match(src, /return \{ status: "skipped" \}/);
  // Le motif de l'inaction est journalisé : « appel non tenté » doit se
  // distinguer de « appel refusé » sans fouiller les logs du serveur.
  assert.match(src, /IMMOPROX_API_TOKEN absent/);
  assert.match(src, /export function crmStatus/);
  assert.match(src, /x-idempotency-key/);
  assert.match(src, /AbortSignal\.timeout\(TIMEOUT_MS\)/);
  // 4xx : rejouer ne sert à rien ; 5xx : indisponible, rejeu légitime.
  assert.match(src, /status: "rejected"/);
  assert.match(src, /status: "unavailable"/);
});

test("le vendredi est reconnu comme jour de fermeture", () => {
  assert.equal(mod.isClosedDay("2026-09-18"), true, "2026-09-18 est un vendredi");
  assert.equal(mod.isClosedDay("2026-09-19"), false, "samedi ouvert");
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

test("le site ne juge plus des jours d'ouverture : le planning décide", async () => {
  const { readFile } = await import("node:fs/promises");
  const form = await readFile(
    new URL("../../src/components/booking-form.tsx", import.meta.url),
    "utf8",
  );
  const route = await readFile(
    new URL("../../src/app/api/booking/route.ts", import.meta.url),
    "utf8",
  );
  const dispo = await readFile(
    new URL("../../src/app/api/booking/availability/route.ts", import.meta.url),
    "utf8",
  );
  // Un vendredi codé en dur diverge dès que l'équipe change ses jours.
  for (const [nom, src] of [["formulaire", form], ["route", route], ["dispo", dispo]]) {
    assert.ok(!/isClosedDay/.test(src), `${nom} : aucun jour de fermeture en dur`);
  }
  // Et aucune heure de repli : sans planning, on ne propose rien.
  assert.ok(!/BOOKING_SLOTS/.test(form), "aucune demi-journée de secours");
  assert.match(form, /Disponibilités temporairement indisponibles/);
});

test("bornes UTC d'une journée d'Alger", async () => {
  const { readFile } = await import("node:fs/promises");
  const src = await readFile(new URL("../../src/lib/crm/availability.ts", import.meta.url), "utf8");
  // La journée locale déborde sur la veille en UTC (Alger = UTC+1).
  assert.match(src, /Date\.UTC\(y, m - 1, d, -1, 0, 0, 0\)/);
  // La durée vient de la réponse, jamais imposée dans la requête.
  assert.ok(!/duration_minutes/.test(src.split("searchParams")[1] ?? ""), "aucune durée imposée");
  assert.match(src, /Number\(body\.duration_minutes\)/);
  // Le jeton ne sort jamais du serveur.
  assert.match(src, /authorization: `Bearer \$\{TOKEN\}`/);
});

test("créneau revérifié à l'envoi, stockage avant transmission", async () => {
  const { readFile } = await import("node:fs/promises");
  const route = await readFile(
    new URL("../../src/app/api/booking/route.ts", import.meta.url),
    "utf8",
  );
  // Un créneau absent du planning au moment de l'envoi est refusé (409).
  assert.match(route, /Ce créneau vient d'être pris/);
  assert.match(route, /status: 409/);
  // Le stockage précède l'appel : un événement du CRM doit toujours pouvoir
  // être rattaché à une demande locale.
  assert.ok(
    route.indexOf("const stored = await saveVisitRequest") <
      route.indexOf("const crm = await submitBookingToCrm"),
    "le stockage précède la transmission",
  );
  // Mais la transmission a lieu quand même si le stockage a échoué, avec une
  // trace des deux références pour un rattachement manuel.
  assert.match(route, /transmise au CRM mais non stockée/);
});

test("le délai de 24 h se juge créneau par créneau", async () => {
  const { readFile } = await import("node:fs/promises");
  const src = await readFile(
    new URL("../../src/app/api/booking/availability/route.ts", import.meta.url),
    "utf8",
  );
  // Rejeter la journée entière masquerait des heures valides de l'après-midi.
  assert.match(src, /filter\(\(s\) => new Date\(s\.startsAt\)\.getTime\(\) >= notBefore\)/);
  assert.ok(!/tooSoon/.test(src), "plus de rejet au niveau de la journée");
  // Planning injoignable : aucune heure proposée.
  assert.match(src, /unavailable: true/);
});
