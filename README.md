# Statistics backups

The complete visit statistics are backed up **every Monday** by the "Stats backup"
workflow (`.github/workflows/stats-backup.yml`), and whenever it is started by hand
from the repository's Actions tab. The backups live on the separate **`stats-backup`**
branch, not on `main`:

- `data/stats-backup/<YYYY-MM-DD>.json`: one file per run, all kept,
- `data/stats-backup/latest.json`: always the newest good backup.

Pushes to that branch never deploy (see `vercel.json`).

## Restore a backup

Restore only works into an **empty** statistics database, so counts can never be
overwritten or doubled. With the database connection in `.env.local`
(`npx vercel env pull .env.local`):

```bash
git fetch origin stats-backup
git show origin/stats-backup:data/stats-backup/latest.json > /tmp/stats-latest.json
npm run stats:restore /tmp/stats-latest.json
```

For an older one, use its date instead of `latest`, for example
`origin/stats-backup:data/stats-backup/2026-10-12.json`.

## Manual backup

`npm run stats:backup` (needs the database connection) writes the same kind of file
to `data/stats-backup/` in your working copy, if you ever want one by hand.

The files contain only aggregated numbers (counts per day, country, page and so on)
and the last 25 views as country, page and time. No personal data.
