/** NV Play scorecard URLs use different id shapes (e.g. `c552…` vs bare `009c…`). */
export function nvplayScorecardApiIds(matchId: string): string[] {
  const trimmed = matchId.trim();
  if (!trimmed) return [];
  const lower = trimmed.toLowerCase();
  const bare = lower.replace(/^c(?=[0-9a-f-]{30,})/i, "").replace(/^mc/i, "");
  const out: string[] = [];
  const add = (id: string) => {
    const v = id.trim();
    if (v && !out.includes(v)) out.push(v);
  };
  add(trimmed);
  add(lower);
  if (bare !== lower) add(bare);
  if (!lower.startsWith("c")) add(`c${bare}`);
  return out;
}
