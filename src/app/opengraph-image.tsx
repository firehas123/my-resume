// The site's link-preview image (1200x630): MHC logo, my name and the headline.
import { profile } from "@/lib/profile";
import { SHARE_IMAGE_SIZE, renderShareImage } from "@/lib/shareImage";

export const alt = `${profile.name}: ${profile.intro.headline.join(" ")}`;
export const size = SHARE_IMAGE_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderShareImage({ eyebrow: profile.name, lines: [...profile.intro.headline] });
}
