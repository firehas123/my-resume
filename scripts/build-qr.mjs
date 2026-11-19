// Builds the downloadable QR codes of the site from src/data/qr.json:
// public/files/resume-qr.svg and public/files/resume-qr.png (1024 x 1024).
//
//   npm run qr          (also runs before every `npm run build` and `npm run dev`)
//
// The same code is drawn on the /qr page (see scripts/lib/qr.mjs). The output
// is always the same for the same address, so rebuilding changes nothing.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import { QUIET_ZONE, qrSvgFile } from "./lib/qr.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const { url } = JSON.parse(readFileSync(join(ROOT, "src/data/qr.json"), "utf8"));
const out = join(ROOT, "public/files");
mkdirSync(out, { recursive: true });

writeFileSync(join(out, "resume-qr.svg"), qrSvgFile(url));
await QRCode.toFile(join(out, "resume-qr.png"), url, {
  type: "png",
  errorCorrectionLevel: "H",
  margin: QUIET_ZONE,
  width: 1024,
  color: { dark: "#000000ff", light: "#ffffffff" },
});
console.log(`QR codes for ${url} -> public/files/resume-qr.svg, resume-qr.png`);
