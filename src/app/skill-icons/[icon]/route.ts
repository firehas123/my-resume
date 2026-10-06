// Serves the Devicon SVGs used in the skills cloud, e.g. /skill-icons/java-plain.svg.
// Every file is generated at build time from the "devicon" npm package, so
// nothing is copied into the repo and visitors get plain static files.

import { readIconSvg, usedIconNames } from "@/lib/skillIcons";

// Only the logos listed in profile.json exist; any other name is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return usedIconNames().map((name) => ({ icon: `${name}.svg` }));
}

export async function GET(_request: Request, { params }: RouteContext<"/skill-icons/[icon]">) {
  const { icon } = await params;
  const name = icon.replace(/\.svg$/, "");
  return new Response(readIconSvg(name), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // A week: the URLs have no content hash, so they must be able to refresh.
      "Cache-Control": "public, max-age=604800",
    },
  });
}
