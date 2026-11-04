import { normalizeCricinfoScorecardUrl, stripCricinfoUrlHash } from "@/lib/scrapers/sites/cricinfo/matchId";

const SAFARI_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9",
  Referer: "https://www.espncricinfo.com/",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
};

const MOBILE_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9",
  Referer: "https://www.espncricinfo.com/",
};

const CHROME_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9",
  Referer: "https://www.espncricinfo.com/",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
};

const HTML_HEADER_SETS: Record<string, string>[] = [SAFARI_HEADERS, MOBILE_HEADERS, CHROME_HEADERS];

export { stripCricinfoUrlHash };

export function isCricinfoHttpForbidden(error: unknown): boolean {
  return error instanceof Error && /\bHTTP 403\b/.test(error.message);
}

async function fetchCricinfoHtmlOnce(url: string, headers: Record<string, string>): Promise<Response> {
  return fetch(url, { headers, cache: "no-store" });
}

export type CricinfoAppPageData = {
  match: Record<string, unknown>;
  content: Record<string, unknown>;
};

export type CricinfoSeriesPageData = {
  series: Record<string, unknown>;
  matches: Record<string, unknown>[];
};

function htmlHasNextData(html: string): boolean {
  return /<script id="__NEXT_DATA__"/.test(html);
}

function missingNextDataError(url: string, html: string): Error {
  const title = html.match(/<title>([^<]*)/i)?.[1]?.trim();
  const oops =
    /Oops|something went wrong|page does not exist or has been moved/i.test(html) ||
    /\/ci\/content\/test\/error\//i.test(html);
  if (oops) {
    return new Error(
      `Cricinfo scorecard URL not found or invalid${title ? ` (${title})` : ""} — use full scorecard links from discover, not match id only.`,
    );
  }
  const blocked =
    /access denied|permission denied|bot manager|unusual traffic|<title>access denied/i.test(html);
  if (blocked) {
    return new Error(
      `Cricinfo blocked this request (no scorecard JSON).${title ? ` Page title: ${title}` : ""}`,
    );
  }
  return new Error(
    `Cricinfo page did not include __NEXT_DATA__${title ? ` (${title})` : ""} for ${url}`,
  );
}

function extractNextDataRoot(html: string): { props?: { appPageProps?: { data?: Record<string, unknown> } } } {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m?.[1]) {
    throw missingNextDataError("scorecard page", html);
  }
  try {
    return JSON.parse(m[1]) as { props?: { appPageProps?: { data?: Record<string, unknown> } } };
  } catch {
    throw new Error("Invalid __NEXT_DATA__ JSON on Cricinfo page");
  }
}

export async function fetchCricinfoHtml(
  url: string,
  options?: { requireNextData?: boolean },
): Promise<string> {
  const cleanUrl = stripCricinfoUrlHash(url);
  let lastStatus = 0;
  let lastHtml = "";
  for (const headers of HTML_HEADER_SETS) {
    const res = await fetchCricinfoHtmlOnce(cleanUrl, headers);
    lastStatus = res.status;
    if (res.ok) {
      const html = await res.text();
      if (!options?.requireNextData || htmlHasNextData(html)) {
        return html;
      }
      lastHtml = html;
      continue;
    }
    if (res.status !== 403) {
      throw new Error(`Cricinfo HTTP ${res.status} for ${cleanUrl}`);
    }
  }
  if (lastHtml && options?.requireNextData) {
    throw missingNextDataError(cleanUrl, lastHtml);
  }
  throw new Error(`Cricinfo HTTP ${lastStatus} for ${cleanUrl}`);
}

export async function fetchCricinfoScorecardHtml(url: string): Promise<string> {
  const { resolveCricinfoScorecardUrl } = await import(
    "@/lib/scrapers/sites/cricinfo/resolveScorecardUrl"
  );
  const resolved = await resolveCricinfoScorecardUrl(url);
  const fallback = normalizeCricinfoScorecardUrl(url);
  const candidates = resolved === fallback ? [resolved] : [resolved, fallback];

  let lastError: Error | undefined;
  for (const candidate of candidates) {
    try {
      return await fetchCricinfoHtml(candidate, { requireNextData: true });
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastError ?? new Error("Failed to fetch Cricinfo scorecard HTML");
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
