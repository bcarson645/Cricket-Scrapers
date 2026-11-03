"use client";

import { useState } from "react";
import { buildScorecardQaView, type ScorecardQaView } from "@/app/data/scorecardQaView";
import type { ExportRow } from "@/lib/scorecards/export-columns";
import type { CricbuzzParsedMatch } from "@/lib/scrapers/sites/cricbuzz/parseHtml";

const DEFAULT_URL =
  "https://www.espncricinfo.com/series/ranji-trophy-2026-27-1546521/chhattisgarh-vs-hyderabad-india-elite-group-b-1546585/full-scorecard";

type ApiOk = {
  parsed: CricbuzzParsedMatch;
  rows: ExportRow[];
  rowCount: number;
};

export function CricinfoScorecardQa() {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [internalMatchId, setInternalMatchId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ScorecardQaView | null>(null);
  const [lastUrl, setLastUrl] = useState<string | null>(null);

  async function onScrape() {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Paste a Cricinfo full-scorecard URL.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const params = new URLSearchParams({ url: trimmed });
      if (internalMatchId.trim()) params.set("matchId", internalMatchId.trim());
      const res = await fetch(`/api/cricinfo/scorecard?${params}`);
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
    window.open(`/api/cricinfo/scorecard?${params}`, "_blank");
  }

  return (
    <>
      <section className="card">
        <h2>Cricinfo scorecard (QA)</h2>
        <p className="hint" style={{ marginTop: 0, marginBottom: "1rem" }}>
          Paste an ESPN Cricinfo <strong>full-scorecard</strong> URL (espncricinfo.com or
          cricinfo.com). Ranji, Tests, ODIs, and T20s are supported via the page JSON payload.
        </p>
        <label htmlFor="ci-url">Scorecard URL</label>
        <input
          id="ci-url"
          className="input-wide"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.espncricinfo.com/series/…/full-scorecard"
        />
        <div className="row" style={{ marginTop: "1rem" }}>
          <div>
            <label htmlFor="ci-match-id">Internal match ID (optional)</label>
            <input
              id="ci-match-id"
              type="text"
              value={internalMatchId}
              onChange={(e) => setInternalMatchId(e.target.value)}
              placeholder="Sportradar match id"
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
