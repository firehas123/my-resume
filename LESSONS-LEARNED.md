# Lessons learned

The technical problems met while building this site, what was really behind each one,
how it was fixed, and what to take away from it. Grouped by area; the most instructive
ones come first.

Each entry: **Symptom** (what we saw) · **Cause** (what was really wrong) · **Fix** ·
**Lesson**.

---

## 1. Browsers behave differently

### Safari: choosing a language did nothing

- **Symptom:** On Safari (Mac, iPhone, iPad, and Chrome on iOS) choosing a language in the
  menu did nothing at all: the address never changed and the console showed no error.
  Chrome worked, including its phone-sized view.
- **Cause:** Apple's Safari never gives focus to a link or button that is clicked or
  tapped. Chrome does. The menu moved focus to the current language when it opened and
  had a rule "when focus leaves the menu, close it" (meant for keyboard users pressing
  Tab). In Safari, pressing "Deutsch" made focus simply drop, so that rule closed and hid
  the menu *before* the click arrived. The click then landed on nothing.
- **Fix:** Close on focus loss only when focus actually moves to something outside the
  menu (`relatedTarget` is set). When focus just drops, keep the menu open; taps outside
  are already handled by a separate `pointerdown` listener. One line in
  `src/components/layout/LanguageSwitcher.tsx`.
- **Lesson:** Never build open/close logic on focus and blur alone. Test in WebKit, not
  only in Chrome. Chrome's "phone view" is still Chrome.

### Even real WebKit did not reproduce the Safari bug

- **Symptom:** Playwright's WebKit engine switched languages fine on the broken site.
- **Cause:** The "don't focus on click" rule is part of Apple's platforms, not of WebKit
  itself. The Linux build of WebKit that test tools use focuses clicked links like Chrome.
- **Fix:** Tests apply Apple's behaviour on top (a `mousedown` handler that prevents
  focus and blurs whatever had it). With that, the bug reproduced exactly, and the fix
  could be proven in WebKit, Chromium and Firefox on desktop, iPhone and iPad profiles.
- **Lesson:** A test engine is not the real browser. When a bug only appears on one
  platform, find out which platform behaviour causes it and reproduce that behaviour
  deliberately.

### Getting WebKit to run without administrator rights

- **Symptom:** WebKit refused to start: missing system libraries, and installing them
  needs `sudo`.
- **Fix:** Download the packages with `apt-get download` (no root needed), unpack them
  with `dpkg -x`, and put the libraries into a private copy of the browser, since its
  launcher overwrites `LD_LIBRARY_PATH`. Repeat for the libraries those libraries need.
- **Lesson:** "Needs sudo" is often "needs files". You can usually supply them locally.

### Arabic home page crashed on desktop only

- **Symptom:** `/ar` showed "This page couldn't load" on desktop; phones were fine.
- **Cause:** The hero's dot field computes each dot's brightness from its position. In
  right-to-left mode the formula became `1 - x / width`; the last column sits slightly
  past the edge, so the value went negative, `Math.pow(negative, 1.6)` returned `NaN`, and
  the drawing code looked up a brightness group that did not exist. Phones skip the
  cursor effect, so they never hit it.
- **Fix:** Clamp the value to 0–1.
- **Lesson:** `Math.pow` of a negative number with a fractional exponent is `NaN`, not an
  error. Clamp anything that feeds an index.

---

## 2. Right-to-left text (Arabic)

### Words in the wrong order in the PDF and share images

- **Symptom:** In the Arabic CV the letters were shaped correctly, but words, dates and
  punctuation came out in the wrong order ("December – 2024 until now", a full stop on
  the wrong side of "Zertificon.").
- **Cause:** The PDF renderer (react-pdf) and the share-image renderer (satori) shape
  Arabic letters but do not apply the Unicode bidirectional algorithm. They lay text out
  left to right.
- **Fix:** Our own helper (`scripts/lib/rtl.mjs`) splits each line into pieces and lays
  them out right to left with flexbox (`row-reverse`). Three rules had to be added after
  testing: an English stretch ("Careem Super App") stays together in its own order; a
  separator without letters ("–", "|") is its own piece so it stays between the dates;
  clause punctuation after an English word ("Backend:", "Zertificon.") goes to that
  word's left. Each rule has a test in `scripts/rtl.test.mjs`.
- **Lesson:** Right-to-left support is not only `dir="rtl"`. Check every renderer that
  is not a browser, and zoom in on the result. At thumbnail size it all looks fine.

### The status line ran off the screen in Arabic

- **Symptom:** On a phone, the small status line under the header was cut off at the
  left edge in Arabic.
- **Cause:** Each half of the line was set never to wrap, so it could only break at the
  "·". The Arabic second half alone was wider than the screen.
- **Fix:** Each half may still wrap inside itself if needed (`inline-block` with
  `max-width: 100%`), and the "·" moved to the end of the first line.
- **Lesson:** "Never wrap" rules break in the longest language. The automated overflow
  check missed it because it only measured buttons and headings. Measure every element
  that sets `nowrap`.

---

## 3. Multilingual site (Next.js, next-intl)

### The build failed: "Functions cannot be passed to Client Components"

- **Cause:** In next-intl, `t.rich()` calls a function only for **tags** like
  `<link>…</link>`. For a plain placeholder like `{links}` it inserts the value as is, so
  React received a function.
- **Fix:** The two messages use empty tags instead (`<links></links>`,
  `<date></date>`), filled by the same functions.
- **Lesson:** A placeholder and a tag look alike in a message file but are handled
  differently.

### The build failed in the share images

- **Cause:** `generateImageMetadata` (used only to translate the image's alt text) runs
  while Next.js collects routes, before the page's language is known.
- **Fix:** Static image settings, with an alt text that is the same in every language
  (the name). The images themselves are still rendered per language.

### A check that flagged correct translations

- **Symptom:** `npm run i18n:check` reported `"{start} – {end}"` as "not translated".
- **Cause:** It treated any text with letters as words to translate, and the
  placeholder names contain letters.
- **Fix:** Ignore placeholders before deciding whether a text has words of its own.
  Found by writing a test for the helper.

### Rewriting JSON silently changed the files

- **Symptom:** After a script edited the French messages, the visible ` ` escapes
  (no-break spaces before `:` and `?`) had become invisible characters.
- **Fix:** Turn them back into escapes after writing.
- **Lesson:** Rewriting a file through a JSON parser does not preserve how it was
  written. Check the diff, not only the result.

### Phone header too crowded in long languages

- **Symptom:** In German the header's "Lebenslauf herunterladen" button squeezed the
  language button until its globe icon shrank to a dot, and the actions wrapped.
- **Fix:** On narrow phones the header button shows a short label ("CV"), icons never
  shrink (`flex-shrink: 0`), and the section links wrap left-aligned like text.
- **Lesson:** Test the longest language, not just English.

---

## 4. Contact form and spam protection

### The captcha could be skipped

- **Symptom:** With hCaptcha switched on in Web3Forms, a message **without** any captcha
  answer was still accepted; only a *fake* answer was rejected.
- **Cause:** Web3Forms checks an answer when one is sent, but does not require one. The
  page enforced it, but a bot can post to Web3Forms directly.
- **Fix:** A server route, `/api/contact`, that verifies the answer with hCaptcha before
  anything is sent, and delivers through Resend. It switches on once four environment
  variables are set (see README, "Contact form"); until then Web3Forms stays in use.
- **Two walls on the way:** Web3Forms' free plan refuses requests from servers ("Pro
  plan is required"), so the server cannot simply forward to it. And Web3Forms' shared
  hCaptcha key has no secret, so the server cannot verify answers made with it. Hence
  your own hCaptcha keys and a different mail service.
- **Testing without accounts:** hCaptcha publishes official test keys. With them, its
  real verification service accepts the test answer, which let the whole route be tested
  for real. The rules themselves are a pure function with injected dependencies, so they
  are unit-tested without any network (`scripts/contact.test.mjs`).
- **Lesson:** A check that only runs in the browser is a suggestion. Anything that
  matters must be checked on a server you control.

### Keeping the email address out of the page

- **Risk:** `profile.json` is imported by components; if a component that runs in the
  browser imported it, every field (including a CV email, if one is ever filled in)
  would end up in the site's JavaScript.
- **Check:** Search the built browser bundles for profile-only fields. Nothing was there,
  because the data is read on the server only.
- **Lesson:** "Not shown on the page" is not the same as "not sent to the browser".
  Check the built files.

---

## 5. Deployments, Git and GitHub

### "Deployed successfully", but the live site was old

- **Symptom:** GitHub reported Vercel's deployment as successful, yet the live site
  still served the previous version.
- **Cause:** One commit had **two** deployments: a preview (the branch was pushed first)
  and production (`main`). The check read the first "success", the preview, while
  production was still building.
- **Fix:** Wait for the deployment whose environment is `Production`.
- **Lesson:** Check the right deployment, then check the live site itself.

### The push was rejected

- **Cause:** The daily sync workflow had pushed a commit to `main` overnight.
- **Fix:** Put the change on its own branch, rebase it on the new `main`, fast-forward.
- **Lesson:** Once automation commits to `main`, always fetch before pushing.

### Vercel would have deployed the backup branch

- **Cause:** The backup branch holds only data. Vercel reads `vercel.json` from the commit
  being deployed, so a rule only in `main`'s file might not apply to that branch.
- **Fix:** The rule (`"git": { "deploymentEnabled": { "stats-backup": false } }`) is in
  `main`'s `vercel.json`, and the workflow copies that file onto the backup branch.
  Verified: no deployment for the first backup.

### The access token could not open pull requests or start workflows

- **Fix:** Work on a branch, then fast-forward `main` (still a linear history). For the
  first backup run, the workflow also runs when its own code changes on `main`, and
  merging set it off.
- **Lesson:** Know what your automation token may do before planning around it.

### A backup that cannot replace a good one

- **Design:** The backup script writes nothing unless the export is valid, complete, not
  empty, and has no fewer days or visits than the last backup (counts only grow, so
  fewer means the database was lost). Files are written to a temporary name and then
  renamed, so a crash cannot leave half a file.
- **Lesson:** For backups, "it ran" is not enough. Define what a good backup is and
  refuse anything else.

---

## 6. Animation and layout

- **Content hidden without JavaScript:** Scroll reveals start invisible. They are
  hidden only when a `js` class is on the page (set by a tiny script before the first
  paint), so without JavaScript, or for search engines, everything is visible.
- **Intro logo flying to the wrong place:** The logo's target was measured after
  React loaded, which on a slow first load was after the animation had started. A small
  inline script right after the header measures it during page load instead.
- **Theme circle and the header:** The circular theme switch uses a View Transition of
  the whole page. Elements with their own transition names (header, project titles)
  were animated separately; during the switch, all names are removed so the page is one
  picture. Browsers without View Transitions, and visitors who prefer reduced motion, get
  a plain colour fade.
- **Band blends looked like dark smudges:** A straight two-colour gradient reads as a
  shadow. Several eased stops plus a fade at the bottom of the photo made it smooth.
- **CSS Modules rejected a selector:** In CSS Modules every selector needs a class of
  its own file; a purely global one (`html[data-intro] [data-header-logo]`) has to live
  in `globals.css`.
- **A TypeScript type guard made a value impossible:** `isExternal(href): href is string`
  told TypeScript that in the "else" branch `href` is not a string, so `href.startsWith`
  became `never`. A plain `boolean` return fixed it.

---

## 7. Testing traps (when the test, not the site, was wrong)

These looked like bugs and were not. Worth knowing so you don't "fix" working code:

- **An old server answered the tests.** A previous `next start` was still holding the
  port, so the new build was never tested. Check what is listening before trusting
  results.
- **A headline "never revealed" on phones.** On a phone the section is taller than the
  screen; jumping to its middle left the headline above the viewport, so it never came
  into view. Scroll to the element itself.
- **"Image too small" on high-density screens.** `naturalWidth` is density-corrected for
  `srcset` images; the browser had in fact loaded the 1200px file.
- **An old picture after replacing it.** Next.js caches optimized images locally by
  address; delete `.next/cache/images` when testing a replaced file.
- **English "found" on the Spanish page.** "con GitHub Actions" contains "on GitHub". Look
  at the context before believing a text search.
- **Stale route types.** After moving pages under `[locale]`, TypeScript errors came from
  old generated types; `next typegen` regenerates them.

---

## General takeaways

1. **Reproduce first, then fix.** The Safari fix was only trustworthy once the exact
   failure ("the address never changes") had been reproduced.
2. **Test where your visitors are:** WebKit and phone sizes, the longest language,
   right to left, without JavaScript, with reduced motion.
3. **Verify the live result,** not the tool's report: open the deployed site.
4. **Prefer one source of truth** (one language list, one profile file, shared validation
   for browser and server) so a fix in one place fixes everything.
5. **Write the test that would have caught the bug.** Several bugs above were found by
   writing a small test for a helper.
