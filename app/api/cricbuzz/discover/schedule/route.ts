import { NextRequest, NextResponse } from "next/server";
import { discoverCricbuzzMatchesByDateRange } from "@/lib/scrapers/sites/cricbuzz/discoverSchedule";
import { fetchCricbuzzHtml } from "@/lib/scrapers/sites/cricbuzz/scrape";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "from and to query params required (YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  try {
    const result = await discoverCricbuzzMatchesByDateRange({ from, to }, fetchCricbuzzHtml);
    return NextResponse.json({
      ...result,
      count: result.matches.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load Cricbuzz schedule";
    const status = /must be|on or before/i.test(message) ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
