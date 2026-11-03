"use client";

import { useEffect, useMemo, useState } from "react";
import type { SiteMatchSummary } from "@/lib/scrapers/types";

type ExportKey = "matchId" | "url";

type Props = {
  matches: SiteMatchSummary[];
  busy: boolean;
  matchIdColumnLabel?: string;
  exportKey?: ExportKey;
  onScrapeCsv: (keys: string[]) => Promise<void>;
};

function exportValue(m: SiteMatchSummary, exportKey: ExportKey): string | null {
  if (exportKey === "url") return m.url;
  return m.matchId;
}

export function MatchExportTable({
  matches,
  busy,
  matchIdColumnLabel = "Match ID",
  exportKey = "matchId",
  onScrapeCsv,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const selectable = useMemo(
    () => matches.filter((m) => exportValue(m, exportKey) != null),
    [matches, exportKey],
  );

  useEffect(() => {
    setSelected(new Set());
    setMessage(null);
  }, [matches]);

  const allSelected = useMemo(
    () => selectable.length > 0 && selected.size === selectable.length,
    [selectable, selected],
  );

  function rowKey(m: SiteMatchSummary): string {
    return m.matchId;
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
    else setSelected(new Set(selectable.map((m) => rowKey(m))));
  }

  async function onDownload() {
    if (selected.size === 0) {
      setMessage("Select at least one match.");
      return;
    }
    setMessage(null);
    setExporting(true);
    try {
      const keys = matches
        .filter((m) => selected.has(rowKey(m)))
        .map((m) => exportValue(m, exportKey))
        .filter((k): k is string => k != null);
      await onScrapeCsv(keys);
      setMessage(`Downloaded CSV for ${keys.length} match(es), sorted by date.`);
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
              <th>{matchIdColumnLabel}</th>
              <th>Scorecard</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => {
              const canExport = exportValue(m, exportKey) != null;
              return (
                <tr key={rowKey(m)}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(rowKey(m))}
                      disabled={!canExport}
                      onChange={() => toggle(rowKey(m))}
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
              );
            })}
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
