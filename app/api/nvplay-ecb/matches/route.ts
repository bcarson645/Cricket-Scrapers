import { NextRequest, NextResponse } from "next/server";
import { discoverNvplayEcbMatches } from "@/lib/scrapers/sites/nvplay-ecb/discoverMatches";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const completeOnly = req.nextUrl.searchParams.get("completeOnly") !== "0";

  if (!from || !to) {
    return NextResponse.json(
      { error: "from and to query params required (YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  try {
    const result = await discoverNvplayEcbMatches({ from, to, completeOnly });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load NV Play match list";
    const status = /must be|on or before/i.test(message) ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
