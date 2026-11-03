import { NVPLAY_ECB_CUSTOMER_ID } from "@/lib/scrapers/sites/nvplay-ecb/config";
import { fetchNvplayEcbWidgetAuth } from "@/lib/scrapers/sites/nvplay-ecb/widgetAuth";

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

export async function fetchNvplayEcbScorecard(matchId: string): Promise<{
  matchId: string;
  apiBaseUrl: string;
  data: NvplayScorecardPayload;
}> {
  const base = await apiBaseUrl();
  const id = matchId.startsWith("c") ? matchId : `c${matchId.replace(/^mc/i, "")}`;
  const url = `${base}/api/scorecard/${id}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`NV Play scorecard HTTP ${res.status}${body ? `: ${body.slice(0, 120)}` : ""}`);
  }
  const text = await res.text();
  if (!text.trim()) {
    throw new Error("NV Play scorecard returned empty body (Bearer token may be required for this match)");
  }
  const data = JSON.parse(text) as NvplayScorecardPayload;
  if (!data.Innings?.length) {
    throw new Error("NV Play scorecard JSON has no innings");
  }
  return { matchId: id, apiBaseUrl: base, data };
}

export async function fetchNvplayEcbMatchListSummary(matchId: string): Promise<Record<string, unknown> | null> {
  const base = await apiBaseUrl();
  const url = `${base}/api/matchlist?customerId=${NVPLAY_ECB_CUSTOMER_ID}`;
  const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) return null;
  const items = (await res.json()) as Record<string, unknown>[];
  return items.find((x) => String(x.MatchId ?? "").toLowerCase() === matchId.toLowerCase()) ?? null;
}
