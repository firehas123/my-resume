// The tech stack of a job: the chips under each job (CV and website) and the
// light highlighting of the stack terms in the job's text.
// Plain JavaScript and pure functions, shared by scripts/build-cv.mjs and the
// website. Tested in scripts/stack.test.mjs.
//
// In profile.json each job has "stack": ["Java", "JPA/Hibernate", ...]. The
// names are the same in every language. A name with "/" is one chip but
// several terms to look for in the text: "JPA/Hibernate" -> "JPA", "Hibernate".

/** The terms a stack name stands for: "JPA/Hibernate" -> ["JPA", "Hibernate"]. */
export function stackTerms(name) {
  return name
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
}

// A Latin letter or digit (accented ones included). Only these count as "part
// of the same word", so "Java" is not found inside "JavaFX", while the Arabic
// "و" ("and") written straight before a term ("وJWT") does not hide it.
const WORD_CHAR = "A-Za-z0-9\\u00C0-\\u024F";
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Index of the first whole-word, case-sensitive match of `term` in `text`, or -1. */
export function findTerm(text, term) {
  const match = new RegExp(`(?<![${WORD_CHAR}])${escape(term)}(?![${WORD_CHAR}])`).exec(text);
  return match ? match.index : -1;
}

/**
 * Which terms to highlight in each of a job's texts (in reading order):
 * only the first mention of each term in the whole job.
 * Returns one array of terms per text.
 */
export function highlightPlan(texts, stack = []) {
  const pending = new Set(stack.flatMap(stackTerms));
  return texts.map((text) => {
    const here = [...pending].filter((term) => findTerm(text, term) !== -1);
    for (const term of here) pending.delete(term);
    return here;
  });
}

/**
 * Splits a text into pieces, marking the first match of each given term:
 * [{ text, mark: true|false }]. Joined back together, the pieces are exactly
 * the original text. Overlapping matches keep the earlier (or longer) one.
 */
export function markTerms(text, terms) {
  const found = terms
    .map((term) => ({ start: findTerm(text, term), length: term.length }))
    .filter((m) => m.start !== -1)
    .sort((a, b) => a.start - b.start || b.length - a.length);
  const pieces = [];
  let at = 0;
  for (const { start, length } of found) {
    if (start < at) continue; // overlaps a piece already marked
    if (start > at) pieces.push({ text: text.slice(at, start), mark: false });
    pieces.push({ text: text.slice(start, start + length), mark: true });
    at = start + length;
  }
  if (at < text.length || pieces.length === 0) pieces.push({ text: text.slice(at), mark: false });
  return pieces;
}

// ---------------------------------------------------------------------------
// Colour groups: each technology is coloured by its group, in the CV chips and
// highlighted terms and on the website (globals.css has one variable per group,
// --stack-<id>, with a lighter variant for dark surfaces). A name that is in no
// group keeps the accent colour. `color` is the light-theme / PDF colour,
// `dark` the variant for dark surfaces (both pass WCAG AA, 4.5:1, on their
// backgrounds). scripts/stack.test.mjs checks that globals.css uses these values.
// ---------------------------------------------------------------------------

export const STACK_GROUPS = [
  {
    id: "java",
    label: "Java ecosystem",
    color: "#c2410c",
    dark: "#fb923c",
    names: ["Java", "Spring MVC", "Spring Boot", "JPA/Hibernate", "JUnit", "Maven", "JavaFX"],
  },
  { id: "data", label: "Data and messaging", color: "#047857",
    dark: "#34d399", names: ["PostgreSQL", "Postgres", "Liquibase", "Kafka"] },
  {
    id: "devops",
    label: "DevOps and monitoring",
    color: "#6d28d9",
    dark: "#a78bfa",
    names: ["Docker", "AWS", "GitHub Actions", "Bash", "Grafana", "Kibana", "OpenTelemetry"],
  },
  { id: "security", label: "Security and protocols", color: "#1d4ed8",
    dark: "#60a5fa", names: ["OAuth/JWT", "ISO 8583"] },
  { id: "testing", label: "Testing", color: "#475569",
    dark: "#94a3b8", names: ["Cucumber", "UFT"] },
];

/**
 * The group of a stack name or of one of its terms ("JPA/Hibernate", "JPA"
 * and "Hibernate" are all in the Java group), or null if it has none.
 */
export function stackGroup(nameOrTerm) {
  return (
    STACK_GROUPS.find((group) =>
      group.names.some((name) => name === nameOrTerm || stackTerms(name).includes(nameOrTerm)),
    ) ?? null
  );
}

/** The PDF / light-theme colour of a stack name or term, or `fallback` (the accent). */
export function colorOf(nameOrTerm, fallback) {
  return stackGroup(nameOrTerm)?.color ?? fallback;
}
