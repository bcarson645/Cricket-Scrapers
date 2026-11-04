import { NextResponse } from "next/server";
import { fetchNvplayAusWidgetAuth } from "@/lib/scrapers/sites/nvplay-aus/widgetAuth";
import { NVPLAY_AUS_LIVE_URL } from "@/lib/scrapers/sites/nvplay-aus/config";

export async function GET() {
  try {
    const auth = await fetchNvplayAusWidgetAuth();
    return NextResponse.json({
      liveUrl: NVPLAY_AUS_LIVE_URL,
      auth,
      note:
        "Widget auth resolves w-api.ecb.nvplay.net. Scorecard JSON is fetched from /api/scorecard/{matchId} (match id uses c… prefix from #mc… URLs).",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "NV Play auth failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
