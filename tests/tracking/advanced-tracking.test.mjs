import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (rel) => readFile(new URL(`../../${rel}`, import.meta.url), "utf8");

test("la mesure serveur reste inerte sans secrets", async () => {
  const src = await read("src/lib/tracking/server.ts");
  // GA4 et Meta doivent court-circuiter tant que les secrets sont absents.
  assert.match(src, /if \(!GA4_API_SECRET.*\) return "skipped"/);
  assert.match(src, /if \(!META_PIXEL_ID \|\| !META_CAPI_TOKEN\) return "skipped"/);
  // Jamais bloquant : chaque envoi est encapsulé et Promise.all ne rejette pas.
  assert.match(src, /\.catch\(\(\) => "error"\)/);
  // Déduplication : le même event_id part côté GA4 et côté Meta.
  assert.match(src, /event_id: input\.eventId/);
});

test("normalisation des données utilisateur pour Meta CAPI", async () => {
  const src = await read("src/lib/tracking/server.ts");
  assert.match(src, /createHash\("sha256"\)/);
  // Téléphone algérien : 0X… -> 213X…
  assert.match(src, /`213\$\{digits\.slice\(1\)\}`/);
  // E-mail : trim + minuscules avant hachage.
  assert.match(src, /email\?\.trim\(\)\.toLowerCase\(\)/);
});

test("les formulaires transmettent le contexte de mesure", async () => {
  for (const f of ["src/components/booking-form.tsx", "src/components/contact-form.tsx"]) {
    const src = await read(f);
    assert.match(src, /collectLeadContext\(eventId\)/, `${f} : contexte joint`);
    assert.match(src, /event_id: eventId/, `${f} : dédup client`);
    assert.match(src, /useFormFunnel/, `${f} : entonnoir`);
  }
});

test("valeurs de lead centralisées et cohérentes", async () => {
  const src = await read("src/lib/tracking/config.ts");
  assert.match(src, /LEAD_CURRENCY = "USD"/);
  assert.match(src, /visit_request:\s*\d+/);
  assert.match(src, /contact:\s*\d+/);
});

test("Consent Mode v2 durci (redaction + url passthrough)", async () => {
  const src = await read("src/components/analytics/tag-manager.tsx");
  assert.match(src, /ads_data_redaction/);
  assert.match(src, /url_passthrough/);
});

test("suivi engagement : scroll, sortants, téléchargements", async () => {
  const scroll = await read("src/components/analytics/engagement-tracking.tsx");
  assert.match(scroll, /scroll_depth/);
  const click = await read("src/components/analytics/click-tracking.tsx");
  assert.match(click, /outbound_click/);
  assert.match(click, /file_download/);
});

test("track() remet à zéro les paramètres des événements précédents", async () => {
  // Modèle de données GTM « Version 2 » : les clés persistent et les tableaux
  // fusionnent. On rejoue le dataLayer comme GTM pour vérifier l'isolement.
  globalThis.window = { dataLayer: [] };
  const { track } = await import("../../src/lib/analytics.ts");
  track("view_item_list", { items: [{ item_id: "a" }, { item_id: "b" }] });
  track("contact_channel_click", { channel: "phone", phone: "+213" });
  track("scroll_depth", { percent: 50 });
  track("view_item", { items: [{ item_id: "c" }] });

  const merge = (target, source) => {
    for (const [k, v] of Object.entries(source)) {
      if (v && typeof v === "object") {
        target[k] = target[k] && typeof target[k] === "object" ? target[k] : Array.isArray(v) ? [] : {};
        merge(target[k], v);
      } else target[k] = v;
    }
  };
  const model = {};
  const seen = {};
  for (const message of window.dataLayer) {
    merge(model, message);
    if (message.event) seen[message.event] = structuredClone(model);
  }
  assert.equal(seen.scroll_depth.channel, undefined);
  assert.equal(seen.scroll_depth.phone, undefined);
  assert.equal(seen.scroll_depth.percent, 50);
  assert.deepEqual(seen.view_item.items, [{ item_id: "c" }]);
  // Les messages de remise à zéro ne portent pas d'événement (aucune balise).
  assert.ok(window.dataLayer.filter((m) => !m.event).every((m) => Object.values(m).every((v) => v === undefined)));
  delete globalThis.window;
});

test("événements Meta : standards, dédupliqués et sans pixel = inertes", async () => {
  // Sans pixel (consentement refusé ou ID absent), fbq n'existe pas.
  globalThis.window = {};
  const { metaTrack } = await import("../../src/lib/tracking/meta.ts");
  metaTrack("Lead", { value: 1 }, "abc"); // ne doit pas jeter
  const calls = [];
  window.fbq = (...args) => calls.push(args);
  metaTrack("Lead", { value: 1500 }, "evt-1");
  metaTrack("ViewContent", { content_ids: ["x"] });
  assert.deepEqual(calls[0], ["track", "Lead", { value: 1500 }, { eventID: "evt-1" }]);
  assert.equal(calls[1][3], undefined, "pas d'eventID quand il n'y en a pas");
  delete globalThis.window;

  // Le lead navigateur porte le même eventId que l'envoi serveur (CAPI).
  for (const f of ["src/components/contact-form.tsx", "src/components/booking-form.tsx"]) {
    const src = await read(f);
    assert.match(src, /metaTrack\(\s*"Lead",[\s\S]*?eventId,/, `${f} : dédup Meta`);
  }
  const click = await read("src/components/analytics/click-tracking.tsx");
  assert.match(click, /metaTrack\("Contact"/);
  assert.match(click, /metaTrack\("Search"/);
});
