# Open items

Everything here still needs something from you. Nothing on this list is shown on the
website; the site uses neutral, true wording until an item is done.

- **Confirm the Master's end date.** `src/data/profile.json` → `education` → the
  Master's `"end"` is `"present"`. Change it to `"YYYY-MM"` once known (the CV says
  April 2026).
- **Add language levels and any other languages.** `src/data/profile.json` →
  `languages`. English and German are listed without a level; add `"level"` (for example
  `"C1"`) and any other languages.
- **Add the test coverage figure.** `src/data/profile.json` → `experience` → i2c → the
  UFT highlight now says "increasing test coverage" without a number.
- **Complete the Impressum.** `src/app/impressum/page.tsx` shows your name and
  "Nürnberg, Deutschland" only. A postal address (street, number, postcode, city) is
  normally required in Germany, and usually a direct contact such as an email address.
  Decide whether to add them; nothing was invented.
- **Review the privacy page.** `src/app/datenschutz/page.tsx` describes what the site
  actually does (Vercel hosting, Web Analytics, Speed Insights, Web3Forms, own counter).
  Have it checked, and compare the Vercel sections with Vercel's current privacy pages.
- **Replace the downloadable CV.** `public/files/resume.pdf` still contains your phone
  number and two typos ("Werking Student", "Acheived").
- **Confirm the InfoTech logo** is the right company (InfoTech Group, Lahore). If not,
  delete `public/logos/infotech.png` and the name is shown as text.
- **Send yourself a test message** from `/contact` on the live site and confirm it
  arrives in Gmail (the Web3Forms key is wired in, but no real message was sent during
  the build).
- **Vercel dashboard:** enable Web Analytics and Speed Insights, create the Upstash Redis
  database and connect it to this project, then redeploy (see README.md, "Visitor
  statistics").
- **Optional:** after this merge, run `npm run sync` once so the `my-resume` project
  page reads the updated README (its summary is already overridden in
  `src/data/overrides.json`).
- **Optional:** add GitHub descriptions to your repos, or `summary` overrides in
  `src/data/overrides.json`, where the README-based summary is not ideal.
