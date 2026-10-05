import type { MetadataRoute } from "next";
import { getProjects } from "@/lib/projects";
import { siteUrl } from "@/lib/site";

// /sitemap.xml, generated at build time.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const pages = ["/", "/contact", "/impressum", "/datenschutz"].map((path) => ({
    url: new URL(path, base).toString(),
  }));
  const projects = getProjects().map((project) => ({
    url: new URL(`/projects/${project.slug}`, base).toString(),
    lastModified: project.pushedAt,
  }));
  return [...pages, ...projects];
}
