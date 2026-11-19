// The site's QR code for the /qr page and the header overlay. It is drawn
// when the pages are built (static SVG in the HTML), so it shows instantly
// and needs no network. The address lives in src/data/qr.json.

import qrConfig from "@/data/qr.json";
import { qrPath } from "../../scripts/lib/qr.mjs";

/** The address the QR code opens: the home page of the live site. */
export const QR_URL: string = qrConfig.url;

/** The address as people read it: without "https://" and the final slash. */
export const QR_DISPLAY_URL = QR_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");

/** The downloadable files built by scripts/build-qr.mjs. */
export const QR_FILES = { svg: "/files/resume-qr.svg", png: "/files/resume-qr.png" } as const;

export type QrShape = { total: number; d: string };

/** The code as one SVG path (see scripts/lib/qr.mjs), quiet zone included. */
export function qrShape(): QrShape {
  return qrPath(QR_URL);
}
