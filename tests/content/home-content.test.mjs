import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const contentPath = new URL("../../src/content/home.ts", import.meta.url);

test("le contenu éditorial approuvé reste présent", async () => {
  const source = await readFile(contentPath, "utf8");
  assert.match(source, /Promotion immobilière à Chlef depuis 2013/);
  assert.match(source, /Votre appartement neuf/);
  assert.match(source, /260 appartements livrés/);
  assert.match(source, /192 appartements en cours de réalisation/);
  assert.match(source, /Venez visiter nos projets à Chlef/);
  assert.match(source, /IMMO PRO-X/);
});
