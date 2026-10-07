import { test } from "node:test";
import assert from "node:assert/strict";
import { localize, mergeMessages, messageGaps, translationGaps } from "./lib/i18n.mjs";

const codes = new Set(["en", "de", "fr"]);

test("localize picks the language, or English when it has none", () => {
  const data = { title: { en: "Hello", de: "Hallo" }, name: "Hassan", list: [{ en: "a", fr: "b" }] };
  assert.deepEqual(localize(data, "de", codes), { title: "Hallo", name: "Hassan", list: ["a"] });
  assert.deepEqual(localize(data, "fr", codes), { title: "Hello", name: "Hassan", list: ["b"] });
});

test("an object with other keys is not mistaken for a translation", () => {
  const data = { en: "x", city: "Berlin" };
  assert.deepEqual(localize(data, "de", codes), data);
});

test("translationGaps finds missing and untranslated texts, skipping notes", () => {
  const data = { a: { en: "Hi", de: "Hallo" }, b: { en: "Docker", de: "Docker" }, _note: { en: "x" } };
  assert.deepEqual(translationGaps(data, ["de", "fr"], codes), [
    { path: "a", locale: "fr", problem: "missing" },
    { path: "b", locale: "de", problem: "same as English" },
    { path: "b", locale: "fr", problem: "missing" },
  ]);
});

test("messageGaps compares a message file with English", () => {
  const english = { nav: { about: "About", code: "Code" }, n: "{count}" };
  assert.deepEqual(messageGaps(english, { nav: { code: "Code" }, n: "{count}" }), [
    { path: "nav.about", problem: "missing" },
    { path: "nav.code", problem: "same as English" },
  ]);
});

test("mergeMessages fills gaps with English and never keeps a blank", () => {
  assert.deepEqual(mergeMessages({ a: "A", b: { c: "C", d: "D" } }, { a: "", b: { c: "Ç" } }), { a: "A", b: { c: "Ç", d: "D" } });
});
