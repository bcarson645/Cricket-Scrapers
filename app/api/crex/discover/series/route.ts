import { NextRequest, NextResponse } from "next/server";
import { discoverCrexSeriesMatches } from "@/lib/scrapers/sites/crex/discoverSeries";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url?.trim()) {
    return NextResponse.json(
      { error: "url query param required (Crex series URL from crex.com/series)" },
      { status: 400 },
    );
  }

  try {
    const result = await discoverCrexSeriesMatches(url);
    return NextResponse.json({
      seriesUrl: result.seriesUrl,
      seriesTitle: result.seriesTitle,
      count: result.matches.length,
      matches: result.matches,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Series discover failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
