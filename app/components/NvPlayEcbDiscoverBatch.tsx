"use client";

import { useMemo, useState } from "react";
import type {
  NvplayCompetitionOption,
  NvplayMatchWithCompetition,
} from "@/lib/scrapers/sites/nvplay-ecb/discoverMatches";
import { MatchExportTable } from "@/app/components/MatchExportTable";
import { downloadNvplayEcbBatchCsv } from "@/app/components/nvplayBatchExport";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 31);
  return { from: isoDate(from), to: isoDate(to) };
}

type DiscoverResponse = {
  from: string;
  to: string;
  competitions: NvplayCompetitionOption[];
  matches: NvplayMatchWithCompetition[];
  totalInRange: number;
};

export function NvPlayEcbDiscoverBatch() {
  const initial = defaultRange();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [completeOnly, setCompleteOnly] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [data, setData] = useState<DiscoverResponse | null>(null);
  const [selectedCompIds, setSelectedCompIds] = useState<Set<number>>(new Set());

  async function onLoadMatches() {
    setBusy(true);
    setMessage(null);
    setData(null);
    setSelectedCompIds(new Set());
    try {
      const params = new URLSearchParams({ from, to });
      if (!completeOnly) params.set("completeOnly", "0");
      const res = await fetch(`/api/nvplay-ecb/matches?${params}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Load failed");
      const ok = body as DiscoverResponse;
      setData(ok);
      setSelectedCompIds(new Set(ok.competitions.map((c) => c.competitionId)));
      setMessage(
        `${ok.totalInRange} match(es) in range — ${ok.competitions.length} competition(s). First load may take up to a minute (full NV Play match list).`,
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Load failed");
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

  return (
    <div className="cch-tool-layout">
      <aside className="card cch-query-panel">
        <h2>Query — fixtures by date</h2>
        <p className="hint cch-query-intro">
          Loads the ECB NV Play match list, then filters by start date (<code>StartDateTimeUTC</code>
          ). Multi-day games appear on their start day only.
        </p>
        <div className="date-range-row">
          <div>
            <label htmlFor="nv-from">From</label>
            <input
              id="nv-from"
              className="input-wide"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              disabled={busy}
            />
          </div>
          <div>
            <label htmlFor="nv-to">To</label>
            <input
              id="nv-to"
              className="input-wide"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={busy}
            />
          </div>
        </div>
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
      </aside>

      <div className="cch-results-panel">
        {message && <p className="hint cch-status-line">{message}</p>}

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
            onScrapeCsv={downloadNvplayEcbBatchCsv}
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
