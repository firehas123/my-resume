// The site's public address, used for absolute URLs in link previews and the
// sitemap. Order: explicit setting, then Vercel's production domain (set
// automatically on Vercel), then localhost for local builds.
export function siteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return new URL(explicit);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return new URL(`https://${vercel}`);
  return new URL("http://localhost:3000");
}
