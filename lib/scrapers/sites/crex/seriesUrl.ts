import { CREX_ORIGIN } from "@/lib/scrapers/sites/crex/config";
import { crexAbsoluteUrl } from "@/lib/scrapers/sites/crex/fetchPage";

const SERIES_PATH = /^\/series\/([a-z0-9-]+)-([0-9A-Z]+)\/?$/i;

export function parseCrexSeriesFromUrl(input: string): { slug: string; sf: string; url: string } {
  const url = crexAbsoluteUrl(input.trim());
  const m = new URL(url).pathname.match(SERIES_PATH);
  if (!m?.[1] || !m[2]) {
    throw new Error(
      "Could not parse Crex series URL — use https://crex.com/series/{slug}-{sf} (from crex.com/series)",
    );
  }
  return { slug: m[1], sf: m[2], url: `${CREX_ORIGIN}/series/${m[1]}-${m[2]}` };
}

export function normalizeCrexSeriesUrl(input: string): string {
  return parseCrexSeriesFromUrl(input).url;
}

export function extractCrexSeriesLinksFromHtml(html: string): { sf: string; url: string; label: string | null }[] {
  const out: { sf: string; url: string; label: string | null }[] = [];
  const seen = new Set<string>();
  for (const m of html.matchAll(/href="(\/series\/[a-z0-9-]+-[0-9A-Z]+)\/?"/gi)) {
    const path = m[1];
    const sf = path.match(/-([0-9A-Z]+)$/i)?.[1];
    if (!sf || seen.has(sf)) continue;
    seen.add(sf);
    out.push({ sf, url: `${CREX_ORIGIN}${path}`, label: null });
  }
  return out;
}
