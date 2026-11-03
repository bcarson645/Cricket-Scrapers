import { NextRequest, NextResponse } from "next/server";
import {
  cricinfoBallByBallToTsv,
  fetchCricinfoBallByBall,
} from "@/lib/ballbyball/fetchCricinfoBallByBall";
import { BALL_BY_BALL_CSV_HEADERS } from "@/lib/ballbyball/export-columns";

export const runtime = "nodejs";
export const maxDuration = 120;

function previewRows(result: Awaited<ReturnType<typeof fetchCricinfoBallByBall>>, limit: number) {
  const inningsIdx = BALL_BY_BALL_CSV_HEADERS.indexOf("innings");
  const delivIdx = BALL_BY_BALL_CSV_HEADERS.indexOf("deliv");
  const cumRunsIdx = BALL_BY_BALL_CSV_HEADERS.indexOf("cumRuns");
  const cumWktsIdx = BALL_BY_BALL_CSV_HEADERS.indexOf("cumWkts");
  const bowlerIdx = BALL_BY_BALL_CSV_HEADERS.indexOf("bowlerName");
  const batterIdx = BALL_BY_BALL_CSV_HEADERS.indexOf("batsmanName");
  const ballRunsIdx = BALL_BY_BALL_CSV_HEADERS.indexOf("ballRuns");
  const ballWktIdx = BALL_BY_BALL_CSV_HEADERS.indexOf("ballWkt");

  return result.rows.slice(0, limit).map((row) => ({
    innings: row[inningsIdx],
    deliv: row[delivIdx],
    cumRuns: row[cumRunsIdx],
    cumWkts: row[cumWktsIdx],
    bowlerName: row[bowlerIdx],
    batsmanName: row[batterIdx],
    ballRuns: row[ballRunsIdx],
    ballWkt: row[ballWktIdx],
  }));
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url query param required" }, { status: 400 });
  }

  const authToken =
    req.headers.get("x-hsci-auth-token") ??
    req.nextUrl.searchParams.get("authToken") ??
    undefined;

  try {
    const result = await fetchCricinfoBallByBall(url, { authToken: authToken ?? undefined });
    const format = req.nextUrl.searchParams.get("format");
    if (format === "tsv") {
      const filename = `ball-by-ball-${result.matchId}.tsv`;
      return new NextResponse(cricinfoBallByBallToTsv(result.rows), {
        headers: {
          "Content-Type": "text/tab-separated-values; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const previewLimit = Math.min(
      50,
      Math.max(0, Number(req.nextUrl.searchParams.get("preview")) || 25),
    );

    return NextResponse.json({
      matchId: result.matchId,
      sourceUrl: result.sourceUrl,
      source: result.source,
      rowCount: result.rowCount,
      byInnings: result.byInnings,
      warning: result.warning,
      headers: BALL_BY_BALL_CSV_HEADERS,
      preview: previewRows(result, previewLimit),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ball-by-ball fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
