// What a statistics backup must look like. No dependencies, so the weekly
// backup workflow can use it without installing anything. Used by
// scripts/stats-fetch-backup.mjs (the workflow) and by stats-store.mjs
// (`npm run stats:restore`). Tested in scripts/stats-backup.test.mjs.

export const EXPORT_FORMAT = "resume-site-stats";
export const EXPORT_VERSION = 1;
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

/** Throws when `data` is not a backup that `npm run stats:restore` can load. */
export function validateBackup(data) {
  if (!data || data.format !== EXPORT_FORMAT) throw new Error(`Not a ${EXPORT_FORMAT} backup file.`);
  if (data.version !== EXPORT_VERSION) throw new Error(`Unsupported backup version ${data.version}.`);
  for (const date of Object.keys(data.days ?? {})) {
    if (!DATE_PATTERN.test(date)) throw new Error(`Invalid day in backup: ${date}`);
  }
}

/** All-time visits in a backup (0 when unknown). */
export function totalVisits(data) {
  return Number(data?.total?.v ?? 0) || 0;
}

/**
 * The checks for an automatic backup, stricter than for a restore:
 * the right structure, and not empty. With `previous` (the newest backup
 * already saved), also never less than before: days are never deleted and
 * the totals only grow, so fewer days or fewer visits means the database
 * was lost or reset, and that must not replace a good backup.
 * Returns a list of problems; empty means the backup is good.
 */
export function backupProblems(data, previous = null) {
  const problems = [];
  try {
    validateBackup(data);
  } catch (error) {
    return [error.message];
  }
  if (typeof data.exportedAt !== "string" || Number.isNaN(Date.parse(data.exportedAt))) problems.push("exportedAt is missing or not a date.");
  if (!isObject(data.meta) || !DATE_PATTERN.test(String(data.meta.since ?? ""))) problems.push("meta.since (the first counted day) is missing.");
  if (!isObject(data.total)) problems.push("total is missing.");
  if (!isObject(data.days) || Object.keys(data.days).length === 0) problems.push("The backup holds no days (empty statistics).");
  if (!Array.isArray(data.recent)) problems.push("recent is not a list.");
  if (problems.length === 0 && previous) {
    const days = Object.keys(data.days).length;
    const previousDays = Object.keys(previous.days ?? {}).length;
    if (days < previousDays) problems.push(`Fewer days than the last backup (${days} < ${previousDays}).`);
    if (totalVisits(data) < totalVisits(previous)) problems.push(`Fewer all-time visits than the last backup (${totalVisits(data)} < ${totalVisits(previous)}).`);
  }
  return problems;
}
