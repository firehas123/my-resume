import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import QRCode from "qrcode";
import { QUIET_ZONE, qrMatrix, qrPath } from "./lib/qr.mjs";

const { url } = JSON.parse(readFileSync(new URL("../src/data/qr.json", import.meta.url), "utf8"));

/** Draws the grid as black-on-white pixels (with the quiet zone) and decodes it. */
function decodeMatrix({ size, cells }, scale = 8) {
  const side = (size + 2 * QUIET_ZONE) * scale;
  const pixels = new Uint8ClampedArray(side * side * 4).fill(255);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!cells[y * size + x]) continue;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const i = (((y + QUIET_ZONE) * scale + dy) * side + (x + QUIET_ZONE) * scale + dx) * 4;
          pixels[i] = pixels[i + 1] = pixels[i + 2] = 0;
        }
      }
    }
  }
  return jsQR(pixels, side, side)?.data;
}

test("the address is the live site", () => {
  assert.equal(url, "https://my-resume-pied-tau.vercel.app/");
});

test("the code drawn on the site decodes to exactly the address", () => {
  assert.equal(decodeMatrix(qrMatrix(url)), url);
});

test("the code uses error correction level H", () => {
  // In the QR standard level H is coded as 2 (L=1, M=0, Q=3).
  assert.equal(QRCode.create(url, { errorCorrectionLevel: "H" }).errorCorrectionLevel.bit, 2);
  const { size } = qrMatrix(url);
  // The same address at level L would need a smaller grid; H costs modules.
  assert.ok(size > QRCode.create(url, { errorCorrectionLevel: "L" }).modules.size);
});

test("the SVG path has one square per dark module, inside the quiet zone", () => {
  const { size, cells } = qrMatrix(url);
  const { total, d } = qrPath(url);
  assert.equal(total, size + 2 * QUIET_ZONE);
  assert.equal((d.match(/M/g) ?? []).length, cells.filter(Boolean).length);
});

test("the downloadable PNG decodes to exactly the address", () => {
  const png = PNG.sync.read(readFileSync(new URL("../public/files/resume-qr.png", import.meta.url)));
  assert.equal(jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data, url);
});

test("the downloadable SVG is the same code as the page", () => {
  const svg = readFileSync(new URL("../public/files/resume-qr.svg", import.meta.url), "utf8");
  assert.ok(svg.includes(`d="${qrPath(url).d}"`));
  assert.ok(svg.includes('fill="#ffffff"'));
});
