import { NextRequest, NextResponse } from "next/server";
import { parseAvailabilityCategories } from "@/lib/scrapers/sites/countycrickethub/categories";
import {
  loadGroupedAvailabilityNews,
  type CchSite,
} from "@/lib/scrapers/sites/countycrickethub/availabilityNews";
import {
  resolveAvailabilityTimeframe,
  type TimeframePreset,
} from "@/lib/scrapers/sites/countycrickethub/timeframe";

export const runtime = "nodejs";
export const maxDuration = 60;

function parseSite(value: string | null): CchSite {
  return value?.toUpperCase() === "F" ? "F" : "M";
}

const PRESETS: TimeframePreset[] = ["7d", "30d", "90d", "365d", "all", "custom"];

function parsePreset(value: string | null): TimeframePreset {
  const p = value?.toLowerCase();
  if (p && PRESETS.includes(p as TimeframePreset)) return p as TimeframePreset;
  return "30d";
}

export async function GET(req: NextRequest) {
  const site = parseSite(req.nextUrl.searchParams.get("site"));
  const preset = parsePreset(req.nextUrl.searchParams.get("preset"));
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const categoriesParam = req.nextUrl.searchParams.get("categories");

  try {
    const timeframe = resolveAvailabilityTimeframe(preset, from, to);
    const categories = parseAvailabilityCategories(categoriesParam);
    const result = await loadGroupedAvailabilityNews(site, timeframe, categories);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load availability news";
    const status = /invalid|must be/i.test(message) ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
