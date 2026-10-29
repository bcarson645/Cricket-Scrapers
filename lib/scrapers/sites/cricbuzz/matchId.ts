/** Match id from scorecard, live-scores, or bare numeric id. No cheerio / scrape deps. */
const CRICBUZZ_MATCH_ID =
  /cricbuzz\.com\/live-cricket-(?:scorecard|scores)\/(\d+)/i;

export function parseCricbuzzMatchId(input: string): string {
  const trimmed = input.trim();
  const fromUrl = trimmed.match(CRICBUZZ_MATCH_ID)?.[1];
  if (fromUrl) return fromUrl;
  if (/^\d+$/.test(trimmed)) return trimmed;
  throw new Error(`Could not parse Cricbuzz match id from: ${input}`);
}

export function normalizeCricbuzzScorecardUrl(input: string): string {
  const id = parseCricbuzzMatchId(input);
  return `https://www.cricbuzz.com/live-cricket-scorecard/${id}`;
}

export function isCricbuzzScoresUrl(input: string): boolean {
  return /cricbuzz\.com\/live-cricket-scores\//i.test(input.trim());
}
