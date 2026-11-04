/** Build live site URL from NV Play API `MatchId` (with or without `c` prefix). */
export function nvplayAusMatchUrlFromApiId(matchId: string): string {
  const bare = matchId.replace(/^c/i, "");
  return `https://live.nvplay.com/play/?tab=m_scorecard#mc${bare}`;
}
