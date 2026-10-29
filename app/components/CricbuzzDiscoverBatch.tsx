"use client";

import { useState } from "react";
import type { SiteMatchSummary } from "@/lib/scrapers/types";
import { CricbuzzMatchExportSection } from "@/app/components/cricbuzzBatchExport";

export function CricbuzzDiscoverBatch() {
  const [matches, setMatches] = useState<SiteMatchSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onDiscover() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cricbuzz/discover/recent");
      const text = await res.text();
      let data: { error?: string; matches?: SiteMatchSummary[]; count?: number };
      try {
        data = JSON.parse(text) as typeof data;
      } catch {
        throw new Error(
          res.ok ? "Invalid response from server" : text.slice(0, 120) || `HTTP ${res.status}`,
        );
      }
      if (!res.ok) throw new Error(data.error ?? `Discover failed (${res.status})`);
      setMatches(data.matches ?? []);
      setMessage(`${data.count ?? 0} recent match(es) from Cricbuzz.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Discover failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="card">
        <h2>Recent matches</h2>
        <p className="hint" style={{ marginTop: 0, marginBottom: "1rem" }}>
          Loads matches from{" "}
          <a
            href="https://www.cricbuzz.com/cricket-match/live-scores/recent-matches"
            target="_blank"
            rel="noreferrer"
          >
            Cricbuzz recent matches
          </a>
          .
        </p>
        <button type="button" className="primary" disabled={busy} onClick={onDiscover}>
          {busy ? "Loading…" : "Load recent matches"}
        </button>
      </section>
      <CricbuzzMatchExportSection matches={matches} busy={busy} />
      {message && <p className="hint">{message}</p>}
    </>
  );
}
