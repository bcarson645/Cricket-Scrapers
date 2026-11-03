import { normalizeCricinfoScorecardUrl } from "@/lib/scrapers/sites/cricinfo/matchId";

const DEFAULT_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9",
};

export type CricinfoAppPageData = {
  match: Record<string, unknown>;
  content: Record<string, unknown>;
};

export type CricinfoSeriesPageData = {
  series: Record<string, unknown>;
  matches: Record<string, unknown>[];
};

function extractNextDataRoot(html: string): { props?: { appPageProps?: { data?: Record<string, unknown> } } } {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m?.[1]) {
    throw new Error("Cricinfo page did not include __NEXT_DATA__");
  }
  try {
    return JSON.parse(m[1]) as { props?: { appPageProps?: { data?: Record<string, unknown> } } };
  } catch {
    throw new Error("Invalid __NEXT_DATA__ JSON on Cricinfo page");
  }
}

export async function fetchCricinfoHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: DEFAULT_HEADERS, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Cricinfo HTTP ${res.status} for ${url}`);
  }
  return res.text();
}

export async function fetchCricinfoScorecardHtml(url: string): Promise<string> {
  const normalized = normalizeCricinfoScorecardUrl(url);
  return fetchCricinfoHtml(normalized);
}

export async function fetchCricinfoSeriesPageHtml(url: string): Promise<string> {
  return fetchCricinfoHtml(url);
}

export function extractCricinfoAppPageData(html: string): CricinfoAppPageData {
  const data = extractNextDataRoot(html).props?.appPageProps?.data;
  if (!data?.match || !data.content) {
    throw new Error("Cricinfo scorecard payload missing match/content");
  }
  if (!Array.isArray((data.content as { innings?: unknown }).innings)) {
    throw new Error("Cricinfo scorecard has no innings data yet");
  }
  return data as CricinfoAppPageData;
}

export function extractCricinfoSeriesPageData(html: string): CricinfoSeriesPageData {
  const data = extractNextDataRoot(html).props?.appPageProps?.data;
  if (!data?.series || !data.content) {
    throw new Error("Cricinfo series payload missing series/content");
  }
  const matches = (data.content as { matches?: unknown }).matches;
  if (!Array.isArray(matches)) {
    throw new Error("Cricinfo series page has no fixtures/results list");
  }
  return {
    series: data.series as Record<string, unknown>,
    matches: matches as Record<string, unknown>[],
  };
}

export async function fetchCricinfoAppPageData(url: string): Promise<{
  sourceUrl: string;
  data: CricinfoAppPageData;
}> {
  const sourceUrl = normalizeCricinfoScorecardUrl(url);
  const html = await fetchCricinfoScorecardHtml(sourceUrl);
  const data = extractCricinfoAppPageData(html);
  return { sourceUrl, data };
}
