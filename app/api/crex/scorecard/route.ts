import { NextRequest, NextResponse } from "next/server";
import { rowsToCsv } from "@/lib/scorecards/toCsv";
import { scrapeCrexScorecard } from "@/lib/scrapers/sites/crex/scrape";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url query param required" }, { status: 400 });
  }
  const matchIdOverride = req.nextUrl.searchParams.get("matchId") ?? undefined;

  try {
    const { parsed, rows, sourceUrl, fetchedFrom } = await scrapeCrexScorecard(url, {
      matchIdOverride: matchIdOverride ?? undefined,
    });
    const format = req.nextUrl.searchParams.get("format");
    if (format === "csv") {
      return new NextResponse(rowsToCsv(rows), {
        headers: { "Content-Type": "text/csv; charset=utf-8" },
      });
    }
    return NextResponse.json({
      parsed,
      rows,
      rowCount: rows.length,
      sourceUrl,
      fetchedFrom,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Scrape failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
