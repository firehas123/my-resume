"use client";

import { useMemo, useState } from "react";
import type { WorldMap } from "@/lib/stats/worldMap";
import { NumbersTable } from "./charts";
import { useStatsFormat } from "./format";
import styles from "./Stats.module.css";

type CountryCount = { code: string; visits: number; pageViews: number };

// Four shading steps. The legend prints the number range of each step, so
// the map never relies on colour alone, and the table lists exact numbers.
const STEPS = [0.28, 0.5, 0.74, 1];

function stepsFor(max: number): number[] {
  // Upper bound of each step: an even split of 1..max, deduplicated.
  return [...new Set(STEPS.map((s) => Math.max(1, Math.ceil(max * s))))];
}

export function WorldMapChart({ map, countries }: { map: WorldMap; countries: CountryCount[] }) {
  const { t, countryName, formatNumber, visits: visitWords, pageViews: viewWords, countries: countryWords } = useStatsFormat();
  const [selected, setSelected] = useState<string | null>(null);
  const byCode = useMemo(() => new Map(countries.map((c) => [c.code, c])), [countries]);
  const max = Math.max(0, ...countries.filter((c) => c.code !== "XX").map((c) => c.visits));
  const bounds = stepsFor(max);
  const stepOf = (visits: number) => (visits <= 0 ? -1 : bounds.findIndex((b) => visits <= b));
  const info = selected ? byCode.get(selected) : undefined;
  const legend = bounds.map((upper, i) => ({ from: i === 0 ? 1 : bounds[i - 1] + 1, to: upper, step: i }));

  return (
    <figure className={styles.figure}>
      <svg
        viewBox={`0 0 ${map.width} ${map.height}`}
        className={styles.map}
        // A map is not mirrored in right-to-left languages.
        direction="ltr"
        role="group"
        aria-label={t("mapLabel", { countries: countryWords(countries.filter((c) => c.code !== "XX").length) })}
        onPointerLeave={() => setSelected(null)}
      >
        {map.shapes.map((shape, i) => {
          const data = shape.code ? byCode.get(shape.code) : undefined;
          const visits = data?.visits ?? 0;
          const step = stepOf(visits);
          const name = shape.code ? countryName(shape.code) : t("noData");
          const interactive = visits > 0 && shape.code;
          return (
            <path
              key={`${shape.code ?? "none"}-${i}`}
              d={shape.d}
              className={styles.country}
              data-step={step}
              style={step >= 0 ? ({ "--delay": `${step * 90}ms` } as React.CSSProperties) : undefined}
              data-active={(selected !== null && selected === shape.code) || undefined}
              tabIndex={interactive ? 0 : undefined}
              role={interactive ? "img" : undefined}
              aria-label={interactive ? `${name}: ${visitWords(visits)}` : undefined}
              onPointerEnter={() => shape.code && setSelected(shape.code)}
              onClick={() => shape.code && setSelected(shape.code)}
              onFocus={() => shape.code && setSelected(shape.code)}
            >
              <title>{`${name}: ${visitWords(visits)}`}</title>
            </path>
          );
        })}
      </svg>

      {/* What the cursor, a tap or keyboard focus is on; announced politely. */}
      <p className={styles.mapCaption} aria-live="polite">
        {selected ? (
          <>
            <strong>{countryName(selected)}</strong>: {visitWords(info?.visits ?? 0)}, {viewWords(info?.pageViews ?? 0)}
          </>
        ) : (
          t("mapHint")
        )}
      </p>

      {max > 0 && (
        <ul className={styles.mapLegend} aria-label={t("mapLegend")}>
          {legend.map((l) => (
            <li key={l.step}>
              <span className={styles.swatch} data-step={l.step} aria-hidden="true" />
              {l.from === l.to ? formatNumber(l.to) : `${formatNumber(l.from)}–${formatNumber(l.to)}`}
            </li>
          ))}
          <li>
            <span className={styles.swatch} data-step={-1} aria-hidden="true" />
            {t("mapNone")}
          </li>
        </ul>
      )}

      <NumbersTable
        caption={t("mapTable")}
        columns={[t("country"), t("visits"), t("pageViews")]}
        rows={countries.map((c) => [countryName(c.code), c.visits, c.pageViews])}
      />
    </figure>
  );
}
