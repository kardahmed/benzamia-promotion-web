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
  assert.match(src, /LEAD_CURRENCY = "DZD"/);
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
