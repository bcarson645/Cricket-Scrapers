/** Build live site URL from NV Play API `MatchId` (with or without `c` prefix). */
export function nvplayEcbMatchUrlFromApiId(matchId: string): string {
  const bare = matchId.trim().replace(/^c/i, "");
  return `https://live.nvplay.com/ecb/?tab=m_scorecard#mc${bare}`;
}
