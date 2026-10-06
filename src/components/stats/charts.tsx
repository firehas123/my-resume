"use client";

// Small SVG charts for the stats page. Accessibility rules:
// - every chart has a text title and an aria-label summary,
// - every bar has a <title> with its exact numbers (shown on hover),
// - the exact numbers are always available as a table ("Show numbers"),
// - two series are told apart by shape (hollow vs solid), not colour alone.

import { formatNumber, plural } from "./format";
import styles from "./Stats.module.css";

/** Rounds a maximum up to a tidy number so the axis labels are readable. */
function niceMax(value: number): number {
  if (value <= 4) return Math.max(1, value);
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].map((s) => s * magnitude).find((s) => value <= s * 4) ?? magnitude * 10;
  return Math.ceil(value / step) * step;
}

/**
 * Animation delay for the i-th of n bars: they grow in one after another,
 * the whole row within ~400ms however many bars there are (see .grow).
 */
function stagger(i: number, n: number): React.CSSProperties {
  return { "--delay": `${Math.round((i / Math.max(1, n)) * 400)}ms` } as React.CSSProperties;
}

/** The exact numbers behind a chart, as a table in a <details> element. */
export function NumbersTable({ caption, columns, rows }: { caption: string; columns: string[]; rows: (string | number)[][] }) {
  return (
    <details className={styles.numbers}>
      <summary>Show numbers</summary>
      <div className={styles.tableWrap}>
        <table>
          <caption className="visually-hidden">{caption}</caption>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) =>
                  j === 0 ? (
                    <th key={j} scope="row">
                      {cell}
                    </th>
                  ) : (
                    <td key={j}>{typeof cell === "number" ? formatNumber(cell) : cell}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

type SeriesPoint = { label: string; visits: number; pageViews: number };

/** Visits (solid bars) inside page views (hollow bars) over time. */
export function SeriesChart({ points, title }: { points: SeriesPoint[]; title: string }) {
  const width = 720;
  const height = 240;
  const pad = { top: 12, right: 8, bottom: 30, left: 40 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = niceMax(Math.max(1, ...points.map((p) => p.pageViews)));
  const slot = innerW / Math.max(1, points.length);
  const barW = Math.max(2, Math.min(40, slot * 0.7));
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;
  const ticks = [0, max / 2, max];
  // Show at most ~8 x labels so they never overlap.
  const labelEvery = Math.max(1, Math.ceil(points.length / 8));
  const totalVisits = points.reduce((n, p) => n + p.visits, 0);
  const totalViews = points.reduce((n, p) => n + p.pageViews, 0);

  return (
    <figure className={styles.figure}>
      <div className={styles.legend} aria-hidden="true">
        <span>
          <svg width="14" height="14"><rect x="1" y="1" width="12" height="12" rx="2" className={styles.hollow} /></svg>
          Page views
        </span>
        <span>
          <svg width="14" height="14"><rect x="1" y="1" width="12" height="12" rx="2" className={styles.solid} /></svg>
          Visits
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={styles.chart}
        role="img"
        aria-label={`${title}: ${plural(totalVisits, "visit")} and ${plural(totalViews, "page view")} across ${points.length} periods.`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} className={styles.grid} />
            <text x={pad.left - 8} y={y(t)} className={styles.axis} textAnchor="end" dominantBaseline="middle">
              {formatNumber(Math.round(t))}
            </text>
          </g>
        ))}
        {points.map((p, i) => {
          const x = pad.left + i * slot + (slot - barW) / 2;
          return (
            <g key={p.label}>
              <title>{`${p.label}: ${plural(p.visits, "visit")}, ${plural(p.pageViews, "page view")}`}</title>
              {/* invisible full-height target, so small bars are easy to hover */}
              <rect x={pad.left + i * slot} y={pad.top} width={slot} height={innerH} fill="transparent" />
              {p.pageViews > 0 && <rect x={x} y={y(p.pageViews)} width={barW} height={pad.top + innerH - y(p.pageViews)} rx="2" className={`${styles.hollow} ${styles.grow}`} style={stagger(i, points.length)} />}
              {p.visits > 0 && <rect x={x + barW * 0.2} y={y(p.visits)} width={barW * 0.6} height={pad.top + innerH - y(p.visits)} rx="2" className={`${styles.solid} ${styles.grow}`} style={stagger(i, points.length)} />}
              {i % labelEvery === 0 && (
                <text x={x + barW / 2} y={height - 10} className={styles.axis} textAnchor="middle">
                  {p.label.replace("Week of ", "")}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <NumbersTable caption={title} columns={["Period", "Visits", "Page views"]} rows={points.map((p) => [p.label, p.visits, p.pageViews])} />
    </figure>
  );
}

/** One series of labelled bars, e.g. views per hour or per weekday. */
export function ColumnChart({
  values,
  labels,
  title,
  unit,
  categoryLabel,
  labelEvery = 1,
}: {
  values: number[];
  labels: string[];
  title: string;
  /** Singular unit for the numbers, e.g. "page view". */
  unit: string;
  /** Heading of the first table column, e.g. "Hour" or "Weekday". */
  categoryLabel: string;
  labelEvery?: number;
}) {
  const width = 480;
  const height = 200;
  const pad = { top: 12, right: 4, bottom: 28, left: 34 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = niceMax(Math.max(1, ...values));
  const slot = innerW / values.length;
  const barW = slot * 0.66;
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;
  const busiest = values.indexOf(Math.max(...values));
  const summary = values.some((v) => v > 0) ? `busiest: ${labels[busiest]} with ${plural(values[busiest], unit)}` : "no data yet";

  return (
    <figure className={styles.figure}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.chart} role="img" aria-label={`${title}, ${summary}.`}>
        {[0, max / 2, max].map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} className={styles.grid} />
            <text x={pad.left - 6} y={y(t)} className={styles.axis} textAnchor="end" dominantBaseline="middle">
              {formatNumber(Math.round(t))}
            </text>
          </g>
        ))}
        {values.map((v, i) => {
          const x = pad.left + i * slot + (slot - barW) / 2;
          return (
            <g key={labels[i]}>
              <title>{`${labels[i]}: ${plural(v, unit)}`}</title>
              <rect x={pad.left + i * slot} y={pad.top} width={slot} height={innerH} fill="transparent" />
              {v > 0 && <rect x={x} y={y(v)} width={barW} height={pad.top + innerH - y(v)} rx="2" className={`${styles.solid} ${styles.grow}`} style={stagger(i, values.length)} />}
              {i % labelEvery === 0 && (
                <text x={x + barW / 2} y={height - 9} className={styles.axis} textAnchor="middle">
                  {labels[i]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <NumbersTable caption={title} columns={[categoryLabel, `${unit[0].toUpperCase()}${unit.slice(1)}s`]} rows={values.map((v, i) => [labels[i], v])} />
    </figure>
  );
}

/** A ranked list with the number as text and a small bar beside it. */
export function RankedList({ items, emptyText, label }: { items: { key: string; label: string; count: number }[]; emptyText: string; label: string }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  if (items.every((i) => i.count === 0)) return <p className={styles.muted}>{emptyText}</p>;
  return (
    <ol className={styles.ranked} aria-label={label}>
      {items.map((item, i) => (
        <li key={item.key}>
          <span className={styles.rankedLabel}>{item.label}</span>
          <span className={styles.rankedCount}>{formatNumber(item.count)}</span>
          <span className={styles.bar} aria-hidden="true">
            <span style={{ width: `${(item.count / max) * 100}%`, ...stagger(i, items.length) }} />
          </span>
        </li>
      ))}
    </ol>
  );
}
