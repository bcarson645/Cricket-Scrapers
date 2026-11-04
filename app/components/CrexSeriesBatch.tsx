"use client";

import { useState } from "react";
import type { SiteMatchSummary } from "@/lib/scrapers/types";
import { CrexMatchExportSection } from "@/app/components/CrexMatchExportSection";

const DEFAULT_SERIES_URL = "https://crex.com/series/eng-a-vs-wi-a-2026-2O1";

export function CrexSeriesBatch() {
  const [seriesUrl, setSeriesUrl] = useState(DEFAULT_SERIES_URL);
  const [seriesTitle, setSeriesTitle] = useState<string | null>(null);
  const [matches, setMatches] = useState<SiteMatchSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageIsError, setMessageIsError] = useState(false);

  async function onLoadSeries() {
    const trimmed = seriesUrl.trim();
    if (!trimmed) {
      setMessage("Paste a Crex series URL.");
      setMessageIsError(true);
      return;
    }
    setBusy(true);
    setMessage(null);
    setMessageIsError(false);
    try {
      const params = new URLSearchParams({ url: trimmed });
      const res = await fetch(`/api/crex/discover/series?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Series load failed");
      setMatches(data.matches ?? []);
      setSeriesTitle(data.seriesTitle ?? null);
      if (data.seriesUrl) setSeriesUrl(data.seriesUrl);
      const label = data.seriesTitle ? `"${data.seriesTitle}"` : "series";
      setMessage(`${data.count ?? 0} match(es) in ${label}.`);
      setMessageIsError(false);
    } catch (e) {
      setMatches([]);
      setSeriesTitle(null);
      setMessage(e instanceof Error ? e.message : "Series load failed");
      setMessageIsError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="card">
        <h2>Series fixtures</h2>
        <p className="hint" style={{ marginTop: 0, marginBottom: "1rem" }}>
          Paste a series URL from{" "}
          <a href="https://crex.com/series" target="_blank" rel="noreferrer">
            crex.com/series
          </a>{" "}
          (pattern <code>/series/…-{`{sf}`}</code>, e.g.{" "}
          <code>eng-a-vs-wi-a-2026-2O1</code>). Select matches with scorecards for batch CSV export.
        </p>
        <label htmlFor="crex-series-url">Series URL</label>
        <input
          id="crex-series-url"
          className="input-wide"
          type="url"
          value={seriesUrl}
          onChange={(e) => setSeriesUrl(e.target.value)}
          placeholder="https://crex.com/series/eng-a-vs-wi-a-2026-2O1"
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
      <CrexMatchExportSection matches={matches} busy={busy} />
      {message && <p className={messageIsError ? "hint error" : "hint"}>{message}</p>}
    </>
  );
}
