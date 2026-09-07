import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const contentPath = new URL("../../src/content/home.ts", import.meta.url);

test("le contenu éditorial approuvé reste présent", async () => {
  const source = await readFile(contentPath, "utf8");
  // Surtitre et titre hero (titre = maquette, écart validé le 2026-09-07)
  assert.match(source, /Promotion immobilière à Chlef depuis 2013/);
  assert.match(source, /l’art de vivre à Chlef/);
  // Chiffres clés du cahier des charges
  assert.match(source, /260/);
  assert.match(source, /appartements livrés/);
  assert.match(source, /192/);
  assert.match(source, /appartements en cours de réalisation/);
  // Sections validées
  assert.match(source, /Venez visiter nos projets à Chlef/);
  assert.match(source, /Résidence La Cité/);
  assert.match(source, /Résidence Azhar II/);
  assert.match(source, /IMMO PRO-X/);
});
