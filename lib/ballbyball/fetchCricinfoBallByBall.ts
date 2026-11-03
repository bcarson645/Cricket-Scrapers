import {
  ballByBallRowsToTsv,
  buildBallByBallFromCricinfoScorecard,
} from "@/lib/ballbyball/buildFromCricinfoScorecard";
import type { BallByBallRow } from "@/lib/ballbyball/export-columns";
import {
  commentaryUrlFromScorecardUrl,
  extractBallsFromCommentaryHtml,
} from "@/lib/ballbyball/extractBallsFromCommentaryHtml";
import type { CricinfoCommentBall } from "@/lib/ballbyball/fetchCricinfoComments";
import {
  fetchCricinfoCommentBalls,
  parseSeriesAndMatchFromScorecardUrl,
} from "@/lib/ballbyball/fetchCricinfoComments";
import { BALL_BY_BALL_CSV_HEADERS } from "@/lib/ballbyball/export-columns";
import { fetchCricinfoAppPageData } from "@/lib/scrapers/sites/cricinfo/fetchPageData";
import {
  normalizeCricinfoScorecardUrl,
  parseCricinfoMatchObjectId,
} from "@/lib/scrapers/sites/cricinfo/matchId";

export type CricinfoBallByBallSource = "comments-api" | "commentary-html-embed" | "scorecard-inningOvers";

export type CricinfoBallByBallResult = {
  matchId: string;
  sourceUrl: string;
  source: CricinfoBallByBallSource;
  rows: BallByBallRow[];
  rowCount: number;
  byInnings: Record<number, number>;
  warning?: string;
};

function countByInnings(rows: BallByBallRow[]): Record<number, number> {
  const inningsCol = BALL_BY_BALL_CSV_HEADERS.indexOf("innings");
  const byInn: Record<number, number> = {};
  for (const row of rows) {
    const inn = Number(row[inningsCol]);
    if (!Number.isFinite(inn)) continue;
    byInn[inn] = (byInn[inn] ?? 0) + 1;
  }
  return byInn;
}

export async function fetchCricinfoBallByBall(
  inputUrl: string,
  options?: { authToken?: string },
): Promise<CricinfoBallByBallResult> {
  const sourceUrl = normalizeCricinfoScorecardUrl(inputUrl);
  const matchId = parseCricinfoMatchObjectId(sourceUrl);
  const { seriesId } = parseSeriesAndMatchFromScorecardUrl(sourceUrl);
  const { data } = await fetchCricinfoAppPageData(sourceUrl);

  let balls: CricinfoCommentBall[] | undefined;
  let source: CricinfoBallByBallSource = "scorecard-inningOvers";
  let warning: string | undefined;

  const authToken =
    options?.authToken?.trim() || process.env.CRICINFO_HSCI_AUTH_TOKEN?.trim() || "";

  if (authToken) {
    balls = await fetchCricinfoCommentBalls({
      seriesId,
      matchId,
      authToken,
      referer: commentaryUrlFromScorecardUrl(sourceUrl),
    });
    source = "comments-api";
  } else {
    balls = await extractBallsFromCommentaryHtml(commentaryUrlFromScorecardUrl(sourceUrl));
    source = "commentary-html-embed";
    if (balls.length < 100) {
      warning = `Only ${balls.length} deliveries found in the commentary page HTML. For a full match, set CRICINFO_HSCI_AUTH_TOKEN on the server or paste a short-lived token from DevTools (Network → comments → x-hsci-auth-token).`;
    }
  }

  const rows = buildBallByBallFromCricinfoScorecard(data, matchId, balls);
  const byInnings = countByInnings(rows);

  if (rows.length === 0) {
    warning = warning ?? "No ball-by-ball rows were produced for this match.";
  }

  return {
    matchId,
    sourceUrl,
    source,
    rows,
    rowCount: rows.length,
    byInnings,
    warning,
  };
}

export function cricinfoBallByBallToTsv(rows: BallByBallRow[]): string {
  return ballByBallRowsToTsv(rows);
}
