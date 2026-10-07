import type { MetadataRoute } from "next";
import { LANGUAGES, LEGAL_LANGUAGES } from "@/i18n/config";
import { getProjects } from "@/lib/projects";
import { absoluteUrl, languageAlternates } from "@/lib/seo";

type Href = Parameters<typeof absoluteUrl>[0];

// /sitemap.xml, generated at build time: every page in every language it
// exists in, each with links to its other languages (hreflang).
export default function sitemap(): MetadataRoute.Sitemap {
  const entries = (href: Href, languages: string[], lastModified?: string) =>
    languages.map((locale) => ({
      url: absoluteUrl(href, locale),
      ...(lastModified ? { lastModified } : {}),
      alternates: { languages: languageAlternates(href, languages) },
    }));

  return [
    ...entries("/", LANGUAGES),
    ...entries("/contact", LANGUAGES),
    ...entries("/legal-notice", LEGAL_LANGUAGES),
    ...entries("/privacy", LEGAL_LANGUAGES),
    ...getProjects().flatMap((project) =>
      entries({ pathname: "/projects/[slug]", params: { slug: project.slug } }, LANGUAGES, project.pushedAt),
    ),
  ];
}
