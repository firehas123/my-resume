import type { QrShape } from "@/lib/qr";
import styles from "./QrCode.module.css";

/**
 * The QR code as an inline SVG: black squares on a white square that also
 * forms the quiet zone, in both themes. It scales to the width of its box;
 * crispEdges keeps the module edges sharp at any size.
 */
export function QrCode({ shape, label, className }: { shape: QrShape; label: string; className?: string }) {
  return (
    <svg
      className={[styles.qr, className].filter(Boolean).join(" ")}
      viewBox={`0 0 ${shape.total} ${shape.total}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={label}
    >
      <rect width={shape.total} height={shape.total} className={styles.light} />
      <path d={shape.d} className={styles.dark} />
    </svg>
  );
}
