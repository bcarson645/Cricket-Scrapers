import { NextResponse } from "next/server";
import { discoverCricbuzzRecentMatches } from "@/lib/scrapers/sites/cricbuzz/discoverRecent";
import { fetchCricbuzzHtml } from "@/lib/scrapers/sites/cricbuzz/scrape";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  try {
    const matches = await discoverCricbuzzRecentMatches(fetchCricbuzzHtml);
    return NextResponse.json({
      source: "https://www.cricbuzz.com/cricket-match/live-scores/recent-matches",
      count: matches.length,
      matches,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Discover failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
