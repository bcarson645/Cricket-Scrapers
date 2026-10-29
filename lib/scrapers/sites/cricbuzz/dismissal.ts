/**
 * Map Cricbuzz dismissal text to export labels (Fielder Catch, Keeper Catch, Bowled, …).
 */
export function mapCricbuzzDismissal(raw: string, wicketKeeperNames: string[]): string {
  const text = raw.trim();
  if (!text) return "dnb";
  const lower = text.toLowerCase();
  if (lower === "not out" || lower === "retired not out") return "not out";

  if (lower.startsWith("c ") && lower.includes(" b ")) {
    const catcher = text.slice(2, text.toLowerCase().indexOf(" b ")).trim();
    const catcherNorm = normalizePersonName(catcher);
    const isKeeper = wicketKeeperNames.some(
      (wk) => catcherNorm.includes(normalizePersonName(wk)) || normalizePersonName(wk).includes(catcherNorm),
    );
    if (isKeeper || catcher.includes("(wk)") || catcher.includes("†")) return "Keeper Catch";
    return "Fielder Catch";
  }

  if (lower.startsWith("b ") || lower === "bowled") return "Bowled";
  if (lower.startsWith("lbw")) return "LBW";
  if (lower.includes("run out")) return "Run Out";
  if (lower.startsWith("st ")) return "Stumped";
  return text;
}

export function normalizePersonName(name: string): string {
  return name
    .replace(/\(c\)|\(wk\)|†/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
