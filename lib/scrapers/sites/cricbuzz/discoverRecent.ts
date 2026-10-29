import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import type { SiteMatchSummary } from "@/lib/scrapers/types";
import { normalizeCricbuzzScorecardUrl, parseCricbuzzMatchId } from "@/lib/scrapers/sites/cricbuzz/scrape";

const SCORECARD_HREF =
  /\/live-cricket-(?:scorecard|scores)\/(\d+)(?:\/([^"?#]+))?/i;

/** Parse M/D/YYYY or ISO-ish fragments from listing text. */
function parseListingDate(text: string): string | null {
  const m = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (m) return `${Number(m[1])}/${Number(m[2])}/${m[3]}`;
  const months =
    "January|February|March|April|May|June|July|August|September|October|November|December";
  const m2 = text.match(new RegExp(`(${months})\\s+(\\d{1,2}),?\\s+(20\\d{2})`, "i"));
  if (m2) {
    const monthNames: Record<string, number> = {
      january: 1,
      february: 2,
      march: 3,
      april: 4,
      may: 5,
      june: 6,
      july: 7,
      august: 8,
      september: 9,
      october: 10,
      november: 11,
      december: 12,
    };
    const mo = monthNames[m2[1]!.toLowerCase()];
    if (mo) return `${mo}/${m2[2]}/${m2[3]}`;
  }
  return null;
}

function titleFromSlug(slug: string | undefined, linkText: string): string {
  const t = linkText.replace(/\s+/g, " ").trim();
  if (t.length > 3 && !/^live$/i.test(t)) return t;
  if (!slug) return t || "Match";
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function nearbyListingText($: cheerio.CheerioAPI, el: Element): string {
  const parts: string[] = [];
  let cur = $(el).parent();
  for (let i = 0; i < 5 && cur.length > 0; i++) {
    parts.push(cur.text());
    cur = cur.parent();
  }
  return parts.join(" ").replace(/\s+/g, " ");
}

export function parseCricbuzzRecentMatchesHtml(html: string): SiteMatchSummary[] {
  const $ = cheerio.load(html);
  const byId = new Map<string, SiteMatchSummary>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const m = href.match(SCORECARD_HREF);
    if (!m) return;
    const matchId = m[1]!;
    if (byId.has(matchId)) return;

    const slug = m[2];
    const linkText = $(el).text();
    const block = nearbyListingText($, el);
    const date = parseListingDate(block);

    let scorecardUrl: string;
    try {
      scorecardUrl = normalizeCricbuzzScorecardUrl(matchId);
    } catch {
      return;
    }

    byId.set(matchId, {
      matchId,
      title: titleFromSlug(slug, linkText),
      matchDate: date,
      competition: null,
      url: scorecardUrl,
    });
  });

  return [...byId.values()];
}

export function compareExportDates(a: string | null, b: string | null): number {
  const ta = exportDateToSortKey(a);
  const tb = exportDateToSortKey(b);
  if (ta !== tb) return ta - tb;
  return 0;
}

/** Sort key: YYYYMMDD or 0 if unknown (sorted first). */
export function exportDateToSortKey(date: string | null): number {
  if (!date) return 0;
  const parts = date.split("/").map((p) => Number(p.trim()));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return 0;
  const [mo, day, year] = parts;
  return year! * 10000 + mo! * 100 + day!;
}

export async function discoverCricbuzzRecentMatches(
  fetchHtml: (url: string) => Promise<string>,
): Promise<SiteMatchSummary[]> {
  const url = "https://www.cricbuzz.com/cricket-match/live-scores/recent-matches";
  const html = await fetchHtml(url);
  const matches = parseCricbuzzRecentMatchesHtml(html);
  matches.sort((x, y) => compareExportDates(y.matchDate, x.matchDate) || Number(y.matchId) - Number(x.matchId));
  return matches;
}

export function assertCricbuzzMatchId(id: string): string {
  return parseCricbuzzMatchId(id);
}
