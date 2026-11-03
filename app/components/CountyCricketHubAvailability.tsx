"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  AvailabilityNewsItem,
  AvailabilityTimeframe,
  GroupedAvailabilityNews,
} from "@/lib/scrapers/sites/countycrickethub/availabilityTypes";
import {
  AVAILABILITY_CATEGORIES,
  categoryFilterLabel,
  type AvailabilityCategory,
} from "@/lib/scrapers/sites/countycrickethub/categories";
import { countyNamesForSite } from "@/lib/scrapers/sites/countycrickethub/teams";
import {
  defaultCustomDateRange,
  type TimeframePreset,
} from "@/lib/scrapers/sites/countycrickethub/timeframe";
import {
  paginateSlice,
  PaginationControls,
} from "@/app/components/cch/PaginationControls";

type LoadResult = {
  site: "M" | "F";
  sourceUrl: string;
  timeframe: AvailabilityTimeframe;
  categories: AvailabilityCategory[];
  sections: GroupedAvailabilityNews;
  error?: string;
};

const SECTION_META: {
  key: AvailabilityCategory;
  title: string;
  hint: string;
  checkboxLabel: string;
}[] = [
  {
    key: "injury",
    title: "Injury & availability",
    checkboxLabel: "Injury & availability",
    hint: "Injuries, rehab, rest, international duty, and fit-again updates.",
  },
  {
    key: "transfer",
    title: "Transfers & releases",
    checkboxLabel: "Transfers & releases",
    hint: "Players leaving, released, or moving to another county.",
  },
  {
    key: "retirement",
    title: "Retirements",
    checkboxLabel: "Retirements",
    hint: "Retirements from county or professional cricket.",
  },
];

const TIMEFRAME_OPTIONS: { value: TimeframePreset; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "365d", label: "Last 12 months" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom range…" },
];

function defaultCategorySelection(): Record<AvailabilityCategory, boolean> {
  return { injury: true, transfer: true, retirement: true };
}

function selectedCategories(sel: Record<AvailabilityCategory, boolean>): AvailabilityCategory[] {
  return AVAILABILITY_CATEGORIES.filter((c) => sel[c]);
}

function filterNewsItems(
  items: AvailabilityNewsItem[],
  county: string,
  search: string,
): AvailabilityNewsItem[] {
  const q = search.trim().toLowerCase();
  return items.filter((row) => {
    if (county && row.county !== county) return false;
    if (!q) return true;
    const hay = `${row.playerName} ${row.details} ${row.county}`.toLowerCase();
    return hay.includes(q);
  });
}

function NewsSectionBlock({
  sectionKey,
  title,
  hint,
  allItems,
  resultCounty,
  resultSearch,
  truncated,
  loadedCount,
}: {
  sectionKey: AvailabilityCategory;
  title: string;
  hint: string;
  allItems: AvailabilityNewsItem[];
  resultCounty: string;
  resultSearch: string;
  truncated?: boolean;
  loadedCount?: number;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    setPage(1);
  }, [resultCounty, resultSearch]);

  const filtered = useMemo(
    () => filterNewsItems(allItems, resultCounty, resultSearch),
    [allItems, resultCounty, resultSearch],
  );

  const pageItems = useMemo(
    () => paginateSlice(filtered, page, pageSize),
    [filtered, page, pageSize],
  );

  return (
    <section className="card cch-result-section">
      <div className="cch-result-section-head">
        <div>
          <h2>{title}</h2>
          <p className="hint" style={{ margin: 0 }}>
            {hint} ({filtered.length} after filters
            {filtered.length !== allItems.length ? `, ${allItems.length} loaded` : ""})
            {truncated && loadedCount != null
              ? ` — API returned first ${loadedCount} rows; narrow timeframe for full history.`
              : ""}
          </p>
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="hint">No items in this section for the selected filters.</p>
      ) : (
        <>
          <PaginationControls
            idPrefix={`cch-news-${sectionKey}`}
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
          <div className="news-table-wrap">
            <table className="news-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>County</th>
                  <th>Player</th>
                  <th>Details</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((row, i) => (
                  <tr key={`${row.date}-${row.playerName}-${row.county}-${i}`}>
                    <td>{row.dateDisplay || "—"}</td>
                    <td>{row.county}</td>
                    <td>{row.playerName}</td>
                    <td>{row.details}</td>
                    <td>
                      {row.link ? (
                        <a href={row.link} target="_blank" rel="noreferrer">
                          Link
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

export function CountyCricketHubAvailability() {
  const initialRange = defaultCustomDateRange();

  const [site, setSite] = useState<"M" | "F">("M");
  const [preset, setPreset] = useState<TimeframePreset>("30d");
  const [customFrom, setCustomFrom] = useState(initialRange.from);
  const [customTo, setCustomTo] = useState(initialRange.to);
  const [categorySel, setCategorySel] = useState(defaultCategorySelection);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [data, setData] = useState<LoadResult | null>(null);

  const [resultCounty, setResultCounty] = useState("");
  const [resultSearch, setResultSearch] = useState("");

  const countyOptions = useMemo(() => countyNamesForSite(site), [site]);

  function toggleCategory(key: AvailabilityCategory) {
    setCategorySel((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function selectAllCategories(all: boolean) {
    setCategorySel({ injury: all, transfer: all, retirement: all });
  }

  async function onLoadNews() {
    const categories = selectedCategories(categorySel);
    if (categories.length === 0) {
      setMessage("Select at least one news category.");
      setData(null);
      return;
    }

    setBusy(true);
    setMessage(null);
    setResultCounty("");
    setResultSearch("");
    try {
      const params = new URLSearchParams({ site, preset });
      if (preset === "custom") {
        params.set("from", customFrom);
        params.set("to", customTo);
      }
      if (categories.length === AVAILABILITY_CATEGORIES.length) {
        params.set("categories", "all");
      } else {
        params.set("categories", categories.join(","));
      }
      const res = await fetch(`/api/countycrickethub/availability-news?${params}`);
      const text = await res.text();
      let body: LoadResult & { error?: string };
      try {
        body = JSON.parse(text) as typeof body;
      } catch {
        throw new Error(res.ok ? "Invalid response" : text.slice(0, 120) || `HTTP ${res.status}`);
      }
      if (!res.ok) throw new Error(body.error ?? `Load failed (${res.status})`);
      setData(body);
      const total = body.categories.reduce((n, key) => n + body.sections[key].total, 0);
      setMessage(
        `${total} update(s) loaded — ${body.timeframe.label}, ${categoryFilterLabel(body.categories)} (${site === "M" ? "men's" : "women's"}). Use result filters and pagination per section below.`,
      );
    } catch (e) {
      setData(null);
      setMessage(e instanceof Error ? e.message : "Load failed");
    } finally {
      setBusy(false);
    }
  }

  const allCategoriesSelected = AVAILABILITY_CATEGORIES.every((c) => categorySel[c]);

  return (
    <div className="cch-tool-layout">
      <aside className="card cch-query-panel">
        <h2>Query — availability news</h2>
        <p className="hint cch-query-intro">
          Same feed as{" "}
          <a href="https://countycrickethub.net/news-injury.html?site=M" target="_blank" rel="noreferrer">
            CCH injury / availability
          </a>
          . Set competition, categories, and timeframe, then load.
        </p>
        <label htmlFor="cch-site">Competition</label>
        <select
          id="cch-site"
          className="input-wide"
          value={site}
          onChange={(e) => setSite(e.target.value as "M" | "F")}
          disabled={busy}
        >
          <option value="M">Men&apos;s county cricket</option>
          <option value="F">Women&apos;s county cricket</option>
        </select>
        <fieldset className="category-fieldset">
          <legend>News categories</legend>
          <div className="category-checkboxes">
            {SECTION_META.map(({ key, checkboxLabel }) => (
              <label key={key} className="category-check">
                <input
                  type="checkbox"
                  checked={categorySel[key]}
                  onChange={() => toggleCategory(key)}
                  disabled={busy}
                />
                {checkboxLabel}
              </label>
            ))}
          </div>
          <div className="btn-row" style={{ marginTop: "0.5rem" }}>
            <button
              type="button"
              className="secondary"
              disabled={busy || allCategoriesSelected}
              onClick={() => selectAllCategories(true)}
            >
              Select all
            </button>
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => selectAllCategories(false)}
            >
              Clear all
            </button>
          </div>
        </fieldset>
        <label htmlFor="cch-timeframe">Timeframe</label>
        <select
          id="cch-timeframe"
          className="input-wide"
          value={preset}
          onChange={(e) => setPreset(e.target.value as TimeframePreset)}
          disabled={busy}
        >
          {TIMEFRAME_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {preset === "custom" && (
          <div className="date-range-row">
            <div>
              <label htmlFor="cch-from">From</label>
              <input
                id="cch-from"
                className="input-wide"
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                disabled={busy}
              />
            </div>
            <div>
              <label htmlFor="cch-to">To</label>
              <input
                id="cch-to"
                className="input-wide"
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                disabled={busy}
              />
            </div>
          </div>
        )}
        <div className="btn-row">
          <button type="button" className="primary" disabled={busy} onClick={onLoadNews}>
            {busy ? "Loading…" : "Load availability news"}
          </button>
        </div>
      </aside>

      <div className="cch-results-panel">
        {message && <p className="hint cch-status-line">{message}</p>}

        {data && (
          <section className="card cch-result-filters">
            <h2>Result filters</h2>
            <p className="hint" style={{ marginTop: 0 }}>
              Applied to each news section separately. Pagination resets when you change filters.
            </p>
            <div className="cch-filter-grid">
              <div>
                <label htmlFor="cch-news-county">County</label>
                <select
                  id="cch-news-county"
                  className="input-wide"
                  value={resultCounty}
                  onChange={(e) => setResultCounty(e.target.value)}
                >
                  <option value="">All counties</option>
                  {countyOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="cch-filter-span2">
                <label htmlFor="cch-news-search">Search</label>
                <input
                  id="cch-news-search"
                  className="input-wide"
                  type="search"
                  placeholder="Player, county, or details…"
                  value={resultSearch}
                  onChange={(e) => setResultSearch(e.target.value)}
                />
              </div>
            </div>
          </section>
        )}

        {data &&
          SECTION_META.filter(({ key }) => data.categories.includes(key)).map(
            ({ key, title, hint }) => {
              const section = data.sections[key];
              return (
                <NewsSectionBlock
                  key={`${key}-${data.site}-${data.timeframe.label}-${resultCounty}-${resultSearch}`}
                  sectionKey={key}
                  title={title}
                  hint={hint}
                  allItems={section.items}
                  resultCounty={resultCounty}
                  resultSearch={resultSearch}
                  truncated={section.total > section.items.length}
                  loadedCount={section.items.length}
                />
              );
            },
          )}

        {!data && !message && (
          <section className="card cch-empty-hint">
            <p className="hint" style={{ margin: 0 }}>
              Run a query on the left to see injury, transfer, and retirement sections here.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
