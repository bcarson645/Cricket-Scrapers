"use client";

import { useState } from "react";
import { buildScorecardQaView, type ScorecardQaView } from "@/app/data/scorecardQaView";
import type { ExportRow } from "@/lib/scorecards/export-columns";
import type { CricbuzzParsedMatch } from "@/lib/scrapers/sites/cricbuzz/parseHtml";

const DEFAULT_URL =
  "https://www.cricbuzz.com/live-cricket-scorecard/139489/ind-vs-nz-final-icc-mens-t20-world-cup-2026";

type ApiOk = {
  parsed: CricbuzzParsedMatch;
  rows: ExportRow[];
  rowCount: number;
};

export function CricbuzzScorecardQa() {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [internalMatchId, setInternalMatchId] = useState("1512773");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ScorecardQaView | null>(null);
  const [lastUrl, setLastUrl] = useState<string | null>(null);

  async function onScrape() {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Paste a Cricbuzz scorecard URL.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const params = new URLSearchParams({ url: trimmed });
      if (internalMatchId.trim()) params.set("matchId", internalMatchId.trim());
      const res = await fetch(`/api/cricbuzz/scorecard?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scrape failed");
      const ok = data as ApiOk;
      setView(buildScorecardQaView(ok.parsed, ok.rows));
      setLastUrl(trimmed);
    } catch (e) {
      setView(null);
      setError(e instanceof Error ? e.message : "Scrape failed");
    } finally {
      setBusy(false);
    }
  }

  function downloadCsv() {
    if (!lastUrl) return;
    const params = new URLSearchParams({ url: lastUrl, format: "csv" });
    if (internalMatchId.trim()) params.set("matchId", internalMatchId.trim());
    window.open(`/api/cricbuzz/scorecard?${params}`, "_blank");
  }

  return (
    <>
      <section className="card">
        <h2>Cricbuzz scorecard (QA)</h2>
        <p className="hint" style={{ marginTop: 0, marginBottom: "1rem" }}>
          Paste a Cricbuzz scorecard or live-scores URL (same match id). Live-scores links are
          resolved to the full scorecard page automatically.
        </p>
        <label htmlFor="cb-url">Scorecard URL</label>
        <input
          id="cb-url"
          className="input-wide"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.cricbuzz.com/live-cricket-scorecard/..."
        />
        <div className="row" style={{ marginTop: "1rem" }}>
          <div>
            <label htmlFor="cb-match-id">Internal match ID (optional)</label>
            <input
              id="cb-match-id"
              type="text"
              value={internalMatchId}
              onChange={(e) => setInternalMatchId(e.target.value)}
              placeholder="1512773"
            />
          </div>
        </div>
        <div className="btn-row">
          <button type="button" className="primary" disabled={busy} onClick={onScrape}>
            {busy ? "Scraping…" : "Load scorecard"}
          </button>
          {view && (
            <button type="button" className="secondary" onClick={downloadCsv}>
              Download CSV
            </button>
          )}
        </div>
        {error && <p className="hint error">{error}</p>}
      </section>

      {view && (
        <section className="card">
          <h2>{view.matchLabel}</h2>
          <dl className="meta-grid">
            <div>
              <dt>Date</dt>
              <dd>{view.date}</dd>
            </div>
            <div>
              <dt>Format</dt>
              <dd>{view.format}</dd>
            </div>
            <div>
              <dt>Venue</dt>
              <dd>{view.venue}</dd>
            </div>
            <div>
              <dt>Host</dt>
              <dd>{view.host}</dd>
            </div>
            <div>
              <dt>Max overs</dt>
              <dd>{view.maxOvers}</dd>
            </div>
            <div>
              <dt>Export rows</dt>
              <dd>{view.rowCount}</dd>
            </div>
          </dl>

          {view.innings.map((inn) => (
            <div key={inn.inningsNumber} className="innings-block">
              <h3>
                Innings {inn.inningsNumber} — {inn.team} vs {inn.opponent}
                <span className="innings-total">
                  {inn.total}/{inn.wickets} (extras {inn.extras})
                </span>
              </h3>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Batter</th>
                      <th>Dismissal</th>
                      <th>R</th>
                      <th>B</th>
                      <th>4s</th>
                      <th>6s</th>
                      <th>O</th>
                      <th>M</th>
                      <th>Bowl R</th>
                      <th>W</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inn.players.map((p) => (
                      <tr key={`${inn.inningsNumber}-${p.order}-${p.name}`}>
                        <td>{p.order}</td>
                        <td>{p.name}</td>
                        <td className="dismissal">{p.dismissal}</td>
                        <td>{p.runs}</td>
                        <td>{p.balls}</td>
                        <td>{p.fours}</td>
                        <td>{p.sixes}</td>
                        <td>{p.bowlOvers}</td>
                        <td>{p.bowlMaidens}</td>
                        <td>{p.bowlRuns}</td>
                        <td>{p.bowlWickets}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
