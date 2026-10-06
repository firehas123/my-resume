# Statistics backups

`npm run stats:backup` saves the complete visit statistics here as
`<YYYY-MM-DD>.json`. Commit the file to keep a copy in the repository.

To load a backup into a new, empty database:

```bash
npm run stats:restore data/stats-backup/<YYYY-MM-DD>.json
```

The files contain only aggregated numbers (counts per day, country, page and so
on) and the last 25 views as country, page and time. No personal data.
