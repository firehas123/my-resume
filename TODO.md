# Open items

Everything here still needs something from you. Nothing on this list is shown on the
website; the site uses neutral, true wording until an item is done.

- **Turn on hCaptcha in Web3Forms.** In the Web3Forms dashboard, for this access key,
  choose **hCaptcha** under "Block spam". The form already requires the check in the
  browser; this makes Web3Forms reject anything sent without it.
- **Send yourself a test message** from `/contact` on the live site and confirm it
  arrives in Gmail.
- **Add the test coverage figure** if you have it. `src/data/profile.json` → `experience`
  → i2c → the UFT highlight says "increasing test coverage" without a number (the old
  CV had no number either). Run `npm run cv` afterwards.
- **Impressum contact.** German law (§ 5 DDG) usually expects a direct electronic
  contact, typically an email address. The Impressum offers the contact form instead,
  as you prefer; decide whether to add an email address there.
- **Vercel Web Analytics and Speed Insights:** make sure both are enabled in the Vercel
  project (Analytics and Speed Insights tabs).
- **Optional: InfoTech's newer logo.** The site uses the logo from infotechgroup.com.
  If you have the official new file, put it in `public/logos/infotech.png` and note
  the source in `public/logos/SOURCES.md`.
- **Optional: MHC-Solutions** is hidden because it is an untouched Create React App
  starter. Remove `"hide": true` in `src/data/overrides.json` once it has real content.
