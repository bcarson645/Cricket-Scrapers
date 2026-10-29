import { NextRequest, NextResponse } from "next/server";
import { applyMappingRegistry } from "@/lib/mappings/apply";
import { loadMappingRegistry } from "@/lib/mappings/load";
import type { ExportRow } from "@/lib/scorecards/export-columns";
import { mergeExportRowsByDate } from "@/lib/scorecards/mergeRows";
import { rowsToCsv } from "@/lib/scorecards/toCsv";
import { assertCricbuzzMatchId } from "@/lib/scrapers/sites/cricbuzz/discoverRecent";
import { scrapeCricbuzzScorecard } from "@/lib/scrapers/sites/cricbuzz/scrape";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  matchIds?: string[];
  matchIdOverrides?: Record<string, string | number>;
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const ids = body.matchIds?.map((id) => id.trim()).filter(Boolean) ?? [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "matchIds array required" }, { status: 400 });
  }

  const registry = loadMappingRegistry();
  const scraped: { cricbuzzMatchId: string; date: string | null; rows: ExportRow[] }[] = [];
  const errors: { matchId: string; error: string }[] = [];

  for (const raw of ids) {
    try {
      const matchId = assertCricbuzzMatchId(raw);
      const override = body.matchIdOverrides?.[matchId] ?? body.matchIdOverrides?.[raw];
      const { parsed, rows } = await scrapeCricbuzzScorecard(matchId, {
        matchIdOverride: override,
        applyMappings: false,
      });
      const mapped = applyMappingRegistry(rows, parsed, registry, {
        matchIdOverride: override,
      });
      scraped.push({
        cricbuzzMatchId: matchId,
        date: parsed.dateDisplay,
        rows: mapped,
      });
    } catch (e) {
      errors.push({
        matchId: raw,
        error: e instanceof Error ? e.message : "Scrape failed",
      });
    }
  }

  if (scraped.length === 0) {
    return NextResponse.json({ error: "No scorecards scraped", errors }, { status: 502 });
  }

  const merged = mergeExportRowsByDate(scraped);
  const format = req.nextUrl.searchParams.get("format");
  if (format === "csv") {
    return new NextResponse(rowsToCsv(merged), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="cricbuzz-scorecards.csv"',
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
