import { NVPLAY_AUS_CUSTOMER_ID, NVPLAY_AUS_LIVE_URL } from "@/lib/scrapers/sites/nvplay-aus/config";
import { fetchNvplayAusWidgetAuth } from "@/lib/scrapers/sites/nvplay-aus/widgetAuth";
import { nvplayScorecardApiIds } from "@/lib/scrapers/sites/nvplay-aus/scorecardId";

export type {
  NvplayBattingCardLine,
  NvplayBowlingCardLine,
  NvplayInning,
  NvplayScorecardPayload,
} from "@/lib/scrapers/sites/nvplay-ecb/fetchScorecard";

import type { NvplayScorecardPayload } from "@/lib/scrapers/sites/nvplay-ecb/fetchScorecard";

let cachedApiBase: string | null = null;

async function apiBaseUrl(): Promise<string> {
  if (cachedApiBase) return cachedApiBase;
  const auth = await fetchNvplayAusWidgetAuth();
  cachedApiBase = auth.apiBaseUrl.replace(/\/$/, "");
  return cachedApiBase;
}

const NV_FETCH_HEADERS = {
  Accept: "application/json",
  Origin: NVPLAY_AUS_LIVE_URL.replace(/\/$/, ""),
  Referer: `${NVPLAY_AUS_LIVE_URL}?tab=m_scorecard`,
};

export async function fetchNvplayAusScorecard(matchId: string): Promise<{
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
      "NV Play scorecard is not available for this match (empty API response). Confirm the game has a published scorecard on live.nvplay.com/play.",
    );
  }
  throw new Error("NV Play scorecard JSON has no innings");
}

export async function fetchNvplayAusMatchListRows(): Promise<
  import("@/lib/scrapers/sites/nvplay-ecb/discoverMatches").NvplayMatchListRow[]
> {
  const auth = await fetchNvplayAusWidgetAuth();
  const base = auth.apiBaseUrl.replace(/\/$/, "");
  const url = `${base}/api/matchlist?customerId=${NVPLAY_AUS_CUSTOMER_ID}`;
  const res = await fetch(url, { headers: NV_FETCH_HEADERS, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`NV Play match list HTTP ${res.status}`);
  }
  const rows = (await res.json()) as import("@/lib/scrapers/sites/nvplay-ecb/discoverMatches").NvplayMatchListRow[];
  if (!Array.isArray(rows)) {
    throw new Error("NV Play match list returned non-array JSON");
  }
  return rows;
}
