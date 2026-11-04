import { nvplayAusMatchUrlFromApiId } from "@/lib/scrapers/sites/nvplay-aus/urls";

export { nvplayAusMatchUrlFromApiId } from "@/lib/scrapers/sites/nvplay-aus/urls";

const NVPLAY_AUS_LIVE = /^https?:\/\/live\.nvplay\.com\/play\/?/i;

export function parseNvplayAusMatchIdFromUrl(input: string): string {
  const trimmed = input.trim();
  if (/^c[\da-f-]+$/i.test(trimmed) && trimmed.length > 30) {
    return trimmed.toLowerCase();
  }
  let hash = "";
  try {
    const u = new URL(trimmed.startsWith("http") ? trimmed : `https://live.nvplay.com/play/${trimmed}`);
    hash = u.hash.replace(/^#/, "");
  } catch {
    hash = trimmed.replace(/^#/, "");
  }
  const m = hash.match(/^(?:mc|c)([\da-f-]+)$/i);
  if (!m?.[1] || m[1].length < 30) {
    throw new Error(
      "Could not parse NV Play match id — use a live.nvplay.com/play URL with hash #mc… or #c…",
    );
  }
  return `c${m[1].toLowerCase()}`;
}

export function isNvplayAusMatchUrl(input: string): boolean {
  try {
    parseNvplayAusMatchIdFromUrl(input);
    return true;
  } catch {
    return false;
  }
}

export function normalizeNvplayAusMatchUrl(input: string): string {
  const matchId = parseNvplayAusMatchIdFromUrl(input);
  return nvplayAusMatchUrlFromApiId(matchId);
}

export function nvplayMatchUrlLooksLikeAus(input: string): boolean {
  return NVPLAY_AUS_LIVE.test(input.trim()) || /^#?(?:mc|c)[\da-f-]+$/i.test(input.trim());
}
