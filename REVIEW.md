# Review: resume site rebuild

Everything below is on the branch **`redesign/nextjs-site`**, pushed to GitHub and ready
to merge into `main`. See **"Publishing"** at the end: there is one Vercel step
only you can do.

> **Important:** your old Vercel address (my-resume-seven-coral.vercel.app) already
> returns Vercel's `DEPLOYMENT_NOT_FOUND`, and GitHub shows no Vercel deployment of this
> repo since November 2024. The Vercel project seems to have been deleted or disconnected
> from GitHub, so **pushing does not deploy anything right now**, not even to `main`.

## What was built

A Next.js 16 (App Router, TypeScript) site at the repo root, replacing the old
single `index.html`.

- **Home page**, sections in the requested order: header → hero (with lazy 3D
  object) → sliding company strip → About (black band, photo background) →
  Experience (light band, large cards with expandable highlights) → Projects
  (one tab per language group) → Skills cloud → Education and certifications →
  "Get in touch." → footer.
- **`/projects/[slug]`**: one statically generated page per public repo, with an
  optional Markdown write-up from `content/projects/<repo-name>.md`.
- **`/contact`**: labelled form with validation, success/error states and a
  honeypot. It posts to `NEXT_PUBLIC_FORM_ENDPOINT`, and while that is empty it shows
  "not connected yet" and sends nothing.
- **`/impressum`, `/datenschutz`**: placeholder pages with clearly visible TODOs,
  linked from the footer.
- **Dark and light themes**: dark by default, follows the system setting until the
  switch is used, then remembered (localStorage). An inline pre-paint script means
  there is no flash of the wrong theme, and colours cross-fade in 250ms.
- **MHC logo** as a reusable component (exact artwork, takes the text colour), in the
  header (26px, links to the top of the home page) and on the loading screen.
  Favicon from the provided artwork.
- **Loading screen**: first visit per browser session only. M, then H, then C draw
  with a thin accent line, then it fades and lifts away while the headline rises.
  It takes 1.4s and is pure CSS, so it never waits on JavaScript. It's skipped with
  reduced motion, and the real page is rendered underneath from the start.
- **Cursor effect** (`src/hooks/usePushField.ts`): pills move away before the cursor
  reaches them, neighbours share the push, and a soft spring returns them with a
  slight overshoot. (Updated 2026-10-06: the company strip no longer has this effect or a hover pause; it never stops. See "Company logos" in README.md.) Originally the company strip got a much gentler version and paused on
  hover. On touch screens a tap sends a ripple. It uses requestAnimationFrame and
  transforms only, pauses off screen, and is off with reduced motion.
- **Data**: `src/data/profile.json` (from the PDF), `scripts/sync-projects.mjs` →
  `src/data/projects.json`, `src/data/overrides.json`.
- **SEO basics**: titles and descriptions, link-preview image (headshot),
  `sitemap.xml`, `robots.txt`.
- Docs: `README.md` (commands and how-tos), `CLAUDE.md` (purpose and rules).

## Commands

```bash
npm install      # once
npm run dev      # development server on http://localhost:3000 (also on the network)
npm run build    # production build, as Vercel runs it
npm run start    # serve that build
npm run sync     # refresh projects from GitHub (needs gh, logged in)
npm run lint
```

### Preview from your Mac while the dev server runs on this machine

1. On this machine: `cd ~/Desktop/proj/my-resume && npm run dev`
   (the script runs `next dev -H 0.0.0.0`, so it listens on the network, not only localhost).
2. On the Mac, on the same Wi-Fi, open **http://192.168.0.67:3000**
3. If it doesn't load: check that this machine's firewall allows port 3000
   (for example `sudo ufw allow 3000/tcp` if ufw is active). If the IP has changed,
   find it with `hostname -I`, and also update `allowedDevOrigins` in `next.config.ts`.

Once the repo is connected to Vercel again (see "Publishing"), every branch push also
gets a **preview URL** that you can open from any device.

## What I verified

- `npm run lint`: clean. `npm run build`: succeeds, 30 static routes.
- Every progress commit was built on its own before pushing.
- Scripted browser checks (Playwright, headless Chromium), all passing:
  - Intro plays on the first visit only, the headline is in the HTML underneath, and
    the flag is cleared after about 1.7s.
  - Reduced motion: no intro, no 3D, strip not sliding, nothing hidden.
  - Theme: follows the system setting, the toggle is 44px with a label, and the
    choice persists across reloads.
  - Cursor push: the pill moved before the cursor touched it, a neighbour moved too,
    and it settled back home after the cursor left.
  - Strip pauses on hover, resumes after.
  - A tap sends a ripple on a phone viewport, with no horizontal scrolling at 390px.
  - All pages return 200, an unknown project returns 404, and every link and button
    is at least 44px tall.
  - No email, phone, `mailto:` or `tel:` anywhere in the home page HTML, and Fiverr
    is hidden.
  - Contact form (built with a test endpoint, with the network mocked): empty
    fields, a bad email, a server error, success, and the honeypot all behave as
    intended. Values are kept after a failure.
- Contrast (WCAG): every text colour on every background it appears on passes AA
  (4.5:1) in both themes and all bands. The tightest is the deep green accent on the
  light alt background, at 4.66.
- Visual check by screenshots: desktop (1440px) and phone (390px), both themes,
  plus the contact, project and legal pages.
- **Lighthouse** (local production build): desktop 100 / 100 / 100 / 100. Mobile
  performance 97, accessibility 100, best practices 100, SEO 100. On simulated slow 4G
  the mobile LCP is 2.5s, right at the "good" limit. The LCP element is the hero pitch
  text, and the delay comes from loading CSS and fonts, not from the intro or 3D.

Not verified: real devices (iPhone and Mac Safari), and a build on Vercel's own servers.
Vercel is not connected (see the note at the top). The local production build is
the same `next build` Vercel runs.

## Every decision I made for you

**Process**
1. **Pushing.** `claude-code-prompt.txt` says "do not push" and "do not deploy", but
   your chat message asked me to push progress in stages. I followed the chat
   message, but pushed to a **separate branch**, not straight to `main`. That way nothing reaches production until you merge. I did not deploy
   anything, and I could not have: Vercel needs your login.
2. Added `vercel.json` with `"framework": "nextjs"`. Your Vercel project was created
   for a static HTML page, and this guarantees it builds as Next.js without
   touching dashboard settings.
3. Kept React 19.2 and TypeScript 5, which `create-next-app` installs with Next 16.3,
   rather than the very newest majors.

**Content**

4. Experience card summaries are the wording from the design reference, which
   condenses your CV bullets. The full CV bullets are under "Highlights" on each card.
5. Fixed, as instructed: "Werking Student" → "Working Student", "Acheived" →
   "Achieved". Also fixed, not explicitly requested: "a event-driven" → "an
   event-driven"; the certification line "Problem - Solving" is shown as the name
   "Problem Solving"; "Google Coding Jam" → "Google Code Jam".
6. Display names "InfoTech" (full "InfoTech Private Limited" kept in the data as
   `legalName`) and the Master's school as "Friedrich-Alexander-Universität
   Erlangen-Nürnberg", both as in the design reference.
7. The Master's end date and spoken languages are TODO, as instructed, even though
   the PDF says "April 2026" and "Languages: German". German is listed with level TODO.
8. The skills cloud uses all 20 skills from the PDF. The three pill sizes (bigger =
   more central) are my judgement. Adjust `size` (1–3) in `profile.json`.
9. Footer text says "Projects are pulled from GitHub" instead of the reference's
   "update automatically", because they only update when `npm run sync` is run and
   committed.
10. Added a small "Companies I've worked with" label above the strip, a "Show all N
    projects" button when a tab has more than 6, and an "All repositories on GitHub"
    link.

**Projects**

11. Language → tab mapping: replaced on 2026-10-06 by the full language-breakdown rules
    in README.md ("How projects are grouped into tabs"). The current result is in
    `SYNC-REPORT.md`.
12. Card titles are the repo names with dashes turned into spaces (for example
    "Advanced Account Management System"). Override any title in `overrides.json`.
13. No project screenshots exist, so cards have no image area (the reference's grey
    placeholder would look unfinished). Dropping a file into `public/projects/` adds one.

**Design and tech**

14. Motion (`motion/react`, formerly Framer Motion) for scroll reveals, card hover
    lift and tab transitions. The cursor effect is hand-written (a spring simulation)
    because no library does "push away before touching".
15. The 3D object is a slowly turning geodesic wireframe in the text colour with
    accent-coloured vertices, leaning slightly toward the cursor. It loads only on
    screens at least 900px wide, after the page is idle, with WebGL available and no
    reduced motion. Phones never download three.js.
16. About: the photo is a real background anchored left, so on narrower screens the
    crop pushes you right and away from the text. On phones the photo sits above the
    text.
17. Education and certifications sit in their own section that continues the Skills
    band's background, as in the reference. Certifications and Languages are cards
    beside the two degree cards.
18. The header is sticky on screens at least 900px wide only, because on phones it
    would take too much space. On phones the section links move to a second row.
19. Spacing follows the 8px grid, so a few reference values were rounded (20px gaps →
    24px, 36px card padding → 40px).
20. A soft fade mask at both edges of the company strip, so logos slide in instead of
    being cut off. It's functional, not decorative.
21. Typographic apostrophes in headings (Where I’ve worked).
22. Added a 404 page, a "Skip to content" link for keyboard users, `sitemap.xml` and
    `robots.txt`.

## Every TODO (search the code for `TODO`)

| Where | What is missing |
| --- | --- |
| `src/data/profile.json` → education | End date of the Master's (`"end": "TODO"`) |
| `src/data/profile.json` → languages | Spoken languages and their levels (German level unknown; others unknown) |
| `src/data/profile.json` → i2c highlights | The figure in "increasing test coverage by TODO (missing figure)" |
| `src/app/impressum/page.tsx` | The whole Impressum (name, address, contact) |
| `src/app/datenschutz/page.tsx` | Controller details, form service, rights; a technical outline is drafted |
| GitHub / `overrides.json` | **None of the 21 repos has a description**, so cards show no summary. Add descriptions on GitHub and run `npm run sync`, or add `summary` in `overrides.json`. |
| Vercel | `NEXT_PUBLIC_FORM_ENDPOINT` (see below) |

## Things you should know

- **The CV PDF itself contains your phone number and email.** The site never shows
  them, but anyone who downloads the CV sees them. That is normal for a CV, but you
  should know. The PDF also still contains "Werking Student" and "Acheived". I can only
  fix the website text, not the PDF.
- **Impressum vs. "no email".** A German Impressum (§ 5 DDG) generally requires a fast,
  direct way to contact you, which is usually an email address. If the site counts as
  business-like (job seeking can be borderline), you may legally need one there. Please
  decide this yourself or check it; I did not add one.
- **Python tab (updated 2026-10-06).** Your fork `made-project-ws2024` has 43 commits of
  your own, so under the fork rule it is now shown, with a "Fork" label, and fills the
  Python tab.
- **Repo choices are yours.** All 21 public non-fork repos are shown, including the
  old static `my-resume`, `my-tralive-netlifyapp` and `keyLogger`. A recruiter may read
  a repo named "keyLogger" the wrong way out of context. Hide anything with
  `{ "hide": true }` in `overrides.json`.
- The old 72 KB `resume.pdf` at the repo root was replaced by your new CV at
  `public/files/resume.pdf`, so the download URL is now `/files/resume.pdf`.
- The favicon uses the provided artwork exactly. Its strokes are thin, so at 16px it
  is quite faint in browser tabs. A slightly thicker stroke would read better if you
  want to adjust the artwork.
- `resume-site-kit.zip` is still in the folder but ignored by git. Everything in it
  has been copied into `public/` and `design-reference/`.

## What failed or was skipped

- Nothing in the build failed. `npm audit` reports 5 "high" warnings, all inside dev
  tooling (ESLint), not in code that ships to visitors. I did not run
  `npm audit fix --force`, because it would downgrade or break packages.
- R3F prints a harmless `THREE.Clock is deprecated` warning in the browser console.
  It comes from inside the library.

## Connecting the contact form (what you must do)

1. Sign up at a form service, for example **Formspree** (free tier is enough), and
   create a form. Copy its endpoint, for example `https://formspree.io/f/abcdwxyz`.
2. In **Vercel → your project → Settings → Environment Variables**, add:
   - Name: `NEXT_PUBLIC_FORM_ENDPOINT`
   - Value: the endpoint URL
   - Environments: Production (and Preview if you want to test on previews)
3. **Redeploy**: Deployments → latest → ⋯ → Redeploy. The value is built into the page,
   so it only applies to new builds.
4. Open `/contact` and send yourself a test message. In Formspree, confirm your email
   the first time, then check that the message arrives.
5. Then update the Datenschutz page with the service you chose.

For local testing: `cp .env.example .env.local`, fill in the value, restart `npm run dev`.

## Publishing (the steps left for you)

1. **Open and merge a pull request** from `redesign/nextjs-site` into `main`. Your
   GitHub token is not allowed to create pull requests, so I could not open it. Use
   https://github.com/firehas123/my-resume/compare/main...redesign/nextjs-site?expand=1
   then "Create pull request" → "Merge". Merging updates `main`. It does not deploy anything
   by itself while Vercel is disconnected.
2. **Connect the repo to Vercel** (about 2 minutes):
   - Go to https://vercel.com/new and sign in with GitHub.
   - Under "Import Git Repository", choose `firehas123/my-resume` → **Import**.
     If it isn't listed, use "Adjust GitHub App Permissions" to give Vercel access.
   - Framework preset: Next.js is detected automatically (`vercel.json` pins it).
     Leave the build settings at their defaults.
   - Optional now, or later via Settings: add `NEXT_PUBLIC_FORM_ENDPOINT` (see above).
   - Click **Deploy**. When it finishes you get a `*.vercel.app` address. Open it on
     your phone and your Mac.
   - If you previously had a custom domain, add it under Settings → Domains.
3. From then on, every push to `main` deploys to production automatically, and other
   branches get preview URLs.

Alternative without the dashboard: `npx vercel login` and then `npx vercel --prod` in
this folder (asks a few setup questions the first time).

If anything looks wrong after merging, revert the merge commit on GitHub. The old
single-page site comes back on the next deploy.

## Update 2026-10-06: analytics, visit counter and /stats

- Vercel Web Analytics and Speed Insights in the root layout (production only).
- Company logos now get a gentle cursor push while the strip keeps rolling.
- Own visit counter (Upstash Redis), `/stats` page, JSON/CSV export,
  `npm run stats:backup` / `stats:restore`, updated `/datenschutz`.
  Details and the dashboard steps: README.md, "Visitor statistics".
- Still to do in Vercel: enable Web Analytics and Speed Insights, create and connect the
  Upstash Redis database, redeploy. New TODOs on `/datenschutz`: legal basis for the
  analytics and the counter; check the Vercel descriptions against Vercel's current
  privacy pages.
