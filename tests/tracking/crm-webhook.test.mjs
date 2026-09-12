import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (rel) => readFile(new URL(`../../${rel}`, import.meta.url), "utf8");

// Secret distribué en hexadécimal, comme le fait IMMO PRO-X.
const SECRET_HEX = "a3f1c0de9b8477561e2d0a4c5b6f7182";

const ENV = {
  IMMOPROX_INTEGRATION_ID: "int_benzamia",
  IMMOPROX_WEBHOOK_KEY_ID: "key_1",
  IMMOPROX_WEBHOOK_SECRET: SECRET_HEX,
};

async function load() {
  Object.assign(process.env, ENV);
  // Un import frais par test : le module lit process.env à chaque appel.
  return import(`../../src/lib/crm/webhook.ts?v=${Math.random()}`);
}

const headersFor = (mod, body, over = {}) => {
  const base = {
    integrationId: "int_benzamia",
    eventId: "evt-1",
    keyId: "key_1",
    timestamp: String(Math.floor(Date.now() / 1000)),
    ...over,
  };
  return {
    ...base,
    signature:
      over.signature ??
      mod.computeSignature(SECRET_HEX, mod.signaturePayload(base, body)),
  };
};

test("webhook CRM : une signature valide passe", async () => {
  const mod = await load();
  const body = JSON.stringify({ type: "booking.status_changed" });
  const res = mod.verifyWebhook(headersFor(mod, body), body);
  assert.equal(res.ok, true);
  assert.equal(res.eventId, "evt-1");
});

test("webhook CRM : l'en-tête préfixé v1= est accepté", async () => {
  const mod = await load();
  const body = JSON.stringify({ type: "booking.status_changed" });
  const base = headersFor(mod, body);
  // Format réel d'IMMO PRO-X : « v1=<hex> », et pas le hex seul.
  const prefixe = mod.verifyWebhook({ ...base, signature: `v1=${base.signature}` }, body);
  assert.equal(prefixe.ok, true, "préfixe v1= accepté");
  assert.equal(mod.verifyWebhook(base, body).ok, true, "hex nu toujours accepté");
  // Un préfixe d'une autre version ne doit pas passer pour du hex valide.
  const autre = mod.verifyWebhook({ ...base, signature: `v2=${base.signature}` }, body);
  assert.equal(autre.ok, false);
});

test("le secret hexadécimal est décodé en octets avant signature", async () => {
  const mod = await load();
  const { createHmac } = await import("node:crypto");
  const payload = "charge-utile";
  // Référence : ce que calcule l'émetteur, à partir des OCTETS du secret.
  const attendu = createHmac("sha256", Buffer.from(SECRET_HEX, "hex"))
    .update(payload)
    .digest("hex");
  assert.equal(mod.computeSignature(SECRET_HEX, payload), attendu);
  // Signer la chaîne au lieu des octets donnerait une signature différente :
  // c'est le bug qui aurait valu un 401 sur chaque événement.
  const faux = createHmac("sha256", SECRET_HEX).update(payload).digest("hex");
  assert.notEqual(attendu, faux);
  // Un secret non hexadécimal reste utilisé tel quel.
  assert.equal(
    mod.computeSignature("pas-du-hex", payload),
    createHmac("sha256", Buffer.from("pas-du-hex", "utf8")).update(payload).digest("hex"),
  );
});

test("la route reconnaît request_id et contact_ref", async () => {
  const src = await read("src/app/api/crm/events/route.ts");
  for (const champ of ["external_booking_id", "external_ref", "request_id", "contact_ref"]) {
    assert.match(src, new RegExp(`data\\.${champ}`), `référence ${champ} acceptée`);
  }
  // Chaque référence connue est essayée, pas seulement la première.
  assert.match(src, /for \(const ref of refs\)/);
});

test("webhook CRM : corps modifié, signature refusée", async () => {
  const mod = await load();
  const body = JSON.stringify({ type: "booking.status_changed", status: "completed" });
  const headers = headersFor(mod, body);
  const falsifie = JSON.stringify({ type: "booking.status_changed", status: "cancelled" });
  const res = mod.verifyWebhook(headers, falsifie);
  assert.equal(res.ok, false);
  assert.equal(res.status, 401);
});

test("webhook CRM : rejeu hors fenêtre refusé", async () => {
  const mod = await load();
  const body = "{}";
  const vieux = String(Math.floor(Date.now() / 1000) - mod.SIGNATURE_WINDOW_S - 60);
  const res = mod.verifyWebhook(headersFor(mod, body, { timestamp: vieux }), body);
  assert.equal(res.ok, false);
  assert.match(res.reason, /fenêtre/);
});

test("webhook CRM : clé inconnue et intégration étrangère refusées", async () => {
  const mod = await load();
  const body = "{}";
  const autreCle = mod.verifyWebhook(headersFor(mod, body, { keyId: "key_9" }), body);
  assert.equal(autreCle.status, 401);
  const autreInt = mod.verifyWebhook(
    headersFor(mod, body, { integrationId: "int_autre_site" }),
    body,
  );
  assert.equal(autreInt.status, 401);
});

test("webhook CRM : sans secret configuré, on refuse au lieu d'accepter", async () => {
  delete process.env.IMMOPROX_WEBHOOK_SECRET;
  delete process.env.IMMOPROX_WEBHOOK_SECRET_NEXT;
  const mod = await import(`../../src/lib/crm/webhook.ts?v=${Math.random()}`);
  const res = mod.verifyWebhook(
    { integrationId: "x", eventId: "y", keyId: "k", timestamp: "1", signature: "z" },
    "{}",
  );
  assert.equal(res.ok, false);
  assert.equal(res.status, 503);
  process.env.IMMOPROX_WEBHOOK_SECRET = ENV.IMMOPROX_WEBHOOK_SECRET;
});

test("rotation de clé : l'ancienne et la nouvelle sont acceptées", async () => {
  Object.assign(process.env, ENV, {
    IMMOPROX_WEBHOOK_KEY_ID_NEXT: "key_2",
    IMMOPROX_WEBHOOK_SECRET_NEXT: "nouveau-secret",
  });
  const mod = await import(`../../src/lib/crm/webhook.ts?v=${Math.random()}`);
  const body = "{}";
  const base = {
    integrationId: "int_benzamia",
    eventId: "evt-2",
    keyId: "key_2",
    timestamp: String(Math.floor(Date.now() / 1000)),
  };
  const signature = mod.computeSignature("nouveau-secret", mod.signaturePayload(base, body));
  assert.equal(mod.verifyWebhook({ ...base, signature }, body).ok, true);
});

test("la conversion hors ligne n'est envoyée qu'avec une coordonnée", async () => {
  const src = await read("src/lib/tracking/offline.ts");
  assert.match(src, /if \(!em && !ph\) return "skipped"/);
  assert.match(src, /action_source: "physical_store"/);
  assert.match(src, /OFFLINE_VALUE\.visit_completed/);
});

test("la route CRM dédoublonne avant de traiter", async () => {
  const src = await read("src/app/api/crm/events/route.ts");
  assert.match(src, /claimCrmEvent/);
  assert.match(src, /duplicate: true/);
  // La conversion ne part que sur une visite réellement effectuée.
  assert.match(src, /status === "completed"/);
  // Identifiant stable = pas de double comptage côté Meta.
  assert.match(src, /visit-completed-\$\{demande\.externalRef\}/);
});
