import { normalizePersonName } from "@/lib/scrapers/sites/cricbuzz/dismissal";

/** Fielder credited with a catch from scorecard dismissal text, or null. */
export function fielderFromCatchDismissal(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  const lower = text.toLowerCase();

  if (lower.startsWith("c ") && lower.includes(" b ")) {
    const catcher = text.slice(2, lower.indexOf(" b ")).trim();
    if (!catcher) return null;
    if (catcher === "&" || catcher.toLowerCase() === "and") {
      return text.slice(lower.indexOf(" b ") + 3).trim() || null;
    }
    return catcher;
  }

  return null;
}

export function countMatchCatchesFromInnings(
  innings: { batters: { dismissalRaw: string }[] }[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const inn of innings) {
    for (const b of inn.batters) {
      const fielder = fielderFromCatchDismissal(b.dismissalRaw);
      if (!fielder) continue;
      const key = normalizePersonName(fielder);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

function namesMatch(a: string, b: string): boolean {
  const na = normalizePersonName(a);
  const nb = normalizePersonName(b);
  if (na === nb || na.includes(nb) || nb.includes(na)) return true;

  const ta = na.split(" ").filter(Boolean);
  const tb = nb.split(" ").filter(Boolean);
  if (ta.length < 2 || tb.length < 2) return false;
  const la = ta[ta.length - 1]!;
  const lb = tb[tb.length - 1]!;
  if (la !== lb) return false;
  const fa = ta[0]!;
  const fb = tb[0]!;
  return fa.startsWith(fb) || fb.startsWith(fa) || fa[0] === fb[0];
}

/** Match-level catch total for a squad member name. */
export function catchCountForPlayer(playerName: string, counts: Map<string, number>): number {
  for (const [fielderKey, n] of counts) {
    if (namesMatch(playerName, fielderKey)) return n;
  }
  return 0;
}
