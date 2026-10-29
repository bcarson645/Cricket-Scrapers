import { NextRequest, NextResponse } from "next/server";
import { rowsToCsv } from "@/lib/scorecards/toCsv";
import { scrapeCricbuzzScorecard } from "@/lib/scrapers/sites/cricbuzz/scrape";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url query param required" }, { status: 400 });
  }
  const matchIdOverride = req.nextUrl.searchParams.get("matchId") ?? undefined;

  try {
    const { parsed, rows, match } = await scrapeCricbuzzScorecard(url, {
      matchIdOverride: matchIdOverride ?? undefined,
    });
    const format = req.nextUrl.searchParams.get("format");
    if (format === "csv") {
      return new NextResponse(rowsToCsv(rows), {
        headers: { "Content-Type": "text/csv; charset=utf-8" },
      });
    }
    return NextResponse.json({ match, parsed, rows, rowCount: rows.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Scrape failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
