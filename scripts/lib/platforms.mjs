// The platforms a project can be marked with ("platforms": ["android", "ios"]
// in src/data/overrides.json). Each platform is named by its Devicon logo,
// shown unmodified like the skill logos. Shared by the site (src/lib/projects.ts)
// and scripts/copy-skill-icons.mjs, which copies these logos too.

export const PLATFORMS = {
  android: { label: "Android", logo: "android-plain" },
  ios: { label: "iOS", logo: "apple-original" },
};

/** The Devicon logo names of every platform used in overrides.json. */
export function platformLogos(overrides) {
  return Object.entries(overrides)
    .filter(([key]) => !key.startsWith("_"))
    .flatMap(([, o]) => o.platforms ?? [])
    .map((id) => {
      if (!PLATFORMS[id]) throw new Error(`Unknown platform in overrides.json: ${id}`);
      return PLATFORMS[id].logo;
    });
}
