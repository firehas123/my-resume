# Open items

Everything here still needs something from you. Nothing on this list is shown on the
website; the site uses neutral, true wording until an item is done.

- **Have a native speaker read the German site and CV** (`/de` and
  `public/files/cv-de.pdf` after a build). German is a primary language, so it carries
  no "translated automatically" note.
- **Decide which languages to keep;** remove any you cannot stand behind. The list is
  `"languages"` in `src/i18n/languages.json` (README, "Languages").
- **Decide whether the CV should show an email, phone number or photo.** Today it
  shows none of them. Email and photo are switches in `src/data/profile.json`
  (`cvShowEmail` with `cvEmail`, `cvShowPhoto`); a phone number is not supported on
  purpose. Note that `profile.json` is public on GitHub, so an email typed there is too.
