"use client";

import { useState } from "react";
import type { SiteMatchSummary } from "@/lib/scrapers/types";
import { CricbuzzMatchExportSection } from "@/app/components/cricbuzzBatchExport";

const DEFAULT_SERIES_URL =
  "https://www.cricbuzz.com/cricket-series/11408/county-championship-division-one-2026/matches";

export function CricbuzzSeriesBatch() {
  const [seriesUrl, setSeriesUrl] = useState(DEFAULT_SERIES_URL);
  const [seriesTitle, setSeriesTitle] = useState<string | null>(null);
  const [matches, setMatches] = useState<SiteMatchSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onLoadSeries() {
    const trimmed = seriesUrl.trim();
    if (!trimmed) {
      setMessage("Paste a Cricbuzz series URL.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const params = new URLSearchParams({ url: trimmed });
      const res = await fetch(`/api/cricbuzz/discover/series?${params}`);
      const text = await res.text();
      let data: {
        error?: string;
        matches?: SiteMatchSummary[];
        count?: number;
        seriesTitle?: string | null;
        seriesUrl?: string;
      };
      try {
        data = JSON.parse(text) as typeof data;
      } catch {
        throw new Error(
          res.ok ? "Invalid response from server" : text.slice(0, 120) || `HTTP ${res.status}`,
        );
      }
      if (!res.ok) throw new Error(data.error ?? `Series load failed (${res.status})`);
      setMatches(data.matches ?? []);
      setSeriesTitle(data.seriesTitle ?? null);
      if (data.seriesUrl) setSeriesUrl(data.seriesUrl);
      const label = data.seriesTitle ? `"${data.seriesTitle}"` : "series";
      setMessage(`${data.count ?? 0} match(es) in ${label}.`);
    } catch (e) {
      setMatches([]);
      setSeriesTitle(null);
      setMessage(e instanceof Error ? e.message : "Series load failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="card">
        <h2>Series</h2>
        <p className="hint" style={{ marginTop: 0, marginBottom: "1rem" }}>
          Paste a Cricbuzz series URL (we crawl the{" "}
          <strong>/matches</strong> tab). Example: County Championship Division One 2026.
        </p>
        <label htmlFor="cb-series-url">Series URL</label>
        <input
          id="cb-series-url"
          className="input-wide"
          type="url"
          value={seriesUrl}
          onChange={(e) => setSeriesUrl(e.target.value)}
          placeholder="https://www.cricbuzz.com/cricket-series/…/matches"
        />
        <div className="btn-row">
          <button type="button" className="primary" disabled={busy} onClick={onLoadSeries}>
            {busy ? "Loading…" : "Load series matches"}
          </button>
        </div>
        {seriesTitle && (
          <p className="hint" style={{ marginBottom: 0 }}>
            Series: {seriesTitle}
          </p>
        )}
      </section>
      <CricbuzzMatchExportSection matches={matches} busy={busy} />
      {message && <p className="hint">{message}</p>}
    </>
  );
}
