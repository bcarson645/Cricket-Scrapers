import { NextRequest, NextResponse } from "next/server";
import { applyMappingRegistry } from "@/lib/mappings/apply";
import { loadMappingRegistry } from "@/lib/mappings/load";
import type { ExportRow } from "@/lib/scorecards/export-columns";
import { mergeExportRowsByDate } from "@/lib/scorecards/mergeRows";
import { rowsToCsv } from "@/lib/scorecards/toCsv";
import { nvplayEcbMatchUrlFromApiId } from "@/lib/scrapers/sites/nvplay-ecb/matchUrl";
import { scrapeNvplayEcbScorecard } from "@/lib/scrapers/sites/nvplay-ecb/scrape";

export const runtime = "nodejs";
export const maxDuration = 300;

type Body = {
  matchIds?: string[];
  matchIdOverrides?: Record<string, string | number>;
};

function resolveMatchUrl(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("http")) return trimmed;
  return nvplayEcbMatchUrlFromApiId(trimmed);
}

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
  const scraped: { matchId: string; date: string | null; rows: ExportRow[] }[] = [];
  const errors: { matchId: string; error: string }[] = [];

  for (const raw of ids) {
    try {
      const url = resolveMatchUrl(raw);
      const override = body.matchIdOverrides?.[raw] ?? body.matchIdOverrides?.[url];
      const { parsed, rows } = await scrapeNvplayEcbScorecard(url, {
        matchIdOverride: override,
        applyMappings: false,
      });
      const mapped = applyMappingRegistry(rows, parsed, registry, {
        matchIdOverride: override,
      });
      scraped.push({
        matchId: raw,
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

  const merged = mergeExportRowsByDate(
    scraped.map((s) => ({ cricbuzzMatchId: s.matchId, date: s.date, rows: s.rows })),
  );
  const format = req.nextUrl.searchParams.get("format");
  if (format === "csv") {
    return new NextResponse(rowsToCsv(merged), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="nvplay-ecb-scorecards.csv"',
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
