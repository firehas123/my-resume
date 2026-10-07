// Right-to-left text for renderers that shape Arabic letters correctly but do
// not put words in right-to-left order: the share-image renderer (satori) and
// the PDF renderer (react-pdf). Instead of one long string, they get the
// line as separate pieces and lay them out themselves, right to left
// (flexbox "row-reverse" with wrapping). Each piece is shaped on its own,
// which is correct because Arabic letters only join within a word.
// Tested in scripts/rtl.test.mjs.

/** Letters of right-to-left scripts (Hebrew, Arabic, Syriac, Thaana, ..., Arabic presentation forms). */
const RTL_LETTER = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
/** Splits a word into stretches of right-to-left and other characters. */
const SCRIPT_PARTS = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]+|[^\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]+/g;
/** Punctuation at the end of a word, e.g. the full stop in "برمجيات." or the comma "،". */
const TRAILING_PUNCTUATION = /^(.*?)([.,:;!?،؛)]+)$/u;

/** Clause punctuation after a left-to-right word, e.g. "Backend:" or "Zertificon." */
const LTR_TRAILING_PUNCTUATION = /^(.*[\p{L}\p{N}])([.,:;!?]+)$/u;

/** True when a text contains right-to-left letters. */
export function hasRtl(text) {
  return RTL_LETTER.test(text);
}

/**
 * A right-to-left line as visual pieces, the first piece being the rightmost.
 * - A right-to-left word is one piece; punctuation at its end is kept apart
 *   (`punctuation`), because in right-to-left text it sits on the word's left.
 * - A stretch of left-to-right words ("Careem Super App", "FAU", "12/2024")
 *   stays together as one piece, in its own order.
 * - A separator without letters or digits ("–", "|") is a piece of its own.
 * - A word that mixes both ("وMicroservices": "and" + an English term) is
 *   split by script; the later parts have `attach: true` (no space before).
 * Returns [{ text, punctuation, rtl, attach }].
 */
export function rtlRuns(line) {
  const runs = [];
  let ltr = [];
  const flush = () => {
    if (ltr.length) runs.push({ text: ltr.join(" "), punctuation: "", rtl: false, attach: false });
    ltr = [];
  };
  for (const word of line.split(/\s+/).filter(Boolean)) {
    if (!/[\p{L}\p{N}]/u.test(word)) {
      // A separator with no letters or digits ("–", "|", "·") belongs to
      // neither direction: it stays between its neighbours as its own piece,
      // so "ديسمبر 2024 – حتى الآن" keeps the dash between the two dates.
      flush();
      runs.push({ text: word, punctuation: "", rtl: false, attach: false });
      continue;
    }
    if (!hasRtl(word)) {
      // A left-to-right word ending a clause ("Backend:", "Zertificon."):
      // the punctuation belongs to the right-to-left sentence, so it ends
      // the stretch and goes to the word's left. "(C1)" and "X.509" keep theirs.
      const end = LTR_TRAILING_PUNCTUATION.exec(word);
      if (end) {
        ltr.push(end[1]);
        runs.push({ text: ltr.join(" "), punctuation: end[2], rtl: false, attach: false });
        ltr = [];
        continue;
      }
      ltr.push(word);
      continue;
    }
    const match = TRAILING_PUNCTUATION.exec(word);
    const [core, punctuation] = match && match[1] ? [match[1], match[2]] : [word, ""];
    if (!hasRtl(core)) {
      // A left-to-right word followed by Arabic punctuation ("App،"): it ends
      // the left-to-right stretch, and the punctuation goes to its left.
      ltr.push(core);
      runs.push({ text: ltr.join(" "), punctuation, rtl: false, attach: false });
      ltr = [];
      continue;
    }
    flush();
    const parts = core.match(SCRIPT_PARTS) ?? [core];
    parts.forEach((part, i) => {
      runs.push({ text: part, punctuation: i === parts.length - 1 ? punctuation : "", rtl: hasRtl(part), attach: i > 0 });
    });
  }
  flush();
  return runs;
}

/**
 * The pieces of rtlRuns() grouped into words: a mixed word ("وMicroservices")
 * is one group of several pieces. Renderers put a space between groups and
 * lay out each group's pieces right to left without one.
 */
export function rtlWords(line) {
  const words = [];
  for (const run of rtlRuns(line)) {
    if (run.attach && words.length) words[words.length - 1].push(run);
    else words.push([run]);
  }
  return words;
}
