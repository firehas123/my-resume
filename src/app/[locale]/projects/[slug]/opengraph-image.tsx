// Each project's own link-preview image (1200x630), per language: its title and group.
import { getTranslations } from "next-intl/server";
import { getProject, getProjects } from "@/lib/projects";
import { profileFor } from "@/lib/profile";
import { SHARE_IMAGE_SIZE, renderShareImage } from "@/lib/shareImage";

type Params = { locale: string; slug: string };

export function generateStaticParams() {
  return getProjects().map((project) => ({ slug: project.slug }));
}

// Alt text: see the note in app/[locale]/opengraph-image.tsx.
export const size = SHARE_IMAGE_SIZE;
export const contentType = "image/png";
export const alt = profileFor("en").name;

export default async function ProjectImage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  const project = getProject(slug, locale);
  const t = await getTranslations({ locale, namespace: "projects.groups" });
  const group = project ? (t.has(project.group) ? t(project.group) : project.group) : "";
  const title = project?.title ?? slug;
  return renderShareImage({
    eyebrow: (await getTranslations({ locale, namespace: "project" }))("shareEyebrow", { name: profileFor(locale).name, group }),
    lines: [title],
    compact: title.length > 24,
    locale,
  });
}
