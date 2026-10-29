import { NextRequest, NextResponse } from "next/server";
import { discoverMatches } from "@/app/data/scrapeWorkbench";

export function GET(req: NextRequest) {
  const site = req.nextUrl.searchParams.get("site");
  const start = req.nextUrl.searchParams.get("start");
  const end = req.nextUrl.searchParams.get("end");

  if (!site || !start || !end) {
    return NextResponse.json({ error: "site, start, and end are required" }, { status: 400 });
  }

  try {
    const result = discoverMatches(site, start, end);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Discover failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
