// Tests for the language-grouping rules. Run with `npm test`.
// Uses Node's built-in test runner, so no extra packages are needed.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createGrouping, formatShare, languageBreakdown, listNames } from "./lib/grouping.mjs";

const rules = JSON.parse(readFileSync(new URL("../src/data/language-groups.json", import.meta.url), "utf8"));
const { autoGroup, decideGroup, compareGroups } = createGrouping(rules);

// Shorthand: langs({ Python: 100, HTML: 50 }) -> [{ name, bytes }, ...]
const langs = (sizes) => Object.entries(sizes).map(([name, bytes]) => ({ name, bytes }));

test("Jupyter Notebook counts as Python", () => {
  const result = autoGroup(langs({ "Jupyter Notebook": 940, Python: 40, TeX: 20 }));
  assert.equal(result.group, "Python");
  assert.match(result.reason, /Jupyter Notebook counted as Python/);
  assert.match(result.reason, /TeX ignored/);
});

test("C and C++ share one group", () => {
  assert.equal(autoGroup(langs({ C: 100 })).group, "C / C++");
  assert.equal(autoGroup(langs({ "C++": 100 })).group, "C / C++");
  // Together they outweigh a bigger single language.
  assert.equal(autoGroup(langs({ C: 40, "C++": 40, Python: 60 })).group, "C / C++");
});

test("JavaScript and TypeScript share one group", () => {
  assert.equal(autoGroup(langs({ TypeScript: 53, JavaScript: 2, HTML: 25, CSS: 20 })).group, "JavaScript / TypeScript");
  assert.equal(autoGroup(langs({ JavaScript: 10, TypeScript: 10, Java: 15 })).group, "JavaScript / TypeScript");
});

test("non-code languages are ignored when choosing", () => {
  // HTML is the biggest, but it does not count.
  assert.equal(autoGroup(langs({ HTML: 80, CSS: 10, Java: 10 })).group, "Java");
  assert.equal(autoGroup(langs({ Shell: 90, Dockerfile: 5, Makefile: 5, Python: 1 })).group, "Python");
});

test("only non-code languages, or none at all, means Other", () => {
  const onlyMarkup = autoGroup(langs({ HTML: 100, CSS: 20 }));
  assert.equal(onlyMarkup.group, "Other");
  assert.match(onlyMarkup.reason, /only HTML and CSS/);
  assert.equal(autoGroup([]).group, "Other");
  assert.equal(autoGroup([]).reason, "no languages detected");
});

test("languages without a merge rule become their own group", () => {
  assert.equal(autoGroup(langs({ Go: 100 })).group, "Go");
  assert.equal(autoGroup(langs({ Java: 100 })).group, "Java");
});

test("a tie goes to the group that comes first in tab order", () => {
  assert.equal(autoGroup(langs({ Java: 50, Python: 50 })).group, "Python");
  assert.equal(autoGroup(langs({ Rust: 50, Go: 50 })).group, "Go");
});

test("a group from overrides.json always wins", () => {
  const result = decideGroup(langs({ Java: 100 }), { group: "Python" });
  assert.equal(result.group, "Python");
  assert.equal(result.auto, "Java");
  assert.match(result.reason, /set in overrides\.json/);
  // An empty override is ignored.
  assert.equal(decideGroup(langs({ Java: 100 }), { group: " " }).group, "Java");
});

test("tab order: fixed groups, then A-Z, Other last", () => {
  const groups = ["Other", "Rust", "JavaScript / TypeScript", "Go", "Java", "Python", "C / C++"];
  assert.deepEqual([...groups].sort(compareGroups), [
    "C / C++",
    "Python",
    "Java",
    "JavaScript / TypeScript",
    "Go",
    "Rust",
    "Other",
  ]);
});

test("helpers", () => {
  const breakdown = languageBreakdown([
    { size: 25, node: { name: "HTML" } },
    { size: 75, node: { name: "Python" } },
  ]);
  assert.deepEqual(breakdown.map((l) => [l.name, l.share]), [["Python", 75], ["HTML", 25]]);
  assert.deepEqual(languageBreakdown(null), []);
  assert.equal(formatShare(0.4), "<1%");
  assert.equal(formatShare(53.4), "53%");
  assert.equal(listNames(["A", "B", "C"]), "A, B and C");
});
