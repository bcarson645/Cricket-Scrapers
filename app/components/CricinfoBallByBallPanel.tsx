"use client";

import { useState } from "react";

const DEFAULT_URL =
  "https://www.espncricinfo.com/series/ipl-2025-1449924/mumbai-indians-vs-punjab-kings-qualifier-2-1473510/full-scorecard";

type PreviewRow = {
  innings: string | number | null;
  deliv: string | number | null;
  cumRuns: string | number | null;
  cumWkts: string | number | null;
  bowlerName: string | number | null;
  batsmanName: string | number | null;
  ballRuns: string | number | null;
  ballWkt: string | number | null;
};

type ApiOk = {
  matchId: string;
  sourceUrl: string;
  source: string;
  rowCount: number;
  byInnings: Record<string, number>;
  warning?: string;
  preview: PreviewRow[];
};

export function CricinfoBallByBallPanel() {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [authToken, setAuthToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiOk | null>(null);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [lastToken, setLastToken] = useState("");

  async function onLoad() {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Paste a Cricinfo scorecard or ball-by-ball commentary URL.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const params = new URLSearchParams({ url: trimmed });
      const headers: HeadersInit = {};
      const token = authToken.trim();
      if (token) headers["x-hsci-auth-token"] = token;
      const res = await fetch(`/api/cricinfo/ball-by-ball?${params}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fetch failed");
      setResult(data as ApiOk);
      setLastUrl(trimmed);
      setLastToken(token);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Fetch failed");
    } finally {
      setBusy(false);
    }
  }

  function downloadTsv() {
    if (!lastUrl) return;
    const params = new URLSearchParams({ url: lastUrl, format: "tsv" });
    const token = lastToken;
    if (token) {
      fetch(`/api/cricinfo/ball-by-ball?${params}`, {
        headers: { "x-hsci-auth-token": token },
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error ?? "Download failed");
          }
          const blob = await res.blob();
          const matchId = result?.matchId ?? "match";
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `ball-by-ball-${matchId}.tsv`;
          a.click();
          URL.revokeObjectURL(a.href);
        })
        .catch((e) => setError(e instanceof Error ? e.message : "Download failed"));
      return;
    }
    window.open(`/api/cricinfo/ball-by-ball?${params}`, "_blank");
  }

  return (
    <>
      <section className="card">
        <h2>Ball-by-ball export</h2>
        <p className="hint" style={{ marginTop: 0, marginBottom: "1rem" }}>
          Paste a <strong>full-scorecard</strong> or <strong>ball-by-ball-commentary</strong> URL.
          Export is tab-separated with the Sportradar-style ball-by-ball columns (T20-focused).
        </p>
        <label htmlFor="ci-bbb-url">Match URL</label>
        <input
          id="ci-bbb-url"
          className="input-wide"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.espncricinfo.com/series/…/full-scorecard"
        />
        <div className="row" style={{ marginTop: "1rem" }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="ci-bbb-token">HSCI auth token (optional)</label>
            <input
              id="ci-bbb-token"
              className="input-wide"
              type="password"
              autoComplete="off"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              placeholder="From DevTools → Network → comments → x-hsci-auth-token"
            />
            <p className="hint" style={{ marginTop: "0.35rem" }}>
              Without a token, only balls embedded in the commentary HTML are returned (often partial).
              The server can also use <code>CRICINFO_HSCI_AUTH_TOKEN</code> in the environment.
            </p>
          </div>
        </div>
        <div className="btn-row">
          <button type="button" className="primary" disabled={busy} onClick={onLoad}>
            {busy ? "Loading…" : "Load ball-by-ball"}
          </button>
          {result && result.rowCount > 0 && (
            <button type="button" className="secondary" onClick={downloadTsv}>
              Download TSV
            </button>
          )}
        </div>
        {error && <p className="hint error">{error}</p>}
      </section>

      {result && (
        <section className="card">
          <h2>Match {result.matchId}</h2>
          <dl className="meta-grid">
            <div>
              <dt>Deliveries</dt>
              <dd>{result.rowCount}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{result.source}</dd>
            </div>
            <div>
              <dt>Innings breakdown</dt>
              <dd>
                {Object.entries(result.byInnings)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([inn, n]) => `Inn ${inn}: ${n}`)
                  .join(" · ") || "—"}
              </dd>
            </div>
          </dl>
          {result.warning && <p className="hint error">{result.warning}</p>}

          {result.preview.length > 0 && (
            <>
              <h3 style={{ marginTop: "1.25rem" }}>Preview (first {result.preview.length} rows)</h3>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Inn</th>
                      <th>Deliv</th>
                      <th>Runs</th>
                      <th>Wkt</th>
                      <th>Cum</th>
                      <th>Bowler</th>
                      <th>Batter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.preview.map((row, i) => (
                      <tr key={`${row.innings}-${row.deliv}-${i}`}>
                        <td>{row.innings}</td>
                        <td>{row.deliv}</td>
                        <td>{row.ballRuns}</td>
                        <td>{row.ballWkt}</td>
                        <td>
                          {row.cumRuns}/{row.cumWkts}
                        </td>
                        <td>{row.bowlerName}</td>
                        <td>{row.batsmanName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </>
  );
}
