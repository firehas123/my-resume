// Tests for the job stack helpers (chips and highlighted terms).
// Run with `npm test`.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { STACK_GROUPS, colorOf, findTerm, highlightPlan, markTerms, stackGroup, stackTerms } from "./lib/stack.mjs";

test("a name with a slash stands for several terms", () => {
  assert.deepEqual(stackTerms("JPA/Hibernate"), ["JPA", "Hibernate"]);
  assert.deepEqual(stackTerms("Kafka"), ["Kafka"]);
});

test("a stack name can have other spellings: LLMs is also found as LLM", () => {
  assert.deepEqual(stackTerms("LLMs"), ["LLMs", "LLM"]);
  const text = "Co-built an LLM-powered service.";
  const pieces = markTerms(text, stackTerms("LLMs"));
  assert.deepEqual(pieces.filter((p) => p.mark).map((p) => p.text), ["LLM"]);
  // Where both match, the longer one wins.
  assert.deepEqual(markTerms("uses LLMs", stackTerms("LLMs")).filter((p) => p.mark).map((p) => p.text), ["LLMs"]);
});

test("only whole words match, case-sensitive", () => {
  assert.equal(findTerm("Java and JavaFX", "Java"), 0);
  assert.equal(findTerm("in JavaFX only", "Java"), -1);
  assert.equal(findTerm("java", "Java"), -1);
  assert.equal(findTerm("Java- und Spring-Entwickler", "Spring"), 10);
});

test("an Arabic prefix written before a term does not hide it", () => {
  const text = "باستخدام JPA وLiquibase.";
  assert.equal(findTerm(text, "Liquibase"), text.indexOf("Liquibase"));
});

test("only the first mention in the whole job is highlighted", () => {
  const plan = highlightPlan(["Uses Docker and Kafka.", "More Docker, then Maven."], ["Docker", "Maven", "AWS"]);
  assert.deepEqual(plan, [["Docker"], ["Maven"]]);
});

test("marked pieces join back to the original text", () => {
  const text = "Spring Boot and Maven, then Spring Boot again.";
  const pieces = markTerms(text, ["Maven", "Spring Boot"]);
  assert.equal(pieces.map((p) => p.text).join(""), text);
  assert.deepEqual(pieces.filter((p) => p.mark).map((p) => p.text), ["Spring Boot", "Maven"]);
  assert.deepEqual(markTerms("nothing here", ["Java"]), [{ text: "nothing here", mark: false }]);
});

test("every job has a short stack, and every stack name appears in the job's English text", () => {
  const profile = JSON.parse(readFileSync(new URL("../src/data/profile.json", import.meta.url), "utf8"));
  for (const job of profile.experience) {
    assert.ok(Array.isArray(job.stack) && job.stack.length > 0 && job.stack.length <= 9, `${job.company}: stack`);
    // Zertificon also lists technologies from the owner's own summary of the job.
    if (job.company === "Zertificon") continue;
    const text = [job.summary.en, ...job.highlights.en].join(" ");
    for (const name of job.stack) {
      assert.ok(stackTerms(name).some((term) => findTerm(text, term) !== -1), `${job.company}: "${name}" is not in the text`);
    }
  }
});

test("every term in any job's stack has a colour group", () => {
  const profile = JSON.parse(readFileSync(new URL("../src/data/profile.json", import.meta.url), "utf8"));
  for (const job of profile.experience) {
    for (const name of job.stack) {
      assert.ok(stackGroup(name), `${job.company}: "${name}" has no group`);
      for (const term of stackTerms(name)) assert.ok(stackGroup(term), `${job.company}: term "${term}" has no group`);
    }
  }
});

test("groups and colours", () => {
  assert.equal(stackGroup("Hibernate").id, "java");
  assert.equal(stackGroup("JWT").id, "security");
  assert.equal(stackGroup("LLMs").id, "ai");
  assert.equal(stackGroup("LLM").id, "ai");
  assert.equal(colorOf("LLM", "#000"), "#be185d");
  assert.equal(colorOf("Kafka", "#000"), "#047857");
  assert.equal(colorOf("Rust", "#0b7a54"), "#0b7a54");
  assert.equal(stackGroup("Rust"), null);
  // A name is in one group only.
  const all = STACK_GROUPS.flatMap((g) => g.names);
  assert.equal(new Set(all).size, all.length);
});

test("globals.css uses the same group colours as the CV", () => {
  const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
  for (const group of STACK_GROUPS) {
    const values = [...css.matchAll(new RegExp(`--stack-${group.id}:\\s*(#[0-9a-f]{6})`, "gi"))].map((m) => m[1].toLowerCase());
    assert.ok(values.includes(group.color), `--stack-${group.id}: light ${group.color} missing`);
    assert.ok(values.includes(group.dark), `--stack-${group.id}: dark ${group.dark} missing`);
    assert.ok(values.every((v) => v === group.color || v === group.dark), `--stack-${group.id}: unexpected value`);
  }
});
