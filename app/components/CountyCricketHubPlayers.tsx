"use client";

import { useEffect, useMemo, useState } from "react";
import type { CchPlayerProfile } from "@/lib/scrapers/sites/countycrickethub/playerRoster";
import { countyNamesForSite } from "@/lib/scrapers/sites/countycrickethub/teams";
import {
  paginateSlice,
  PaginationControls,
} from "@/app/components/cch/PaginationControls";

type ApiOk = {
  count: number;
  site: string;
  players: CchPlayerProfile[];
};

type SortKey = "name" | "age" | "playerId";

function uniqueSorted(values: (string | null | undefined)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v?.trim())))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function filterPlayers(
  players: CchPlayerProfile[],
  opts: {
    county: string;
    search: string;
    batHand: string;
    bowling: string;
    siteFilter: "" | "M" | "F";
    minAge: string;
    maxAge: string;
    missingDobOnly: boolean;
  },
): CchPlayerProfile[] {
  const q = opts.search.trim().toLowerCase();
  const min = opts.minAge.trim() === "" ? null : Number(opts.minAge);
  const max = opts.maxAge.trim() === "" ? null : Number(opts.maxAge);

  return players.filter((p) => {
    if (opts.siteFilter && p.site !== opts.siteFilter) return false;
    if (opts.county && !p.counties.some((c) => c === opts.county)) return false;
    if (opts.batHand && p.batHand !== opts.batHand) return false;
    if (opts.bowling && p.bowlingStyle !== opts.bowling) return false;
    if (opts.missingDobOnly && p.dateOfBirth) return false;
    if (min != null && (p.age == null || p.age < min)) return false;
    if (max != null && (p.age == null || p.age > max)) return false;
    if (q) {
      const hay = `${p.name} ${p.counties.join(" ")} ${p.batHand ?? ""} ${p.bowlingStyle ?? ""}`.toLowerCase();
      if (!hay.includes(q) && !String(p.playerId).includes(q)) return false;
    }
    return true;
  });
}

function sortPlayers(players: CchPlayerProfile[], sort: SortKey): CchPlayerProfile[] {
  const copy = [...players];
  copy.sort((a, b) => {
    if (sort === "playerId") return a.playerId - b.playerId;
    if (sort === "age") {
      const aa = a.age ?? -1;
      const bb = b.age ?? -1;
      return bb - aa;
    }
    return a.name.localeCompare(b.name);
  });
  return copy;
}

export function CountyCricketHubPlayers() {
  const [loadSite, setLoadSite] = useState<"both" | "M" | "F">("both");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [players, setPlayers] = useState<CchPlayerProfile[] | null>(null);
  const [lastSite, setLastSite] = useState<string>("both");

  const [county, setCounty] = useState("");
  const [search, setSearch] = useState("");
  const [batHand, setBatHand] = useState("");
  const [bowling, setBowling] = useState("");
  const [siteFilter, setSiteFilter] = useState<"" | "M" | "F">("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [missingDobOnly, setMissingDobOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("name");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const countyOptions = useMemo(() => {
    if (loadSite === "M") return countyNamesForSite("M");
    if (loadSite === "F") return countyNamesForSite("F");
    return [...countyNamesForSite("M"), ...countyNamesForSite("F")].sort((a, b) =>
      a.localeCompare(b),
    );
  }, [loadSite]);

  const batOptions = useMemo(
    () => (players ? uniqueSorted(players.map((p) => p.batHand)) : []),
    [players],
  );
  const bowlOptions = useMemo(
    () => (players ? uniqueSorted(players.map((p) => p.bowlingStyle)) : []),
    [players],
  );

  const filtered = useMemo(() => {
    if (!players) return [];
    return sortPlayers(
      filterPlayers(players, {
        county,
        search,
        batHand,
        bowling,
        siteFilter,
        minAge,
        maxAge,
        missingDobOnly,
      }),
      sort,
    );
  }, [players, county, search, batHand, bowling, siteFilter, minAge, maxAge, missingDobOnly, sort]);

  const pageItems = useMemo(
    () => paginateSlice(filtered, page, pageSize),
    [filtered, page, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [county, search, batHand, bowling, siteFilter, minAge, maxAge, missingDobOnly, sort, pageSize]);

  async function onLoad() {
    setBusy(true);
    setError(null);
    setCounty("");
    setSearch("");
    setBatHand("");
    setBowling("");
    setSiteFilter("");
    setMinAge("");
    setMaxAge("");
    setMissingDobOnly(false);
    setPage(1);
    try {
      const params = new URLSearchParams({ site: loadSite });
      const res = await fetch(`/api/countycrickethub/players?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Load failed");
      const ok = data as ApiOk;
      setPlayers(ok.players);
      setLastSite(loadSite);
    } catch (e) {
      setPlayers(null);
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setBusy(false);
    }
  }

  function downloadCsv() {
    const params = new URLSearchParams({ site: lastSite, format: "csv" });
    window.open(`/api/countycrickethub/players?${params}`, "_blank");
  }

  function clearResultFilters() {
    setCounty("");
    setSearch("");
    setBatHand("");
    setBowling("");
    setSiteFilter("");
    setMinAge("");
    setMaxAge("");
    setMissingDobOnly(false);
  }

  const missingDobCount = players?.filter((p) => p.age == null).length ?? 0;

  return (
    <div className="cch-tool-layout">
      <aside className="card cch-query-panel">
        <h2>Query — player database</h2>
        <p className="hint cch-query-intro">
          Squad APIs (<code>/ccdbapi/squad/&#123;teamId&#125;</code>) — bat hand, bowling style, DOB →
          age (same as each player page).
        </p>
        <label htmlFor="cch-player-site">Squads to load</label>
        <select
          id="cch-player-site"
          className="input-wide"
          value={loadSite}
          onChange={(e) => setLoadSite(e.target.value as "both" | "M" | "F")}
          disabled={busy}
        >
          <option value="both">Men + women (all counties)</option>
          <option value="M">Men&apos;s counties only</option>
          <option value="F">Women&apos;s counties only</option>
        </select>
        <div className="btn-row">
          <button type="button" className="primary" disabled={busy} onClick={onLoad}>
            {busy ? "Loading…" : "Load all players"}
          </button>
          {players && (
            <button type="button" className="secondary" onClick={downloadCsv}>
              Download CSV (full load)
            </button>
          )}
        </div>
        {error && <p className="hint error">{error}</p>}
        {players && (
          <p className="hint" style={{ marginTop: "0.75rem" }}>
            {players.length} players in memory
            {missingDobCount > 0 && ` (${missingDobCount} without DOB)`}
          </p>
        )}
      </aside>

      <div className="cch-results-panel">
        {players ? (
          <>
            <section className="card cch-result-filters">
              <div className="cch-result-section-head">
                <h2>Result filters</h2>
                <button type="button" className="secondary" onClick={clearResultFilters}>
                  Clear filters
                </button>
              </div>
              <div className="cch-filter-grid">
                <div className="cch-filter-span2">
                  <label htmlFor="cch-player-search">Search</label>
                  <input
                    id="cch-player-search"
                    className="input-wide"
                    type="search"
                    placeholder="Name, county, id…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="cch-player-county">County</label>
                  <select
                    id="cch-player-county"
                    className="input-wide"
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                  >
                    <option value="">All counties</option>
                    {countyOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="cch-player-site-filter">Competition</label>
                  <select
                    id="cch-player-site-filter"
                    className="input-wide"
                    value={siteFilter}
                    onChange={(e) => setSiteFilter(e.target.value as "" | "M" | "F")}
                  >
                    <option value="">Men + women</option>
                    <option value="M">Men only</option>
                    <option value="F">Women only</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="cch-player-bat">Bat hand</label>
                  <select
                    id="cch-player-bat"
                    className="input-wide"
                    value={batHand}
                    onChange={(e) => setBatHand(e.target.value)}
                  >
                    <option value="">Any</option>
                    {batOptions.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="cch-player-bowl">Bowling</label>
                  <select
                    id="cch-player-bowl"
                    className="input-wide"
                    value={bowling}
                    onChange={(e) => setBowling(e.target.value)}
                  >
                    <option value="">Any</option>
                    {bowlOptions.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="cch-player-min-age">Min age</label>
                  <input
                    id="cch-player-min-age"
                    className="input-wide"
                    type="number"
                    min={0}
                    max={99}
                    placeholder="Any"
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="cch-player-max-age">Max age</label>
                  <input
                    id="cch-player-max-age"
                    className="input-wide"
                    type="number"
                    min={0}
                    max={99}
                    placeholder="Any"
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="cch-player-sort">Sort</label>
                  <select
                    id="cch-player-sort"
                    className="input-wide"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                  >
                    <option value="name">Name A–Z</option>
                    <option value="age">Age (high first)</option>
                    <option value="playerId">Player id</option>
                  </select>
                </div>
                <div className="cch-filter-check">
                  <label className="category-check">
                    <input
                      type="checkbox"
                      checked={missingDobOnly}
                      onChange={(e) => setMissingDobOnly(e.target.checked)}
                    />
                    Missing DOB only
                  </label>
                </div>
              </div>
            </section>

            <section className="card cch-result-section">
              <div className="cch-result-section-head">
                <h2>Players</h2>
                <p className="hint" style={{ margin: 0 }}>
                  {filtered.length} matching
                  {filtered.length !== players.length ? ` of ${players.length}` : ""}
                </p>
              </div>
              <PaginationControls
                idPrefix="cch-players"
                page={page}
                pageSize={pageSize}
                total={filtered.length}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Id</th>
                      <th>Name</th>
                      <th>DOB</th>
                      <th>Age</th>
                      <th>Bat</th>
                      <th>Bowl</th>
                      <th>County</th>
                      <th>Comp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((p) => (
                      <tr key={p.playerId}>
                        <td>
                          <a href={p.profileUrl} target="_blank" rel="noreferrer">
                            {p.playerId}
                          </a>
                        </td>
                        <td>{p.name}</td>
                        <td>{p.dateOfBirth ?? "—"}</td>
                        <td>{p.age ?? "—"}</td>
                        <td>{p.batHand ?? "—"}</td>
                        <td>{p.bowlingStyle ?? "—"}</td>
                        <td>{p.counties.join(", ")}</td>
                        <td>{p.site === "M" ? "Men" : "Women"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <section className="card cch-empty-hint">
            <p className="hint" style={{ margin: 0 }}>
              Load squads on the left, then filter and paginate the full player list here.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
