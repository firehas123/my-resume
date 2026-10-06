import { existsSync } from "node:fs";
import { join } from "node:path";

// Company logos are optional files in public/logos/ (e.g. zertificon.svg or
// careem.png). This runs at build time; when no file exists the strip shows
// the company name as text instead.
const EXTENSIONS = ["svg", "png"];

export function findCompanyLogo(basename: string): string | null {
  for (const ext of EXTENSIONS) {
    if (existsSync(join(process.cwd(), "public", "logos", `${basename}.${ext}`))) {
      return `/logos/${basename}.${ext}`;
    }
  }
  return null;
}
