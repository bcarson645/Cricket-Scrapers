import { NextRequest, NextResponse } from "next/server";
import { discoverCricinfoMatchesByDateRange } from "@/lib/scrapers/sites/cricinfo/discoverSchedule";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const scorecardOnly = req.nextUrl.searchParams.get("scorecardOnly") !== "0";

  if (!from || !to) {
    return NextResponse.json(
      { error: "from and to query params required (YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  try {
    const result = await discoverCricinfoMatchesByDateRange({ from, to, scorecardOnly });
    return NextResponse.json({
      ...result,
      count: result.matches.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load Cricinfo schedule";
    const status = /must be|on or before/i.test(message) ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
