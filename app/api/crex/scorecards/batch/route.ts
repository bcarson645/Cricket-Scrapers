import { NextRequest, NextResponse } from "next/server";
import { applyMappingRegistry } from "@/lib/mappings/apply";
import { loadMappingRegistry } from "@/lib/mappings/load";
import type { ExportRow } from "@/lib/scorecards/export-columns";
import { mergeExportRowsByDate } from "@/lib/scorecards/mergeRows";
import { rowsToCsv } from "@/lib/scorecards/toCsv";
import { normalizeCrexScorecardUrl } from "@/lib/scrapers/sites/crex/matchUrl";
import { scrapeCrexScorecard } from "@/lib/scrapers/sites/crex/scrape";

export const runtime = "nodejs";
export const maxDuration = 300;

type Body = {
  scorecardUrls?: string[];
  matchIdOverrides?: Record<string, string | number>;
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const urls = body.scorecardUrls?.map((u) => u.trim()).filter(Boolean) ?? [];
  if (urls.length === 0) {
    return NextResponse.json({ error: "scorecardUrls array required" }, { status: 400 });
  }

  const registry = loadMappingRegistry();
  const scraped: { matchId: string; date: string | null; rows: ExportRow[] }[] = [];
  const errors: { url: string; error: string }[] = [];

  for (const raw of urls) {
    try {
      const url = normalizeCrexScorecardUrl(raw);
      const override = body.matchIdOverrides?.[raw] ?? body.matchIdOverrides?.[url];
      const { parsed, rows } = await scrapeCrexScorecard(url, {
        matchIdOverride: override,
        applyMappings: false,
      });
      const mapped = applyMappingRegistry(rows, parsed, registry, {
        matchIdOverride: override,
      });
      scraped.push({
        matchId: parsed.cricbuzzMatchId,
        date: parsed.dateDisplay,
        rows: mapped,
      });
    } catch (e) {
      errors.push({
        url: raw,
        error: e instanceof Error ? e.message : "Scrape failed",
      });
    }
  }

  if (scraped.length === 0) {
    return NextResponse.json(
      {
        error: "No scorecards scraped",
        errors: errors.map((e) => ({ matchId: e.url, error: e.error })),
      },
      { status: 502 },
    );
  }

  const merged = mergeExportRowsByDate(
    scraped.map((s) => ({ cricbuzzMatchId: s.matchId, date: s.date, rows: s.rows })),
  );
  const format = req.nextUrl.searchParams.get("format");
  if (format === "csv") {
    return new NextResponse(rowsToCsv(merged), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="crex-scorecards.csv"',
      },
    });
  }

  return NextResponse.json({
    rowCount: merged.length,
    matchCount: scraped.length,
    errors,
    rows: merged,
  });
}
