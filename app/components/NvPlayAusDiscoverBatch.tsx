"use client";

import { useMemo, useState } from "react";
import type {
  NvplayCompetitionOption,
  NvplayMatchWithCompetition,
} from "@/lib/scrapers/sites/nvplay-ecb/discoverMatches";
import { MatchExportTable } from "@/app/components/MatchExportTable";
import { downloadNvplayAusBatchCsv } from "@/app/components/nvplayBatchExport";

function localIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getFullYear(), 0, 1);
  return { from: localIsoDate(from), to: localIsoDate(to) };
}

function parseLocalIsoDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return new Date(y, mo - 1, d);
}

function formatRangeDate(iso: string): string {
  const d = parseLocalIsoDate(iso);
  if (!d) return iso;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function inclusiveDayCount(from: string, to: string): number | null {
  const a = parseLocalIsoDate(from);
  const b = parseLocalIsoDate(to);
  if (!a || !b || a > b) return null;
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000)) + 1;
}

type DiscoverResponse = {
  from: string;
  to: string;
  competitions: NvplayCompetitionOption[];
  matches: NvplayMatchWithCompetition[];
  totalInRange: number;
};

export function NvPlayAusDiscoverBatch() {
  const initial = defaultRange();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [completeOnly, setCompleteOnly] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DiscoverResponse | null>(null);
  const [selectedCompIds, setSelectedCompIds] = useState<Set<number>>(new Set());

  async function onLoadMatches() {
    setBusy(true);
    setMessage(null);
    setError(null);
    setData(null);
    setSelectedCompIds(new Set());
    try {
      const params = new URLSearchParams({ from, to });
      if (!completeOnly) params.set("completeOnly", "0");
      const res = await fetch(`/api/nvplay-aus/matches?${params}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Load failed");
      const ok = body as DiscoverResponse;
      setData(ok);
      setSelectedCompIds(new Set(ok.competitions.map((c) => c.competitionId)));
      setMessage(
        `${ok.totalInRange} match(es) in range — ${ok.competitions.length} competition(s). First load may take up to a minute (full NV Play match list).`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setBusy(false);
    }
  }

  const visibleMatches = useMemo(() => {
    if (!data) return [];
    if (selectedCompIds.size === 0) return [];
    return data.matches.filter(
      (m) => m.competitionId != null && selectedCompIds.has(m.competitionId),
    );
  }, [data, selectedCompIds]);

  function toggleComp(id: number) {
    setSelectedCompIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllComps(all: boolean) {
    if (!data) return;
    setSelectedCompIds(all ? new Set(data.competitions.map((c) => c.competitionId)) : new Set());
  }

  const allCompsSelected =
    data != null &&
    data.competitions.length > 0 &&
    data.competitions.every((c) => selectedCompIds.has(c.competitionId));

  const rangeDays = inclusiveDayCount(from, to);

  function onFromChange(next: string) {
    setFrom(next);
    if (next && to && next > to) setTo(next);
  }

  function onToChange(next: string) {
    setTo(next);
    if (next && from && next < from) setFrom(next);
  }

  return (
    <div className="cch-tool-layout">
      <aside className="card cch-query-panel">
        <h2>Query — fixtures by date</h2>
        <p className="hint cch-query-intro">
          Loads the Cricket Australia NV Play match list, then filters by start date (<code>StartDateTimeUTC</code>
          ). Multi-day games appear on their start day only.
        </p>
        <fieldset className="nv-date-query">
          <legend>Date range</legend>
          <p className="nv-date-range-summary" id="nv-date-summary">
            <span className="nv-date-range-label">Selected</span>
            <span className="nv-date-range-values">
              {formatRangeDate(from)} – {formatRangeDate(to)}
            </span>
            {rangeDays != null && (
              <span className="nv-date-range-days">
                {rangeDays} day{rangeDays === 1 ? "" : "s"}
              </span>
            )}
          </p>
          <div className="nv-date-field">
            <label htmlFor="nv-from">From</label>
            <input
              id="nv-from"
              className="input-wide nv-date-input"
              type="date"
              value={from}
              max={to}
              onChange={(e) => onFromChange(e.target.value)}
              disabled={busy}
              aria-describedby="nv-date-summary"
            />
          </div>
          <div className="nv-date-field">
            <label htmlFor="nv-to">To</label>
            <input
              id="nv-to"
              className="input-wide nv-date-input"
              type="date"
              value={to}
              min={from}
              onChange={(e) => onToChange(e.target.value)}
              disabled={busy}
              aria-describedby="nv-date-summary"
            />
          </div>
        </fieldset>
        <label className="category-check" style={{ marginBottom: "0.75rem" }}>
          <input
            type="checkbox"
            checked={completeOnly}
            onChange={(e) => setCompleteOnly(e.target.checked)}
            disabled={busy}
          />
          Completed matches only
        </label>
        <div className="btn-row" style={{ marginTop: 0 }}>
          <button type="button" className="primary" disabled={busy} onClick={onLoadMatches}>
            {busy ? "Loading match list…" : "Load matches in range"}
          </button>
        </div>
        {error && <p className="hint error">{error}</p>}
      </aside>

      <div className="cch-results-panel">
        {message && !error && <p className="hint cch-status-line">{message}</p>}

        {data && data.competitions.length > 0 && (
          <section className="card cch-result-filters">
            <div className="cch-result-section-head">
              <h2>Competitions</h2>
              <div className="btn-row" style={{ marginTop: 0 }}>
                <button
                  type="button"
                  className="secondary"
                  disabled={allCompsSelected}
                  onClick={() => selectAllComps(true)}
                >
                  Select all
                </button>
                <button type="button" className="secondary" onClick={() => selectAllComps(false)}>
                  Clear all
                </button>
              </div>
            </div>
            <p className="hint" style={{ marginTop: 0 }}>
              Choose one or more competitions, then select matches below for CSV export.
            </p>
            <div className="nv-comp-list">
              {data.competitions.map((c) => (
                <label key={c.competitionId} className="category-check">
                  <input
                    type="checkbox"
                    checked={selectedCompIds.has(c.competitionId)}
                    onChange={() => toggleComp(c.competitionId)}
                  />
                  {c.competitionName}
                  <span className="nv-comp-count">({c.matchCount})</span>
                </label>
              ))}
            </div>
          </section>
        )}

        {data && selectedCompIds.size === 0 && (
          <section className="card cch-empty-hint">
            <p className="hint" style={{ margin: 0 }}>
              Select at least one competition to see matches.
            </p>
          </section>
        )}

        {visibleMatches.length > 0 && (
          <MatchExportTable
            matches={visibleMatches}
            busy={busy}
            matchIdColumnLabel="NV Play MatchId"
            exportKey="url"
            onScrapeCsv={downloadNvplayAusBatchCsv}
          />
        )}

        {data && selectedCompIds.size > 0 && visibleMatches.length === 0 && (
          <section className="card cch-empty-hint">
            <p className="hint" style={{ margin: 0 }}>
              No matches for the selected competition(s) in this date range.
            </p>
          </section>
        )}

        {!data && !busy && (
          <section className="card cch-empty-hint">
            <p className="hint" style={{ margin: 0 }}>
              Set a date range and load matches to pick competitions and export scorecards.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
