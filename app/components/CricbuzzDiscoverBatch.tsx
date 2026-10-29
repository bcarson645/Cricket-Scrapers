"use client";

import { useMemo, useState } from "react";
import type { SiteMatchSummary } from "@/lib/scrapers/types";

export function CricbuzzDiscoverBatch() {
  const [matches, setMatches] = useState<SiteMatchSummary[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const allSelected = useMemo(
    () => matches.length > 0 && selected.size === matches.length,
    [matches, selected],
  );

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
      setSelected(new Set());
      setMessage(`${data.count ?? 0} recent match(es) from Cricbuzz.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Discover failed");
    } finally {
      setBusy(false);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(matches.map((m) => m.matchId)));
  }

  async function onScrapeCsv() {
    if (selected.size === 0) {
      setMessage("Select at least one match.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cricbuzz/scorecards/batch?format=csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchIds: [...selected] }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Batch scrape failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cricbuzz-scorecards.csv";
      a.click();
      URL.revokeObjectURL(url);
      setMessage(`Downloaded CSV for ${selected.size} match(es), sorted by date.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Batch scrape failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="card">
        <h2>Cricbuzz — recent matches</h2>
        <p className="hint" style={{ marginTop: 0, marginBottom: "1rem" }}>
          Loads matches from{" "}
          <a
            href="https://www.cricbuzz.com/cricket-match/live-scores/recent-matches"
            target="_blank"
            rel="noreferrer"
          >
            recent matches
          </a>
          . Select rows, then export one CSV with all scorecards in date order.
        </p>
        <button type="button" className="primary" disabled={busy} onClick={onDiscover}>
          {busy ? "Loading…" : "Discover recent matches"}
        </button>
      </section>

      {matches.length > 0 && (
        <section className="card">
          <h2>Select for export</h2>
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th>Date</th>
                <th>Match</th>
                <th>Cricbuzz ID</th>
                <th>Scorecard</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.matchId}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(m.matchId)}
                      onChange={() => toggle(m.matchId)}
                      aria-label={`Select ${m.title}`}
                    />
                  </td>
                  <td>{m.matchDate ?? "—"}</td>
                  <td>{m.title}</td>
                  <td>{m.matchId}</td>
                  <td>
                    {m.url ? (
                      <a href={m.url} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="btn-row">
            <button type="button" className="primary" disabled={busy} onClick={onScrapeCsv}>
              {busy ? "Scraping…" : "Download combined CSV"}
            </button>
          </div>
        </section>
      )}

      {message && <p className="hint">{message}</p>}
    </>
  );
}
