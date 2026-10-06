// Each project's own link-preview image (1200x630): its title and group.
import { getProject, getProjects } from "@/lib/projects";
import { profile } from "@/lib/profile";
import { SHARE_IMAGE_SIZE, renderShareImage } from "@/lib/shareImage";

export const alt = "Project preview";
export const size = SHARE_IMAGE_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return getProjects().map((project) => ({ slug: project.slug }));
}

export default async function ProjectImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  const title = project?.title ?? "Project";
  return renderShareImage({
    eyebrow: `${profile.name} · ${project?.group ?? "Project"}`,
    lines: [title],
    compact: title.length > 24,
  });
}
