"use client";

import { useEffect, useMemo, useState } from "react";
import type { SiteMatchSummary } from "@/lib/scrapers/types";

type Props = {
  matches: SiteMatchSummary[];
  busy: boolean;
  onScrapeCsv: (matchIds: string[]) => Promise<void>;
};

export function CricbuzzMatchExportTable({ matches, busy, onScrapeCsv }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setSelected(new Set());
    setMessage(null);
  }, [matches]);

  const allSelected = useMemo(
    () => matches.length > 0 && selected.size === matches.length,
    [matches, selected],
  );

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

  async function onDownload() {
    if (selected.size === 0) {
      setMessage("Select at least one match.");
      return;
    }
    setMessage(null);
    setExporting(true);
    try {
      await onScrapeCsv([...selected]);
      setMessage(`Downloaded CSV for ${selected.size} match(es), sorted by date.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Batch scrape failed");
    } finally {
      setExporting(false);
    }
  }

  const disabled = busy || exporting;

  if (matches.length === 0) return null;

  return (
    <>
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
          <button type="button" className="primary" disabled={disabled} onClick={onDownload}>
            {disabled ? "Scraping…" : "Download combined CSV"}
          </button>
        </div>
      </section>
      {message && <p className="hint">{message}</p>}
    </>
  );
}
