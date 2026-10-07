// The site's link-preview image (1200x630) in each language: MHC logo, my
// name and the headline. One image per language, generated at build time
// for every language the layout lists (generateStaticParams in layout.tsx).
//
// The alt text is my name, which reads the same in every language. (A
// translated alt text would need generateImageMetadata, which Next.js runs
// before the language is known.)
import { profileFor } from "@/lib/profile";
import { SHARE_IMAGE_SIZE, renderShareImage } from "@/lib/shareImage";

type Params = { locale: string };

export const size = SHARE_IMAGE_SIZE;
export const contentType = "image/png";
export const alt = profileFor("en").name;

export default async function OpengraphImage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  const profile = profileFor(locale);
  return renderShareImage({ eyebrow: profile.name, lines: [...profile.intro.headline], locale });
}
