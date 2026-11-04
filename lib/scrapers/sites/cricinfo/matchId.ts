const MATCH_OBJECT_ID = /-(\d{6,})(?:\/full-scorecard|\/live-scorecard|\/|$)/i;

export function stripCricinfoUrlHash(input: string): string {
  try {
    const u = new URL(input.trim());
    u.hash = "";
    return u.toString();
  } catch {
    return input.split("#")[0] ?? input;
  }
}

/** ESPN discover stores series id in `#espnLeague=` on placeholder scorecard URLs. */
export function parseEspnLeagueIdFromCricinfoUrl(input: string): number | null {
  try {
    const u = new URL(input.trim());
    const fromHash = u.hash.match(/espnLeague=(\d+)/i)?.[1];
    if (fromHash) {
      const n = Number(fromHash);
      return Number.isFinite(n) ? n : null;
    }
  } catch {
    // ignore
  }
  return null;
}

export function normalizeCricinfoScorecardUrl(input: string): string {
  let url = stripCricinfoUrlHash(input.trim());
  if (/^\d{6,}$/.test(url)) {
    url = `https://www.espncricinfo.com/series/x-${url}/x-${url}/full-scorecard`;
  }
  if (!url.startsWith("http")) {
    url = `https://www.espncricinfo.com${url.startsWith("/") ? "" : "/"}${url}`;
  }
  url = url.replace(/^https?:\/\/(?:www\.)?cricinfo\.com/i, "https://www.espncricinfo.com");
  url = url.replace(/\/+$/, "");
  url = url.replace(/\/ball-by-ball-commentary$/i, "/full-scorecard");
  if (!/\/full-scorecard$/i.test(url)) {
    url = url.replace(/\/live-scorecard$/i, "/full-scorecard");
    if (!/\/full-scorecard$/i.test(url)) {
      url = `${url}/full-scorecard`;
    }
  }
  return url;
}

export function parseCricinfoMatchObjectId(url: string): string {
  const normalized = normalizeCricinfoScorecardUrl(url);
  const beforeScorecard = normalized.match(/-(\d{6,})\/full-scorecard$/i);
  if (beforeScorecard?.[1]) {
    return beforeScorecard[1];
  }
  const m = normalized.match(MATCH_OBJECT_ID);
  if (!m?.[1]) {
    throw new Error("Could not parse Cricinfo match id from URL");
  }
  return m[1];
}

export function isCricinfoScorecardUrl(url: string): boolean {
  try {
    parseCricinfoMatchObjectId(url);
    return true;
  } catch {
    return false;
  }
}
