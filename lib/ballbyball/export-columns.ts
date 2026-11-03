/** Ball-by-ball export columns (one row per legal/delivery event). */
export const BALL_BY_BALL_CSV_HEADERS = [
  "matchID",
  "date",
  "competition",
  "team1",
  "team2",
  "venue",
  "host",
  "battingTeamName",
  "innings",
  "ballRuns",
  "ballWkt",
  "cumRuns",
  "cumWkts",
  "bowlerName",
  "batsmanName",
  "bat1CumulativeRuns",
  "bat1CumulativeBalls",
  "bat1CumulativeFours",
  "bat1CumulativeSixes",
  "otherBatsmanName",
  "bat2CumulativeRuns",
  "bat2CumulativeBalls",
  "bat2CumulativeFours",
  "bat2CumulativeSixes",
  "ballsRem",
  "target",
  "ballNumber",
  "overNumber",
  "powerSurge",
  "maiden",
  "noBall",
  "wide",
  "byes",
  "legByes",
  "overWickets",
  "overRuns",
  "ball",
  "deliv",
  "ballWicket",
  "bowlerWicket",
  "wicketType",
  "wicketBowler",
  "wicketBatsman",
] as const;

export type BallByBallRow = (string | number | null)[];

export function emptyBallByBallRow(): BallByBallRow {
  return BALL_BY_BALL_CSV_HEADERS.map(() => null);
}

export function setBallCol(row: BallByBallRow, header: (typeof BALL_BY_BALL_CSV_HEADERS)[number], value: string | number | null): void {
  const i = BALL_BY_BALL_CSV_HEADERS.indexOf(header);
  if (i >= 0) row[i] = value;
}
