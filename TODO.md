# Open items

Everything here still needs something from you. Nothing on this list is shown on the
website; the site uses neutral, true wording until an item is done.

- **Switch the contact form to the server check** (about 10 minutes, two free
  accounts): hCaptcha site and secret key, a Resend API key on your Gmail address, four
  variables in Vercel, redeploy, test, then delete the old Web3Forms key. Steps: README,
  "Contact form". Until then, bots that skip the page can still reach Web3Forms.
- **Have a native speaker read the German site and CV** (`/de` and
  `public/files/cv-de.pdf` after a build). German is a primary language, so it carries
  no "translated automatically" note.
- **Decide which languages to keep;** remove any you cannot stand behind. The list is
  `"languages"` in `src/i18n/languages.json` (README, "Languages").
- **Decide whether the CV should show an email, phone number or photo.** Today it
  shows none of them. Email and photo are switches in `src/data/profile.json`
  (`cvShowEmail` with `cvEmail`, `cvShowPhoto`); a phone number is not supported on
  purpose. Note that `profile.json` is public on GitHub, so an email typed there is too.
- **Add the game's store links when they exist.** `src/data/overrides.json`, entry
  `"air-traffic-control"` → `"stores"`: replace `null` after `"appStore"` (line 29) or
  `"googlePlay"` (line 30) with the store page URL. The link then shows on the project
  card and page.
- **Check the machine-translated texts from 22 Nov 2026** (fr, es, it, nl, tr, ar; German
  too, as part of the native-speaker read): the skill names "Android development" and
  "Apple iOS development" (`src/data/profile.json`), the game's summary
  (`src/data/overrides.json`, `"air-traffic-control"`), and `projects.by`,
  `projects.platforms`, `projects.storeHidden` in `messages/<code>.json`.
- **Decide whether Android, iOS, C# and Unity go into the CV PDFs.** They are on the
  website only (`"cv": false` in `src/data/profile.json`), because the French and
  Spanish CVs are already a full A4 page: one more skill pushes them onto a second page.
  To add them, remove `"cv": false` and make room in the CV (for example shorter
  bullets in French and Spanish).
