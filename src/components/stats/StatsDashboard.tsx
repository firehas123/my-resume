"use client";

import { useEffect, useState } from "react";
import { EXCLUDE_ME_KEY } from "@/components/analytics/VisitTracker";
import type { Range, StatsSummary } from "@/lib/stats/summary";
import type { WorldMap } from "@/lib/stats/worldMap";
import { ColumnChart, RankedList, SeriesChart } from "./charts";
import { countryName, formatDay, formatNumber, timeAgo } from "./format";
import { WorldMapChart } from "./WorldMapChart";
import styles from "./Stats.module.css";

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "12m", label: "12 months" },
  { value: "all", label: "All time" },
];
const REFRESH_MS = 60_000;
const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

export function StatsDashboard({ map }: { map: WorldMap }) {
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
          <p className="eyebrow">Site stats</p>
          <h1 className={styles.title}>Who visits.</h1>
          <p className={styles.since}>
            {data?.since ? <>Counting since {formatDay(data.since)}</> : "Visits counted by this site itself, without cookies."}
          </p>
        </div>
        <div className={styles.ranges} role="group" aria-label="Time range">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={styles.range}
              aria-pressed={range === option.value}
              onClick={() => {
                setState({ status: "loading" });
                setRange(option.value);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <div className={`container ${styles.body}`}>
        {state.status === "loading" && <p className={styles.status} role="status">Loading the latest numbers…</p>}

        {state.status === "not-connected" && (
          <div className={styles.notice} role="status">
            <h2>Statistics are not connected yet.</h2>
            <p>The visit counter needs its database. Once it is connected and the site is redeployed, visits are counted from that moment on.</p>
          </div>
        )}

        {state.status === "error" && (
          <div className={styles.notice} role="alert">
            <h2>The statistics could not be loaded right now.</h2>
            <p>They refresh automatically every minute, or reload the page to try again.</p>
          </div>
        )}

        {data && data.allTime.pageViews === 0 && (
          <div className={styles.notice} role="status">
            <h2>No visits recorded yet.</h2>
            <p>Counting starts with the first visit to the live site. Check back soon.</p>
          </div>
        )}

        {data && data.allTime.pageViews > 0 && <Dashboard data={data} map={map} />}

        <footer className={styles.tools}>
          {/* Downloads only make sense once the database is connected. */}
          {data && (
            <div className={styles.downloads}>
              <a className={styles.toolButton} href="/api/stats/export?format=json" download>
                Download data (JSON)
              </a>
              <a className={styles.toolButton} href="/api/stats/export?format=csv" download>
                Download data (CSV)
              </a>
            </div>
          )}
          <p className={styles.muted}>
            Updates every minute.{" "}
            {excluded === true && "Your own visits from this browser are not counted."}
            {excluded === false && "Visits from this browser are counted (open /stats?exclude-me=1 to stop that)."}
          </p>
        </footer>
      </div>
    </div>
  );
}

function Dashboard({ data, map }: { data: StatsSummary; map: WorldMap }) {
  const rangeEmpty = data.totals.pageViews === 0;
  const topCountries = data.countries.slice(0, 10).map((c) => ({ key: c.code, label: countryName(c.code), count: c.visits }));

  return (
    <>
      <section aria-label="Headline numbers" className={styles.headline}>
        <Stat label="Visits" value={formatNumber(data.totals.visits)} />
        <Stat label="Page views" value={formatNumber(data.totals.pageViews)} />
        <Stat label="Countries reached" value={formatNumber(data.totals.countries)} />
        <Stat label="All-time visits" value={formatNumber(data.allTime.visits)} />
        <Stat label="Last viewed" value={data.lastViewed ? timeAgo(data.lastViewed) : "—"} text />
      </section>

      {rangeEmpty ? (
        <div className={styles.notice} role="status">
          <h2>No visits recorded in this period yet.</h2>
          <p>Pick a longer range to see earlier visits.</p>
        </div>
      ) : (
        <>
          <div className={styles.mapRow}>
            <Panel title="Where visitors come from" wide>
              <WorldMapChart map={map} countries={data.countries} />
            </Panel>
            <Panel title="Top countries">
              <RankedList items={topCountries} label="Top ten countries by visits" emptyText="No countries yet." />
            </Panel>
          </div>

          <Panel title={`Visits and page views per ${data.grouping}`}>
            <SeriesChart points={data.series} title={`Visits and page views per ${data.grouping}`} />
          </Panel>

          <div className={styles.twoUp}>
            <Panel title="By hour of day (Berlin time)">
              <ColumnChart values={data.hours} labels={HOURS} title="Page views by hour of day" unit="page view" categoryLabel="Hour" labelEvery={3} />
            </Panel>
            <Panel title="By weekday">
              <ColumnChart values={data.weekdays} labels={WEEKDAYS} title="Page views by weekday" unit="page view" categoryLabel="Weekday" />
            </Panel>
          </div>

          <div className={styles.panels}>
            <Panel title="Top pages">
              <RankedList items={data.pages.slice(0, 8)} label="Most viewed pages" emptyText="No page views yet." />
            </Panel>
            <Panel title="Top referrers">
              <RankedList items={data.referrers.slice(0, 8)} label="Sites visitors came from" emptyText="No visits yet." />
            </Panel>
            <Panel title="Devices">
              <RankedList items={data.devices} label="Visits by device type" emptyText="No visits yet." />
            </Panel>
            <Panel title="Dark or light theme">
              <RankedList items={data.themes} label="Visits by colour theme" emptyText="No visits yet." />
            </Panel>
            <Panel title="CV downloads and link clicks">
              <RankedList items={data.events} label="CV downloads and link clicks" emptyText="No downloads or clicks yet." />
            </Panel>
          </div>
        </>
      )}

      <Panel title="Recent views">
        {data.recent.length === 0 ? (
          <p className={styles.muted}>No views yet.</p>
        ) : (
          <ol className={styles.recent}>
            {data.recent.map((r, i) => (
              <li key={`${r.time}-${i}`}>
                <span className={styles.recentWhere}>{countryName(r.country)}</span>
                <span>{r.label}</span>
                <time dateTime={r.time} className={styles.muted}>
                  {timeAgo(r.time)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </>
  );
}

/** A headline number; `text` uses a smaller size for words like "3 minutes ago". */
function Stat({ label, value, text }: { label: string; value: string; text?: boolean }) {
  return (
    <div className={styles.stat}>
      <p className={styles.statLabel}>{label}</p>
      <p className={`${styles.statValue} ${text ? styles.statText : ""}`}>{value}</p>
    </div>
  );
}

function Panel({ title, children, wide }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <section className={`${styles.panel} ${wide ? styles.panelWide : ""}`} aria-label={title}>
      <h2 className={styles.panelTitle}>{title}</h2>
      {children}
    </section>
  );
}
