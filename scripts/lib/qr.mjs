// The QR code of the site, shared by the website (the /qr page and the header
// overlay) and scripts/build-qr.mjs (the downloadable files). Plain JavaScript
// so both can use it. Tested in scripts/qr.test.mjs, which decodes the result.
//
// Error correction level H: up to ~30% of the code may be covered or damaged
// and it still scans (a thumb on the phone screen, glare, a scratched print).

import QRCode from "qrcode";

/** Empty modules around the code. The QR standard asks for at least 4. */
export const QUIET_ZONE = 4;

/**
 * The code as a grid: `cells[y * size + x]` is true for a dark module.
 * `size` is the number of modules per side, without the quiet zone.
 */
export function qrMatrix(url) {
  const code = QRCode.create(url, { errorCorrectionLevel: "H" });
  return { size: code.modules.size, cells: Array.from(code.modules.data, Boolean) };
}

/**
 * One SVG path drawing every dark module as a 1x1 square, in a coordinate
 * system that already includes the quiet zone (so the full image is
 * `total` x `total` units).
 */
export function qrPath(url) {
  const { size, cells } = qrMatrix(url);
  let d = "";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (cells[y * size + x]) d += `M${x + QUIET_ZONE} ${y + QUIET_ZONE}h1v1h-1z`;
    }
  }
  return { total: size + 2 * QUIET_ZONE, d };
}

/** A standalone SVG file: black modules on a white square with a white quiet zone. */
export function qrSvgFile(url) {
  const { total, d } = qrPath(url);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="1024" height="1024" shape-rendering="crispEdges">` +
    `<rect width="${total}" height="${total}" fill="#ffffff"/>` +
    `<path d="${d}" fill="#000000"/>` +
    `</svg>\n`
  );
}
