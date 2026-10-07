// Tests for the right-to-left word pieces used by the share images and CVs.
// Run with `npm test`.

import assert from "node:assert/strict";
import { test } from "node:test";
import { hasRtl, rtlRuns, rtlWords } from "./lib/rtl.mjs";

test("Arabic words are separate pieces, in reading order", () => {
  assert.deepEqual(
    rtlRuns("واحد اثنان ثلاثة").map((r) => r.text),
    ["واحد", "اثنان", "ثلاثة"],
  );
});

test("punctuation at the end of an Arabic word is kept apart", () => {
  const [run] = rtlRuns("برمجيات.");
  assert.equal(run.text, "برمجيات");
  assert.equal(run.punctuation, ".");
});

test("a word mixing Arabic and Latin is split, the later part attached", () => {
  const runs = rtlRuns("i2c، وMicroservices");
  assert.deepEqual(
    runs.map((r) => [r.text, r.punctuation, r.attach]),
    [
      ["i2c", "،", false],
      ["و", "", false],
      ["Microservices", "", true],
    ],
  );
});

test("left-to-right stretches stay together in their own order", () => {
  const runs = rtlRuns("لتطبيق Careem Super App في 12/2024");
  assert.deepEqual(
    runs.map((r) => [r.text, r.rtl]),
    [
      ["لتطبيق", true],
      ["Careem Super App", false],
      ["في", true],
      ["12/2024", false],
    ],
  );
});

test("hasRtl tells Arabic from Latin text", () => {
  assert.equal(hasRtl("مهندس"), true);
  assert.equal(hasRtl("Software Engineer"), false);
});

test("rtlWords groups the parts of a mixed word", () => {
  const words = rtlWords("i2c، وMicroservices لتطبيق");
  assert.deepEqual(
    words.map((word) => word.map((run) => run.text)),
    [["i2c"], ["و", "Microservices"], ["لتطبيق"]],
  );
});

test("a left-to-right stretch ending in Arabic punctuation stays whole", () => {
  const runs = rtlRuns("لتطبيق Careem Super App، والبريد");
  assert.deepEqual(
    runs.map((r) => [r.text, r.punctuation]),
    [
      ["لتطبيق", ""],
      ["Careem Super App", "،"],
      ["والبريد", ""],
    ],
  );
});

test("a dash between dates stays between them", () => {
  assert.deepEqual(
    rtlWords("ديسمبر 2024 – حتى الآن").map((word) => word.map((run) => run.text).join("")),
    ["ديسمبر", "2024", "–", "حتى", "الآن"],
  );
  assert.deepEqual(
    rtlWords("ديسمبر 2023 – أبريل 2024").map((word) => word.map((run) => run.text).join("")),
    ["ديسمبر", "2023", "–", "أبريل", "2024"],
  );
});

test("punctuation after an English word sits on its left in right-to-left text", () => {
  const runs = rtlRuns("خبرة في الـ Backend: أنظمة في Zertificon. حاليًا");
  assert.deepEqual(
    runs.filter((r) => !r.rtl).map((r) => [r.text, r.punctuation]),
    [
      ["Backend", ":"],
      ["Zertificon", "."],
    ],
  );
  // Inside a word or in brackets, nothing moves.
  assert.deepEqual(rtlRuns("شهادات X.509 قبل").map((r) => r.text), ["شهادات", "X.509", "قبل"]);
  assert.deepEqual(rtlRuns("الإنجليزية (C1) والألمانية").map((r) => r.text), ["الإنجليزية", "(C1)", "والألمانية"]);
});
