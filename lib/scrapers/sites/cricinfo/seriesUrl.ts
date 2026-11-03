const SERIES_PATH = /\/series\/[^/]+-(\d{6,})/i;

function isCricinfoHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "cricinfo.com" || h.endsWith(".cricinfo.com") || h === "espncricinfo.com" || h.endsWith(".espncricinfo.com");
}

/** Canonical https://www.espncricinfo.com/series/{slug}-{id} prefix from any Cricinfo series URL. */
export function cricinfoSeriesBaseFromInput(input: string): string {
  let raw = input.trim();
  if (!raw) {
    throw new Error("Paste a Cricinfo series URL");
  }
  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://www.espncricinfo.com${raw.startsWith("/") ? "" : "/"}${raw}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("Invalid series URL");
  }

  if (!isCricinfoHost(parsed.hostname)) {
    throw new Error("URL must be on espncricinfo.com or cricinfo.com");
  }

  parsed.protocol = "https:";
  parsed.hostname = "www.espncricinfo.com";
  parsed.hash = "";
  parsed.search = "";

  const path = parsed.pathname.replace(/\/+$/, "");
  const baseMatch = path.match(/^(\/series\/[^/]+-\d+)/i);
  if (!baseMatch?.[1]) {
    throw new Error("Expected a Cricinfo series URL (/series/{slug}-{id}/…)");
  }

  return `https://www.espncricinfo.com${baseMatch[1]}`;
}

export function normalizeCricinfoSeriesFixturesUrl(input: string): string {
  return `${cricinfoSeriesBaseFromInput(input)}/match-schedule-fixtures-and-results`;
}

export function parseCricinfoSeriesObjectId(url: string): string {
  const normalized = normalizeCricinfoSeriesFixturesUrl(url);
  const m = normalized.match(SERIES_PATH);
  if (!m?.[1]) {
    throw new Error("Could not parse Cricinfo series id from URL");
  }
  return m[1];
}

export function cricinfoSeriesBaseUrl(fixturesUrl: string): string {
  return cricinfoSeriesBaseFromInput(fixturesUrl);
}

export function buildCricinfoScorecardUrl(seriesFixturesUrl: string, slug: string, objectId: number): string {
  const base = cricinfoSeriesBaseUrl(seriesFixturesUrl);
  return `${base}/${slug}-${objectId}/full-scorecard`;
}

export function isCricinfoSeriesUrl(url: string): boolean {
  try {
    parseCricinfoSeriesObjectId(url);
    return true;
  } catch {
    return false;
  }
}
