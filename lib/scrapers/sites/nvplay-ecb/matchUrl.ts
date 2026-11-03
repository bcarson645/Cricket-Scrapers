import { nvplayEcbMatchUrlFromApiId } from "@/lib/scrapers/sites/nvplay-ecb/urls";

export { nvplayEcbMatchUrlFromApiId } from "@/lib/scrapers/sites/nvplay-ecb/urls";

const NVPLAY_ECB_LIVE = /^https?:\/\/live\.nvplay\.com\/ecb\/?/i;

/** Hash fragment `#mc…` or `#c…` on live.nvplay.com/ecb URLs. */
export function parseNvplayEcbMatchIdFromUrl(input: string): string {
  const trimmed = input.trim();
  if (/^c[\da-f-]+$/i.test(trimmed) && trimmed.length > 30) {
    return trimmed.toLowerCase();
  }
  let hash = "";
  try {
    const u = new URL(trimmed.startsWith("http") ? trimmed : `https://live.nvplay.com/ecb/${trimmed}`);
    hash = u.hash.replace(/^#/, "");
  } catch {
    hash = trimmed.replace(/^#/, "");
  }
  const m = hash.match(/^(?:mc|c)([\da-f-]+)$/i);
  if (!m?.[1] || m[1].length < 30) {
    throw new Error(
      "Could not parse NV Play match id — use a live.nvplay.com/ecb URL with hash #mc… or #c…",
    );
  }
  return `c${m[1].toLowerCase()}`;
}

export function isNvplayEcbMatchUrl(input: string): boolean {
  try {
    parseNvplayEcbMatchIdFromUrl(input);
    return true;
  } catch {
    return false;
  }
}

export function normalizeNvplayEcbMatchUrl(input: string): string {
  const matchId = parseNvplayEcbMatchIdFromUrl(input);
  return nvplayEcbMatchUrlFromApiId(matchId);
}

export function nvplayMatchUrlLooksLikeEcb(input: string): boolean {
  return NVPLAY_ECB_LIVE.test(input.trim()) || /^#?(?:mc|c)[\da-f-]+$/i.test(input.trim());
}
