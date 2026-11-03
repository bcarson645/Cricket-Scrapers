const HSCI_BASE = "https://hs-consumer-api.espncricinfo.com/v1/pages/match/comments";

export type CricinfoCommentBall = Record<string, unknown> & {
  id?: number;
  inningNumber?: number;
  oversActual?: number;
  overNumber?: number;
  ballNumber?: number;
  totalRuns?: number;
  batsmanRuns?: number;
  isFour?: boolean;
  isSix?: boolean;
  isWicket?: boolean;
  dismissalType?: number | null;
  byes?: number;
  legbyes?: number;
  wides?: number;
  noballs?: number;
  batsmanPlayerId?: number;
  nonStrikerPlayerId?: number;
  bowlerPlayerId?: number;
  outPlayerId?: number | null;
  totalInningRuns?: number;
  totalInningWickets?: number;
  title?: string;
  dismissalText?: { short?: string; long?: string } | null;
  batsmanStatText?: { statInfo?: string };
};

type CommentsPage = {
  comments?: CricinfoCommentBall[];
  nextInningOver?: number | null;
};

export async function fetchCricinfoCommentBalls(options: {
  seriesId: string;
  matchId: string;
  authToken: string;
  referer: string;
  maxInnings?: number;
}): Promise<CricinfoCommentBall[]> {
  const { seriesId, matchId, authToken, referer, maxInnings = 4 } = options;
  const byId = new Map<number, CricinfoCommentBall>();

  for (let inningNumber = 1; inningNumber <= maxInnings; inningNumber++) {
    let fromInningOver = 0;
    let emptyStreak = 0;
    for (let page = 0; page < 80; page++) {
      const url = `${HSCI_BASE}?lang=en&seriesId=${seriesId}&matchId=${matchId}&inningNumber=${inningNumber}&commentType=ALL&fromInningOver=${fromInningOver}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
          Referer: referer,
          Origin: "https://www.espncricinfo.com",
          "x-hsci-auth-token": authToken,
        },
      });
      if (!res.ok) {
        throw new Error(`Cricinfo comments HTTP ${res.status} (inning ${inningNumber}, from ${fromInningOver})`);
      }
      const json = (await res.json()) as CommentsPage;
      const batch = json.comments ?? [];
      if (batch.length === 0) {
        emptyStreak += 1;
        if (emptyStreak >= 2) break;
      } else {
        emptyStreak = 0;
        for (const c of batch) {
          if (c.id != null) byId.set(c.id, c);
        }
      }
      if (json.nextInningOver == null) break;
      fromInningOver = json.nextInningOver;
    }
  }

  return [...byId.values()].sort(
    (a, b) =>
      (Number(a.inningNumber) - Number(b.inningNumber)) ||
      (Number(a.oversActual) - Number(b.oversActual)),
  );
}

export function parseSeriesAndMatchFromScorecardUrl(url: string): { seriesId: string; matchId: string } {
  const m = url.match(/series\/[^/]+-(\d+)\/[^/]+-(\d+)\//i);
  if (!m?.[1] || !m?.[2]) {
    throw new Error("Could not parse seriesId/matchId from Cricinfo URL");
  }
  return { seriesId: m[1], matchId: m[2] };
}
