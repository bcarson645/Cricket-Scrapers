"use client";

import { useMemo, useState } from "react";
import type { SeriesOption } from "@/lib/scrapers/dateRangeFilter";
import { defaultYearToDateRange } from "@/lib/scrapers/dateRangeFilter";
import type { SiteMatchSummary } from "@/lib/scrapers/types";
import { DateRangeFieldset } from "@/app/components/cch/DateRangeFieldset";
import { SeriesCheckboxList } from "@/app/components/cch/SeriesCheckboxList";
import { MatchExportTable } from "@/app/components/MatchExportTable";

type MatchWithSeries = SiteMatchSummary & { seriesId: number };

type DiscoverResponse = {
  from: string;
  to: string;
  series: SeriesOption[];
  matches: MatchWithSeries[];
  totalInRange: number;
  daysQueried?: number;
};

type Props = {
  siteLabel: string;
  apiPath: string;
  idPrefix: string;
  intro: string;
  loadButtonLabel?: string;
  scorecardOnly?: boolean;
  onScorecardOnlyChange?: (v: boolean) => void;
  scorecardOnlyLabel?: string;
  matchIdColumnLabel: string;
  onScrapeCsv: (matchIds: string[]) => Promise<void>;
  initialRange?: { from: string; to: string };
};

export function SiteDateRangeDiscover({
  siteLabel,
  apiPath,
  idPrefix,
  intro,
  loadButtonLabel = "Load matches in range",
  scorecardOnly,
  onScorecardOnlyChange,
  scorecardOnlyLabel = "Matches with scorecard only",
  matchIdColumnLabel,
  onScrapeCsv,
  initialRange = defaultYearToDateRange(),
}: Props) {
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DiscoverResponse | null>(null);
  const [selectedSeriesIds, setSelectedSeriesIds] = useState<Set<number>>(new Set());

  async function onLoad() {
    setBusy(true);
    setMessage(null);
    setError(null);
    setData(null);
    setSelectedSeriesIds(new Set());
    try {
      const params = new URLSearchParams({ from, to });
      if (scorecardOnly === false) params.set("scorecardOnly", "0");
      const res = await fetch(`${apiPath}?${params}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Load failed");
      const ok = body as DiscoverResponse;
      setData(ok);
      setSelectedSeriesIds(new Set(ok.series.map((s) => s.seriesId)));
      setMessage(
        `${ok.totalInRange} ${siteLabel} match(es) in range across ${ok.series.length} series${
          ok.daysQueried != null ? ` (${ok.daysQueried} day(s) queried on results page)` : ""
        }.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setBusy(false);
    }
  }

  const visibleMatches = useMemo(() => {
    if (!data || selectedSeriesIds.size === 0) return [];
    return data.matches.filter((m) => selectedSeriesIds.has(m.seriesId));
  }, [data, selectedSeriesIds]);

  function toggleSeries(id: number) {
    setSelectedSeriesIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllSeries(all: boolean) {
    if (!data) return;
    setSelectedSeriesIds(all ? new Set(data.series.map((s) => s.seriesId)) : new Set());
  }

  return (
    <div className="cch-tool-layout">
      <aside className="card cch-query-panel">
        <h2>Query — fixtures by date</h2>
        <p className="hint cch-query-intro">{intro}</p>
        <DateRangeFieldset
          idPrefix={idPrefix}
          from={from}
          to={to}
          onFromChange={setFrom}
          onToChange={setTo}
          busy={busy}
        />
        {onScorecardOnlyChange && (
          <label className="category-check" style={{ marginBottom: "0.75rem" }}>
            <input
              type="checkbox"
              checked={scorecardOnly ?? true}
              onChange={(e) => onScorecardOnlyChange(e.target.checked)}
              disabled={busy}
            />
            {scorecardOnlyLabel}
          </label>
        )}
        <div className="btn-row" style={{ marginTop: 0 }}>
          <button type="button" className="primary" disabled={busy} onClick={onLoad}>
            {busy ? "Loading…" : loadButtonLabel}
          </button>
        </div>
        {error && <p className="hint error">{error}</p>}
      </aside>

      <div className="cch-results-panel">
        {message && !error && <p className="hint cch-status-line">{message}</p>}

        {data && (
          <SeriesCheckboxList
            series={data.series}
            selectedIds={selectedSeriesIds}
            onToggle={toggleSeries}
            onSelectAll={selectAllSeries}
          />
        )}

        {data && selectedSeriesIds.size === 0 && (
          <section className="card cch-empty-hint">
            <p className="hint" style={{ margin: 0 }}>
              Select at least one series to see matches.
            </p>
          </section>
        )}

        {visibleMatches.length > 0 && (
          <MatchExportTable
            matches={visibleMatches}
            busy={busy}
            matchIdColumnLabel={matchIdColumnLabel}
            exportKey="matchId"
            onScrapeCsv={onScrapeCsv}
          />
        )}

        {data && selectedSeriesIds.size > 0 && visibleMatches.length === 0 && (
          <section className="card cch-empty-hint">
            <p className="hint" style={{ margin: 0 }}>
              No matches for the selected series in this date range.
            </p>
          </section>
        )}

        {!data && !busy && (
          <section className="card cch-empty-hint">
            <p className="hint" style={{ margin: 0 }}>
              Set a date range and load matches, then pick series and games to export.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
