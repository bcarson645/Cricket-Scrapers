import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import { normalizePersonName } from "@/lib/scrapers/sites/cricbuzz/dismissal";

export type CricbuzzBatLine = {
  order: number;
  name: string;
  cricbuzzPlayerId: string | null;
  dismissalRaw: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
};

export type CricbuzzBowlLine = {
  name: string;
  cricbuzzPlayerId: string | null;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  wides: number;
  noBalls: number;
};

export type CricbuzzInnings = {
  inningsNumber: number;
  /** Which time this team is batting in the match (1st, 2nd, …). */
  teamBattingInningsIndex: number;
  teamName: string;
  opponentName: string;
  total: number;
  wickets: number;
  extras: number;
  extrasByes: number;
  extrasLegByes: number;
  extrasWides: number;
  extrasNoBalls: number;
  oversCap: number;
  batters: CricbuzzBatLine[];
  didNotBat: string[];
  bowlers: CricbuzzBowlLine[];
};

export type CricbuzzParsedMatch = {
  cricbuzzMatchId: string;
  dateDisplay: string | null;
  formatLabel: string | null;
  maxOvers: number | null;
  venue: string | null;
  host: string | null;
  title: string | null;
  innings: CricbuzzInnings[];
  squads: Record<string, { name: string; cricbuzzPlayerId: string | null }[]>;
};

function parseNum(text: string): number {
  const n = Number(text.trim());
  return Number.isFinite(n) ? n : 0;
}

function parseBatGrid($: cheerio.CheerioAPI, grid: cheerio.Cheerio<Element>): CricbuzzBatLine | null {
  const name = grid.find("span.hover\\:underline").first().text().trim();
  if (!name) return null;
  const perf = grid.find('a[href*="player-match-performance"][href*="batting"]').first();
  const href = perf.attr("href") ?? "";
  const pid = href.match(/player\/(\d+)\//)?.[1] ?? null;
  const dismissalRaw = grid.find(".text-cbTxtSec.wb\\:text-xs").first().text().trim();
  const statTexts = grid
    .find(".flex.justify-center.items-center")
    .map((_, c) => $(c).text().trim())
    .get()
    .filter((t) => /^-?\d+(\.\d+)?$/.test(t));
  const [runs, balls, fours, sixes] = statTexts.map(parseNum);
  return {
    order: 0,
    name,
    cricbuzzPlayerId: pid,
    dismissalRaw,
    runs: runs ?? 0,
    balls: balls ?? 0,
    fours: fours ?? 0,
    sixes: sixes ?? 0,
  };
}

function parseBowlFromLink($: cheerio.CheerioAPI, link: cheerio.Cheerio<Element>): CricbuzzBowlLine | null {
  const href = link.attr("href") ?? "";
  const pid = href.match(/player\/(\d+)\//)?.[1] ?? null;
  const title = link.attr("title")?.replace("View match performance of ", "").trim() ?? "";
  const grid = link.closest(".grid");
  const stats = grid
    .find(".flex.justify-center.items-center")
    .map((_, c) => $(c).text().trim())
    .get()
    .filter((t) => /^-?\d+(\.\d+)?$/.test(t));
  if (stats.length < 4) return null;
  return {
    name: title,
    cricbuzzPlayerId: pid,
    overs: parseNum(stats[0] ?? "0"),
    maidens: parseNum(stats[1] ?? "0"),
    runs: parseNum(stats[2] ?? "0"),
    wickets: parseNum(stats[3] ?? "0"),
    noBalls: 0,
    wides: 0,
  };
}

function parseInningsBlock(
  $: cheerio.CheerioAPI,
  selector: string,
  inningsNumber: number,
  opponentName: string,
  defaultTeam: string,
): CricbuzzInnings | null {
  const root = $(selector);
  if (!root.length) return null;

  const blockText = root.text().replace(/\s+/g, " ");
  const totalMatch = blockText.match(/Total(\d+)-(\d+)/i);
  const extrasMatch = blockText.match(
    /Extras(\d+)\s*\(\s*b\s*(\d+),\s*lb\s*(\d+),\s*w\s*(\d+),\s*nb\s*(\d+)/i,
  );
  const dnbMatch = blockText.match(/Did not Bat(.+?)(?:Bowler|Fall of|$)/i);

  const batters: CricbuzzBatLine[] = [];
  root.find(".grid.scorecard-bat-grid").each((_, el) => {
    const line = parseBatGrid($, $(el));
    if (line) batters.push(line);
  });
  batters.forEach((b, i) => {
    b.order = i + 1;
  });

  const didNotBat = dnbMatch?.[1]
    ? dnbMatch[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const bowlers: CricbuzzBowlLine[] = [];
  const seen = new Set<string>();
  root.find(`a[href*="bowling?inningsId=${inningsNumber}"]`).each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const pid = href.match(/player\/(\d+)\//)?.[1] ?? href;
    if (seen.has(pid)) return;
    seen.add(pid);
    const bowl = parseBowlFromLink($, $(el));
    if (bowl) bowlers.push(bowl);
  });

  const oversCapMatch = blockText.match(/\((\d+)\s*Ov/i);
  const oversCap = oversCapMatch ? parseNum(oversCapMatch[1]!) : 20;

  return {
    inningsNumber,
    teamBattingInningsIndex: 1,
    teamName: defaultTeam,
    opponentName,
    total: totalMatch ? parseNum(totalMatch[1]!) : 0,
    wickets: totalMatch ? parseNum(totalMatch[2]!) : 0,
    extras: extrasMatch ? parseNum(extrasMatch[1]!) : 0,
    extrasByes: extrasMatch ? parseNum(extrasMatch[2]!) : 0,
    extrasLegByes: extrasMatch ? parseNum(extrasMatch[3]!) : 0,
    extrasWides: extrasMatch ? parseNum(extrasMatch[4]!) : 0,
    extrasNoBalls: extrasMatch ? parseNum(extrasMatch[5]!) : 0,
    oversCap,
    batters,
    didNotBat,
    bowlers,
  };
}

function parseMatchDate($: cheerio.CheerioAPI): string | null {
  const body = $("body").text();
  const monthPattern =
    "January|February|March|April|May|June|July|August|September|October|November|December";
  const m =
    body.match(
      new RegExp(`\\b(${monthPattern})\\s+(\\d{1,2}),[\\s\\S]{0,100}?(20\\d{2})\\b`, "i"),
    ) ??
    body.match(new RegExp(`\\b(${monthPattern})\\s+(\\d{1,2})\\b`, "i"));
  if (!m) return null;
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
  const month = monthNames[m[1]!.toLowerCase()];
  if (!month) return null;
  const year = m[3] ?? body.match(/World Cup\s+(20\d{2})/i)?.[1] ?? body.match(/\b(20\d{2})\b/)?.[1] ?? null;
  if (!year) return null;
  return `${month}/${m[2]}/${year}`;
}

function normalizeVenueLabel(venue: string): string {
  const comma = venue.indexOf(",");
  if (comma > 0) return venue.slice(0, comma).trim();
  return venue.trim();
}

function teamsFromTitle(title: string | null): [string, string] | null {
  if (!title) return null;
  const head = title.split(",")[0] ?? title;
  const parts = head.split(/\s+vs\s+/i);
  if (parts.length !== 2) return null;
  return [parts[0]!.trim(), parts[1]!.trim()];
}

function inferFormatLabel(title: string | null, maxOvers: number | null): string {
  const t = (title ?? "").toLowerCase();
  if (t.includes("championship") || t.includes("first class") || (maxOvers ?? 0) >= 90) {
    return "First Class";
  }
  if (t.includes("t20i") || t.includes("world cup") || t.includes("international")) return "T20I Major";
  if (maxOvers === 20 || t.includes("t20")) return "T20";
  if (t.includes("odi") || maxOvers === 50) return "ODI";
  return "T20";
}

export function isMultiInningsMatch(parsed: Pick<CricbuzzParsedMatch, "innings" | "maxOvers" | "title">): boolean {
  if (parsed.innings.length > 2) return true;
  if ((parsed.maxOvers ?? 0) >= 90) return true;
  const t = (parsed.title ?? "").toLowerCase();
  return /championship|first class|\btest\b|multi-day/.test(t);
}

function normalizeCricbuzzTeamLabel(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function parseCricbuzzTeamIdMap(html: string): Map<number, string> {
  const map = new Map<number, string>();
  const patterns = [
    /\\"teamId\\":(\d+),\\"teamName\\":\\"([^\\"]+)\\"/g,
    /"teamId":(\d+),"teamName":"([^"]+)"/g,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const id = Number(m[1]);
      if (!map.has(id)) map.set(id, normalizeCricbuzzTeamLabel(m[2]!));
    }
  }
  return map;
}

function opponentForTeam(teamName: string, pair: string[]): string {
  const key = teamName.toLowerCase();
  const other = pair.find((t) => t.toLowerCase() !== key);
  return other ?? "Opposition";
}

function parseInningsHeaderLabel(
  $: cheerio.CheerioAPI,
  cricbuzzTeamId: number,
  inningsNumber: number,
): { teamName: string | null; teamBattingInningsIndex: number | null } {
  const header = $(`#team-${cricbuzzTeamId}-innings-${inningsNumber}`);
  if (!header.length) return { teamName: null, teamBattingInningsIndex: null };

  const longLabel = header.find(".hidden.tb\\:block").first().text().replace(/\s+/g, " ").trim();
  const shortLabel = header.text().replace(/\s+/g, " ").trim();
  const label = longLabel || shortLabel;

  const ord = label.match(/(\d+)(?:st|nd|rd|th)\s+Innings/i);
  const nameMatch = label.match(/^(.+?)\s+\d+(?:st|nd|rd|th)\s+Innings/i);
  let teamName = nameMatch?.[1]?.trim() ?? null;
  if (teamName && /^[A-Z]{2,4}$/.test(teamName)) {
    const fromTitle = teamsFromTitle($("h1").first().text().split("- Scorecard")[0]?.trim() ?? null);
    if (fromTitle) {
      const abbr = teamName.toLowerCase();
      const hit = fromTitle.find((t) => t.toLowerCase().startsWith(abbr) || abbr.startsWith(t.slice(0, 3).toLowerCase()));
      if (hit) teamName = hit;
    }
  }

  return {
    teamName,
    teamBattingInningsIndex: ord ? parseInt(ord[1]!, 10) : null,
  };
}

function discoverScardInnings($: cheerio.CheerioAPI): {
  selector: string;
  inningsNumber: number;
  cricbuzzTeamId: number;
}[] {
  const found: { selector: string; inningsNumber: number; cricbuzzTeamId: number }[] = [];
  $("[id^='scard-team-']").each((_, el) => {
    const id = $(el).attr("id") ?? "";
    const m = id.match(/^scard-team-(\d+)-innings-(\d+)$/);
    if (!m) return;
    found.push({
      selector: `#${id}`,
      cricbuzzTeamId: parseInt(m[1]!, 10),
      inningsNumber: parseInt(m[2]!, 10),
    });
  });
  return found.sort((a, b) => a.inningsNumber - b.inningsNumber);
}

function parseVenue($: cheerio.CheerioAPI): string | null {
  let venue: string | null = null;
  $(".facts-row-grid, .grid.facts-row-grid").each((_, row) => {
    const text = $(row).text().replace(/\s+/g, " ");
    const vm = text.match(/Venue\s*([^P]+?)(?:Player|$)/i);
    if (vm?.[1]) venue = vm[1].trim();
  });
  if (venue) return normalizeVenueLabel(venue);
  const body = $("body").text();
  const m = body.match(/Venue[:\s]+([A-Za-z0-9\s,'-]+?)(?:\s{2,}|Time|Series|Match)/i);
  const raw = m?.[1]?.trim() ?? null;
  return raw ? normalizeVenueLabel(raw) : null;
}

function parseSquads(
  $: cheerio.CheerioAPI,
  teamNames: string[],
): Record<string, { name: string; cricbuzzPlayerId: string | null }[]> {
  const squads: Record<string, { name: string; cricbuzzPlayerId: string | null }[]> = {};
  const wanted = new Set(teamNames.map((t) => t.toLowerCase()));

  $("div.font-bold").each((_, el) => {
    const label = $(el).text().trim();
    if (!wanted.has(label.toLowerCase())) return;
    if (squads[label]) return;

    const container = $(el).closest("div.flex.flex-col, div.flex-col").first();
    const root = container.length ? container.parent() : $(el).parent().parent();
    const list: { name: string; cricbuzzPlayerId: string | null }[] = [];
    const seen = new Set<string>();
    root.find('a[href*="/profiles/"]').each((__, a) => {
      const href = $(a).attr("href") ?? "";
      const id = href.match(/profiles\/(\d+)/)?.[1] ?? null;
      if (!id || seen.has(id)) return;
      const title =
        $(a).attr("title")?.replace("View Profile Of ", "").trim() ||
        $(a).find("span").text().trim();
      if (!title || title === "View profile") return;
      seen.add(id);
      list.push({ name: title, cricbuzzPlayerId: id });
    });
    if (list.length >= 11) squads[label] = list.slice(0, 11);
  });
  return squads;
}

export function parseCricbuzzScorecardHtml(html: string, matchId: string): CricbuzzParsedMatch {
  const $ = cheerio.load(html);
  const title = $("h1").first().text().split("- Scorecard")[0]?.trim() ?? null;
  const teams = teamsFromTitle(title);
  const teamIdMap = parseCricbuzzTeamIdMap(html);
  const blocks = discoverScardInnings($);
  const teamPair = teams ?? [];
  const teamInningsCount = new Map<number, number>();

  const innings: CricbuzzInnings[] = [];
  for (const block of blocks) {
    const header = parseInningsHeaderLabel($, block.cricbuzzTeamId, block.inningsNumber);
    const fromId = teamIdMap.get(block.cricbuzzTeamId);
    const battingTeam =
      header.teamName ??
      fromId ??
      (block.inningsNumber === 1 ? teams?.[0] : block.inningsNumber === 2 ? teams?.[1] : undefined);
    const teamName = battingTeam ?? `Innings ${block.inningsNumber}`;
    const pair = teamPair.length >= 2 ? teamPair : teams ?? [teamName];
    const opponent = opponentForTeam(teamName, pair);
    const prev = teamInningsCount.get(block.cricbuzzTeamId) ?? 0;
    const teamBattingInningsIndex = header.teamBattingInningsIndex ?? prev + 1;
    teamInningsCount.set(block.cricbuzzTeamId, teamBattingInningsIndex);

    const parsed = parseInningsBlock($, block.selector, block.inningsNumber, opponent, teamName);
    if (parsed) {
      parsed.teamBattingInningsIndex = teamBattingInningsIndex;
      innings.push(parsed);
    }
  }

  const maxOvers = innings[0]?.oversCap ?? 20;
  const teamNames = innings.map((i) => i.teamName);
  const squads = parseSquads($, teamNames.length ? teamNames : (teams ?? []));

  return {
    cricbuzzMatchId: matchId,
    dateDisplay: parseMatchDate($),
    formatLabel: inferFormatLabel(title, maxOvers),
    maxOvers,
    venue: parseVenue($),
    host: teams?.[0] ?? innings[0]?.teamName ?? null,
    title,
    innings,
    squads,
  };
}

export function findBowler(
  bowlers: CricbuzzBowlLine[],
  playerName: string,
): CricbuzzBowlLine | undefined {
  const target = normalizePersonName(playerName);
  return bowlers.find((b) => {
    const n = normalizePersonName(b.name);
    return n === target || n.includes(target) || target.includes(n);
  });
}
