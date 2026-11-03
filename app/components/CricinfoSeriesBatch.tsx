"use client";

import { useState } from "react";
import type { SiteMatchSummary } from "@/lib/scrapers/types";
import { CricinfoMatchExportSection } from "@/app/components/cricinfoBatchExport";

const DEFAULT_SERIES_URL =
  "https://www.cricinfo.com/series/ireland-in-namibia-2026-27-1558225/match-schedule-fixtures-and-results";

export function CricinfoSeriesBatch() {
  const [seriesUrl, setSeriesUrl] = useState(DEFAULT_SERIES_URL);
  const [seriesTitle, setSeriesTitle] = useState<string | null>(null);
  const [matches, setMatches] = useState<SiteMatchSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageIsError, setMessageIsError] = useState(false);

  async function onLoadSeries() {
    const trimmed = seriesUrl.trim();
    if (!trimmed) {
      setMessage("Paste a Cricinfo series URL.");
      setMessageIsError(true);
      return;
    }
    setBusy(true);
    setMessage(null);
    setMessageIsError(false);
    try {
      const params = new URLSearchParams({ url: trimmed });
      const res = await fetch(`/api/cricinfo/discover/series?${params}`);
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
          res.ok ? "Invalid response from server" : text.slice(0, 200) || `HTTP ${res.status}`,
        );
      }
      if (!res.ok) throw new Error(data.error ?? `Series load failed (HTTP ${res.status})`);
      setMatches(data.matches ?? []);
      setSeriesTitle(data.seriesTitle ?? null);
      if (data.seriesUrl) setSeriesUrl(data.seriesUrl);
      const label = data.seriesTitle ? `"${data.seriesTitle}"` : "series";
      setMessage(`${data.count ?? 0} match(es) in ${label}.`);
      setMessageIsError(false);
    } catch (e) {
      setMatches([]);
      setSeriesTitle(null);
      const msg = e instanceof Error ? e.message : "Series load failed";
      if (msg === "Failed to fetch" || msg.includes("NetworkError")) {
        setMessage(
          "Could not reach the app (network error). Start the dev server with npm run dev and reload this page.",
        );
      } else {
        setMessage(msg);
      }
      setMessageIsError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="card">
        <h2>Series fixtures &amp; results</h2>
        <p className="hint" style={{ marginTop: 0, marginBottom: "1rem" }}>
          Paste a Cricinfo series{" "}
          <strong>match-schedule-fixtures-and-results</strong> URL (or any tab on the same series —
          we normalize to the fixtures list). Select finished matches with scorecards for batch CSV
          export.
        </p>
        <label htmlFor="ci-series-url">Series URL</label>
        <input
          id="ci-series-url"
          className="input-wide"
          type="url"
          value={seriesUrl}
          onChange={(e) => setSeriesUrl(e.target.value)}
          placeholder="https://www.espncricinfo.com/series/…/match-schedule-fixtures-and-results"
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
      <CricinfoMatchExportSection matches={matches} busy={busy} />
      {message && <p className={messageIsError ? "hint error" : "hint"}>{message}</p>}
    </>
  );
}
