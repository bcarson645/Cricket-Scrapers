import { CREX_ORIGIN } from "@/lib/scrapers/sites/crex/config";
import { crexAbsoluteUrl } from "@/lib/scrapers/sites/crex/fetchPage";

const SCORECARD_PATH = /\/match-scorecard\/?$/i;
const MATCH_PATH = /\/cricket-live-score\/([^/?#]+)/i;
const FKEY_SUFFIX = /-([0-9A-Z]{3,})$/i;

export function parseCrexMatchFkeyFromUrl(input: string): string {
  const url = crexAbsoluteUrl(input.trim());
  const path = new URL(url).pathname;
  const m = path.match(MATCH_PATH);
  if (!m?.[1]) {
    throw new Error(
      "Could not parse Crex match — use a crex.com/cricket-live-score/… URL (optionally ending in /match-scorecard)",
    );
  }
  const slug = m[1];
  const fk = slug.match(FKEY_SUFFIX)?.[1];
  if (!fk) {
    throw new Error("Crex match URL must end with match fkey suffix (e.g. …-150L)");
  }
  return fk;
}

export function normalizeCrexScorecardUrl(input: string): string {
  const url = crexAbsoluteUrl(input.trim());
  const u = new URL(url);
  if (!MATCH_PATH.test(u.pathname)) {
    throw new Error("Not a Crex cricket-live-score URL");
  }
  if (!SCORECARD_PATH.test(u.pathname)) {
    u.pathname = u.pathname.replace(/\/?$/, "/match-scorecard");
  }
  return u.toString();
}

export function isCrexScorecardUrl(input: string): boolean {
  try {
    normalizeCrexScorecardUrl(input);
    return true;
  } catch {
    return false;
  }
}

export function buildCrexScorecardUrlFromLink(link: string): string {
  const path = link.trim();
  const base = path.startsWith("http") ? path : `${CREX_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
  return normalizeCrexScorecardUrl(base);
}
