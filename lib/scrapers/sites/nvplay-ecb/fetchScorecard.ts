import { NVPLAY_ECB_CUSTOMER_ID, NVPLAY_ECB_LIVE_URL } from "@/lib/scrapers/sites/nvplay-ecb/config";
import { fetchNvplayEcbWidgetAuth } from "@/lib/scrapers/sites/nvplay-ecb/widgetAuth";
import { nvplayScorecardApiIds } from "@/lib/scrapers/sites/nvplay-ecb/scorecardId";

export type NvplayBattingCardLine = {
  Id?: string;
  PlayerName?: string;
  HasBatted?: boolean;
  HowOut?: string;
  IsDismissed?: boolean;
  Runs?: number;
  Balls?: number;
  Fours?: number;
  Sixes?: number;
  IsSummary?: boolean;
};

export type NvplayBowlingCardLine = {
  Id?: string;
  PlayerName?: string;
  Overs?: string;
  Maidens?: number;
  Runs?: number;
  Wickets?: number;
  Wides?: number;
  NoBalls?: number;
};

export type NvplayInning = {
  BattingTeamName?: string;
  Score?: string;
  TotalRuns?: number;
  TotalWickets?: number;
  TotalExtras?: number;
  TotalByes?: number;
  TotalLegByes?: number;
  MaxOvers?: number | null;
  BattingCard?: NvplayBattingCardLine[];
  BowlingCard?: NvplayBowlingCardLine[];
};

export type NvplayScorecardPayload = {
  Match?: Record<string, unknown>;
  Innings?: NvplayInning[];
};

let cachedApiBase: string | null = null;

async function apiBaseUrl(): Promise<string> {
  if (cachedApiBase) return cachedApiBase;
  const auth = await fetchNvplayEcbWidgetAuth();
  cachedApiBase = auth.apiBaseUrl.replace(/\/$/, "");
  return cachedApiBase;
}

const NV_FETCH_HEADERS = {
  Accept: "application/json",
  Origin: NVPLAY_ECB_LIVE_URL.replace(/\/$/, ""),
  Referer: `${NVPLAY_ECB_LIVE_URL}?tab=m_scorecard`,
};

export async function fetchNvplayEcbScorecard(matchId: string): Promise<{
  matchId: string;
  apiBaseUrl: string;
  data: NvplayScorecardPayload;
}> {
  const base = await apiBaseUrl();
  const candidates = nvplayScorecardApiIds(matchId);
  if (candidates.length === 0) {
    throw new Error("NV Play match id is empty");
  }

  let lastHttp = 0;
  let lastEmpty = false;

  for (const id of candidates) {
    const url = `${base}/api/scorecard/${id}`;
    const res = await fetch(url, { headers: NV_FETCH_HEADERS, cache: "no-store" });
    lastHttp = res.status;
    if (!res.ok) {
      if (res.status === 404) continue;
      const body = await res.text().catch(() => "");
      throw new Error(`NV Play scorecard HTTP ${res.status}${body ? `: ${body.slice(0, 120)}` : ""}`);
    }
    const text = await res.text();
    if (!text.trim()) {
      lastEmpty = true;
      continue;
    }
    const data = JSON.parse(text) as NvplayScorecardPayload;
    if (!data.Innings?.length) {
      continue;
    }
    return { matchId: id, apiBaseUrl: base, data };
  }

  if (lastEmpty || lastHttp === 204) {
    throw new Error(
      "NV Play scorecard is not available for this match (empty API response). Use an ECB county match on live.nvplay.com/ecb, or confirm the game has a published scorecard.",
    );
  }
  throw new Error("NV Play scorecard JSON has no innings");
}

export async function fetchNvplayEcbMatchListSummary(matchId: string): Promise<Record<string, unknown> | null> {
  const base = await apiBaseUrl();
  const url = `${base}/api/matchlist?customerId=${NVPLAY_ECB_CUSTOMER_ID}`;
  const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) return null;
  const items = (await res.json()) as Record<string, unknown>[];
  return items.find((x) => String(x.MatchId ?? "").toLowerCase() === matchId.toLowerCase()) ?? null;
}
