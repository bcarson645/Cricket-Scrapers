"use client";

import { useMemo, useState } from "react";
import type { WorkbenchView } from "@/app/data/scrapeWorkbench";
import type { SiteMatchSummary } from "@/lib/scrapers/types";

type Props = { initial: WorkbenchView };

export function ScrapeWorkbench({ initial }: Props) {
  const [siteId, setSiteId] = useState(initial.defaultSiteId);
  const [start, setStart] = useState(initial.defaultStart);
  const [end, setEnd] = useState(initial.defaultEnd);
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
      const res = await fetch(
        `/api/discover?site=${encodeURIComponent(siteId)}&start=${start}&end=${end}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Discover failed");
      setMatches(data.matches ?? []);
      setSelected(new Set());
      setMessage(`${data.matches?.length ?? 0} match(es) in range.`);
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

  async function onScrape() {
    if (selected.size === 0) {
      setMessage("Select at least one match.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          start,
          end,
          matchIds: [...selected],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scrape failed");
      setMessage(`Saved ${data.saved} scorecard(s) to SQLite (run #${data.runId}).`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Scrape failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="card">
        <h2>Discover</h2>
        <div className="row">
          <div>
            <label htmlFor="site">Site</label>
            <select id="site" value={siteId} onChange={(e) => setSiteId(e.target.value)}>
              {initial.sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="start">From</label>
            <input id="start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label htmlFor="end">To</label>
            <input id="end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <button type="button" className="primary" disabled={busy} onClick={onDiscover}>
          List matches
        </button>
      </section>

      {matches.length > 0 && (
        <section className="card">
          <h2>Select scorecards</h2>
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
                <th>Competition</th>
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
                  <td>{m.competition ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="primary" disabled={busy} onClick={onScrape}>
            Scrape selected
          </button>
        </section>
      )}

      {message && <p className="hint">{message}</p>}
    </>
  );
}
