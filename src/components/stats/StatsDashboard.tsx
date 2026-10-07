"use client";

import { useEffect, useRef, useState } from "react";
import { DURATION } from "@/lib/motion";
import { EXCLUDE_ME_KEY } from "@/components/analytics/VisitTracker";
import type { Range, StatsSummary } from "@/lib/stats/summary";
import type { WorldMap } from "@/lib/stats/worldMap";
import { languageInfo } from "@/i18n/config";
import { ColumnChart, RankedList, SeriesChart } from "./charts";
import { useStatsFormat, type StatsFormat } from "./format";
import { WorldMapChart } from "./WorldMapChart";
import styles from "./Stats.module.css";

const RANGE_OPTIONS: Range[] = ["today", "7d", "30d", "90d", "12m", "all"];
const REFRESH_MS = 60_000;
const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
const FIXED_PAGES = ["/", "/contact", "/impressum", "/datenschutz"];

type State =
  | { status: "loading" }
  | { status: "not-connected" }
  | { status: "error" }
  | { status: "ready"; data: StatsSummary; loadedAt: number };

/** Fetches the summary for a range. Returns null when the request was aborted. */
async function fetchSummary(range: Range, signal: AbortSignal): Promise<State | null> {
  try {
    const response = await fetch(`/api/stats?range=${range}`, { cache: "no-store", signal });
    const json = await response.json();
    if (json.connected === false) return { status: "not-connected" };
    if (!response.ok || json.error) return { status: "error" };
    return { status: "ready", data: json as StatsSummary, loadedAt: Date.now() };
  } catch (error) {
    return (error as Error).name === "AbortError" ? null : { status: "error" };
  }
}

/** Handles /stats?exclude-me=1 / =0 and reports whether this browser is excluded. */
function useExcludeMe(): boolean | null {
  const [excluded, setExcluded] = useState<boolean | null>(null);
  useEffect(() => {
    // Reading the address and storage only works in the browser, after the
    // first render, so the state is set from here on purpose.
    const param = new URLSearchParams(window.location.search).get("exclude-me");
    let value = false;
    try {
      if (param === "1") localStorage.setItem(EXCLUDE_ME_KEY, "1");
      if (param === "0") localStorage.removeItem(EXCLUDE_ME_KEY);
      value = localStorage.getItem(EXCLUDE_ME_KEY) === "1";
    } catch {
      value = false;
    }
    setExcluded(value); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);
  return excluded;
}

/** `languages`: the site's language codes, for the language panels. */
export function StatsDashboard({ map, languages }: { map: WorldMap; languages: string[] }) {
  const f = useStatsFormat();
  const { t } = f;
  const [range, setRange] = useState<Range>("30d");
  const [state, setState] = useState<State>({ status: "loading" });
  const excluded = useExcludeMe();

  // Load on range change, then refresh every 60 s while the tab is visible.
  useEffect(() => {
    const controller = new AbortController();
    const refresh = () =>
      fetchSummary(range, controller.signal).then((next) => {
        if (next) setState(next);
      });
    refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, REFRESH_MS);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [range]);

  const data = state.status === "ready" ? state.data : null;

  return (
    <div className={styles.page}>
      <header className={`container ${styles.header}`}>
        <div className={styles.titleBlock}>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className={styles.title}>{t("title")}</h1>
          <p className={styles.since}>{data?.since ? t("since", { date: f.formatDay(data.since) }) : t("intro")}</p>
        </div>
        <div className={styles.ranges} role="group" aria-label={t("rangeLabel")}>
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={styles.range}
              aria-pressed={range === option}
              onClick={() => {
                setState({ status: "loading" });
                setRange(option);
              }}
            >
              {t(`ranges.${option}`)}
            </button>
          ))}
        </div>
      </header>

      <div className={`container ${styles.body}`}>
        {state.status === "loading" && (
          <p className={styles.status} role="status">
            {t("loading")}
          </p>
        )}

        {state.status === "not-connected" && (
          <div className={styles.notice} role="status">
            <h2>{t("notConnectedTitle")}</h2>
            <p>{t("notConnectedText")}</p>
          </div>
        )}

        {state.status === "error" && (
          <div className={styles.notice} role="alert">
            <h2>{t("errorTitle")}</h2>
            <p>{t("errorText")}</p>
          </div>
        )}

        {data && data.allTime.pageViews === 0 && (
          <div className={styles.notice} role="status">
            <h2>{t("noVisitsTitle")}</h2>
            <p>{t("noVisitsText")}</p>
          </div>
        )}

        {data && data.allTime.pageViews > 0 && <Dashboard data={data} map={map} languages={languages} f={f} />}

        <footer className={styles.tools}>
          {/* Downloads only make sense once the database is connected. */}
          {data && (
            <div className={styles.downloads}>
              <a className={styles.toolButton} href="/api/stats/export?format=json" download>
                {t("downloadJson")}
              </a>
              <a className={styles.toolButton} href="/api/stats/export?format=csv" download>
                {t("downloadCsv")}
              </a>
            </div>
          )}
          <p className={styles.muted}>
            {t("updatesEveryMinute")} {excluded === true && t("excluded")}
            {excluded === false && t("included")}
          </p>
        </footer>
      </div>
    </div>
  );
}

function Dashboard({ data, map, languages, f }: { data: StatsSummary; map: WorldMap; languages: string[]; f: StatsFormat }) {
  const { t } = f;
  const rangeEmpty = data.totals.pageViews === 0;
  const topCountries = data.countries.slice(0, 10).map((c) => ({ key: c.code, label: f.countryName(c.code), count: c.visits }));
  // Words for what was counted, in the page's language.
  const pageName = (key: string, title: string) =>
    FIXED_PAGES.includes(key) ? t(`pages.${key}`) : key.startsWith("/projects/") ? t("pages.project", { title }) : key;
  const languageName = (code: string) => (languages.includes(code) ? languageInfo(code).name : code);
  const relabel = (items: { key: string; label: string; count: number }[], name: (key: string, label: string) => string) =>
    items.map((item) => ({ ...item, label: name(item.key, item.label) }));
  const seriesTitle = t("series", { grouping: data.grouping });
  const points = data.series.map((b) => ({
    key: b.start,
    label: f.bucketLabel(b.start, data.grouping),
    axis: f.axisLabel(b.start, data.grouping),
    visits: b.visits,
    pageViews: b.pageViews,
  }));

  return (
    <>
      <section aria-label={t("headline")} className={styles.headline}>
        <Stat label={t("visits")} count={data.totals.visits} />
        <Stat label={t("pageViews")} count={data.totals.pageViews} />
        <Stat label={t("countriesReached")} count={data.totals.countries} />
        <Stat label={t("allTimeVisits")} count={data.allTime.visits} />
        <Stat label={t("lastViewed")} value={data.lastViewed ? f.timeAgo(data.lastViewed) : "—"} text />
      </section>

      {rangeEmpty ? (
        <div className={styles.notice} role="status">
          <h2>{t("emptyRangeTitle")}</h2>
          <p>{t("emptyRangeText")}</p>
        </div>
      ) : (
        <>
          <div className={styles.mapRow}>
            <Panel title={t("whereFrom")} wide>
              <WorldMapChart map={map} countries={data.countries} />
            </Panel>
            <Panel title={t("topCountries")}>
              <RankedList items={topCountries} label={t("topCountriesLabel")} emptyText={t("noCountries")} />
            </Panel>
          </div>

          <Panel title={seriesTitle}>
            <SeriesChart points={points} title={seriesTitle} />
          </Panel>

          <div className={styles.twoUp}>
            <Panel title={t("byHour")}>
              <ColumnChart
                values={data.hours}
                labels={HOURS}
                title={t("byHourTitle")}
                count={f.pageViews}
                valueLabel={t("pageViews")}
                categoryLabel={t("hour")}
                labelEvery={3}
              />
            </Panel>
            <Panel title={t("byWeekday")}>
              <ColumnChart
                values={data.weekdays}
                labels={f.weekdays}
                title={t("byWeekdayTitle")}
                count={f.pageViews}
                valueLabel={t("pageViews")}
                categoryLabel={t("weekday")}
              />
            </Panel>
          </div>

          <div className={styles.panels}>
            <Panel title={t("topPages")}>
              <RankedList items={relabel(data.pages.slice(0, 8), pageName)} label={t("topPagesLabel")} emptyText={t("noPageViews")} />
            </Panel>
            <Panel title={t("siteLanguages")}>
              <RankedList items={relabel(data.languages, languageName)} label={t("siteLanguagesLabel")} emptyText={t("noPageViews")} />
            </Panel>
            <Panel title={t("topReferrers")}>
              <RankedList
                items={relabel(data.referrers.slice(0, 8), (key) => (key === "direct" || key === "other" ? t(`referrers.${key}`) : key))}
                label={t("topReferrersLabel")}
                emptyText={t("noVisits")}
              />
            </Panel>
            <Panel title={t("devices")}>
              <RankedList items={relabel(data.devices, (key) => t(`deviceNames.${key}`))} label={t("devicesLabel")} emptyText={t("noVisits")} />
            </Panel>
            <Panel title={t("themes")}>
              <RankedList items={relabel(data.themes, (key) => t(`themeNames.${key}`))} label={t("themesLabel")} emptyText={t("noVisits")} />
            </Panel>
            <Panel title={t("events")}>
              <RankedList items={relabel(data.events, (key) => t(`eventNames.${key}`))} label={t("events")} emptyText={t("noEvents")} />
            </Panel>
            <Panel title={t("cvByLanguage")}>
              <RankedList items={relabel(data.cvLanguages, languageName)} label={t("cvByLanguageLabel")} emptyText={t("noDownloads")} />
            </Panel>
          </div>
        </>
      )}

      <Panel title={t("recent")}>
        {data.recent.length === 0 ? (
          <p className={styles.muted}>{t("noViews")}</p>
        ) : (
          <ol className={styles.recent}>
            {data.recent.map((r, i) => (
              <li key={`${r.time}-${i}`}>
                <span className={styles.recentWhere}>{f.countryName(r.country)}</span>
                <span>{pageName(r.path, r.label)}</span>
                <time dateTime={r.time} className={styles.muted}>
                  {f.timeAgo(r.time)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </>
  );
}

/**
 * A headline number. `count` counts up from zero when the panel first
 * appears (later refreshes just show the new value); `value` is shown as is,
 * in a smaller size, for words like "3 minutes ago".
 */
function Stat({ label, count, value, text }: { label: string; count?: number; value?: string; text?: boolean }) {
  return (
    <div className={styles.stat}>
      <p className={styles.statLabel}>{label}</p>
      <p className={`${styles.statValue} ${text ? styles.statText : ""}`}>{count !== undefined ? <CountUp value={count} /> : value}</p>
    </div>
  );
}

/** Counts from 0 to `value` once, on mount, with the shared slow ease-out. */
function CountUp({ value }: { value: number }) {
  const { formatNumber } = useStatsFormat();
  const ref = useRef<HTMLSpanElement>(null);
  const played = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || played.current) return;
    played.current = true;
    if (value === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const duration = DURATION.slow * 1000;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = formatNumber(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      el.textContent = formatNumber(value);
    };
  }, [value, formatNumber]);

  // The real number is in the HTML; the effect only animates the text.
  return <span ref={ref}>{formatNumber(value)}</span>;
}

function Panel({ title, children, wide }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <section className={`${styles.panel} ${wide ? styles.panelWide : ""}`} aria-label={title}>
      <h2 className={styles.panelTitle}>{title}</h2>
      {children}
    </section>
  );
}
