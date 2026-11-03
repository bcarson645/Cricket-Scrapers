import { NextRequest, NextResponse } from "next/server";
import {
  cchPlayersToCsv,
  fetchAllCchPlayerProfiles,
  fetchCchPlayerInfo,
} from "@/lib/scrapers/sites/countycrickethub/playerRoster";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const playerIdParam = req.nextUrl.searchParams.get("playerId");
  if (playerIdParam) {
    const playerId = Number(playerIdParam);
    if (!Number.isFinite(playerId)) {
      return NextResponse.json({ error: "Invalid playerId" }, { status: 400 });
    }
    const raw = await fetchCchPlayerInfo(playerId);
    if (!raw) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }
    const profiles = await fetchAllCchPlayerProfiles({ site: "both" });
    const match = profiles.find((p) => p.playerId === playerId);
    return NextResponse.json({ player: match ?? raw });
  }

  const siteParam = req.nextUrl.searchParams.get("site");
  const site =
    siteParam === "F" ? "F" : siteParam === "M" ? "M" : siteParam === "both" ? "both" : "both";

  try {
    const players = await fetchAllCchPlayerProfiles({ site });
    const format = req.nextUrl.searchParams.get("format");
    if (format === "csv") {
      return new NextResponse(cchPlayersToCsv(players), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="cch-players.csv"',
        },
      });
    }
    return NextResponse.json({
      count: players.length,
      site,
      sample: players.slice(0, 5),
      players,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
