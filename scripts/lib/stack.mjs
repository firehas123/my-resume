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
