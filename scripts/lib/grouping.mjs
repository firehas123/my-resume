// The rules that put a GitHub repo into a language group (a tab on the site).
// Pure functions only (no network, no files), so they are easy to test:
// see scripts/grouping.test.mjs. The rule lists come from
// src/data/language-groups.json.

/**
 * @param {{ ignored: string[], merged: Record<string, string>, order: string[], fallback: string }} rules
 */
export function createGrouping(rules) {
  const ignoredSet = new Set(rules.ignored);

  /** Tab order: the listed groups first, then the rest A-Z, the fallback last. */
  function compareGroups(a, b) {
    const rank = (group) => {
      if (group === rules.fallback) return Number.MAX_SAFE_INTEGER;
      const i = rules.order.indexOf(group);
      return i === -1 ? rules.order.length : i;
    };
    return rank(a) - rank(b) || a.localeCompare(b);
  }

  /**
   * Picks the group for one repo.
   * @param {{ name: string, bytes: number }[]} languages  the repo's languages
   * @returns {{ group: string, reason: string }}  reason explains the choice in words
   */
  function autoGroup(languages) {
    const ignored = languages.filter((l) => ignoredSet.has(l.name)).map((l) => l.name);
    const counted = languages.filter((l) => !ignoredSet.has(l.name) && l.bytes > 0);

    if (counted.length === 0 && ignored.length === 0) {
      return { group: rules.fallback, reason: "no languages detected" };
    }
    if (counted.length === 0) {
      return { group: rules.fallback, reason: `only ${listNames(ignored)}, which is not counted as project code` };
    }

    // Add up the bytes per group, after merging related languages.
    const groups = new Map();
    for (const lang of counted) {
      const name = rules.merged[lang.name] ?? lang.name;
      const entry = groups.get(name) ?? { name, bytes: 0, languages: [] };
      entry.bytes += lang.bytes;
      entry.languages.push(lang.name);
      groups.set(name, entry);
    }
    const countedBytes = counted.reduce((sum, l) => sum + l.bytes, 0);
    // Largest share wins; a tie goes to the group that comes first in tab order.
    const winner = [...groups.values()].sort((a, b) => b.bytes - a.bytes || compareGroups(a.name, b.name))[0];

    const notes = [`${winner.name} is ${formatShare((100 * winner.bytes) / countedBytes)} of the project code`];
    // Mention merges that are not obvious from the group's own name, e.g.
    // "Jupyter Notebook counted as Python" (but not "C++ counted as C / C++").
    const groupParts = winner.name.split(" / ");
    const renamed = winner.languages.filter((name) => !groupParts.includes(name));
    if (renamed.length) notes.push(`${listNames(renamed)} counted as ${winner.name}`);
    if (ignored.length) notes.push(`${listNames(ignored)} ignored`);
    return { group: winner.name, reason: notes.join("; ") };
  }

  /**
   * The final group: a "group" in overrides.json always wins.
   * @returns {{ group: string, auto: string, reason: string }}
   */
  function decideGroup(languages, override = {}) {
    const auto = autoGroup(languages);
    const forced = override.group;
    if (typeof forced === "string" && forced.trim()) {
      return { group: forced.trim(), auto: auto.group, reason: `set in overrides.json (automatic choice: ${auto.group})` };
    }
    return { group: auto.group, auto: auto.group, reason: auto.reason };
  }

  /**
   * A group gets its own tab only if it is a mainstream language or has at
   * least `minProjectsForOwnTab` projects; otherwise its projects move to the
   * fallback ("Other"). Groups set in overrides.json are never moved.
   * @param {{ name: string, group: string, reason: string, forced?: boolean, hidden?: boolean }[]} decisions
   */
  function applyTabRule(decisions) {
    const mainstream = new Set(rules.mainstream ?? []);
    const minimum = rules.minProjectsForOwnTab ?? 1;
    const counts = new Map();
    for (const d of decisions) if (!d.hidden) counts.set(d.group, (counts.get(d.group) ?? 0) + 1);
    return decisions.map((d) => {
      if (d.forced || d.group === rules.fallback || mainstream.has(d.group)) return d;
      const count = counts.get(d.group) ?? 0;
      if (count >= minimum) return d;
      return {
        ...d,
        group: rules.fallback,
        reason: `${d.reason}; ${d.group} has only ${count} project${count === 1 ? "" : "s"} and is not a mainstream language, so it goes under ${rules.fallback}`,
      };
    });
  }

  return { compareGroups, autoGroup, decideGroup, applyTabRule };
}

/** gh's "languages" field -> [{ name, bytes, share }] sorted largest first. */
export function languageBreakdown(ghLanguages) {
  const entries = (ghLanguages ?? []).map((l) => ({ name: l.node.name, bytes: l.size }));
  const total = entries.reduce((sum, l) => sum + l.bytes, 0);
  return entries
    .sort((a, b) => b.bytes - a.bytes)
    .map((l) => ({ ...l, share: total ? (100 * l.bytes) / total : 0 }));
}

/** 53.4 -> "53%", 0.3 -> "<1%". */
export function formatShare(share) {
  if (share > 0 && share < 1) return "<1%";
  return `${Math.round(share)}%`;
}

/** ["A"] -> "A", ["A", "B", "C"] -> "A, B and C". */
export function listNames(names) {
  return names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}
