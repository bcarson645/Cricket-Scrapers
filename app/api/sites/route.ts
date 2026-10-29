import { NextResponse } from "next/server";
import { listSiteIds, getSiteAdapter } from "@/lib/scrapers/registry";

export function GET() {
  const sites = listSiteIds().map((id) => {
    const a = getSiteAdapter(id);
    return { id, label: a.label };
  });
  return NextResponse.json({ sites });
}
