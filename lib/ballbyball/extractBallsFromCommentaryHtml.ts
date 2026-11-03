import type { CricinfoCommentBall } from "@/lib/ballbyball/fetchCricinfoComments";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** Best-effort parse of embedded ball JSON from ball-by-ball HTML (usually incomplete). */
export async function extractBallsFromCommentaryHtml(commentaryUrl: string): Promise<CricinfoCommentBall[]> {
  const html = await fetch(commentaryUrl, { headers: { "User-Agent": UA } }).then((r) => r.text());
  const byId = new Map<number, CricinfoCommentBall>();
  const re = /\{"_uid":\d+,"id":(\d+),/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const start = m.index;
    let depth = 0;
    let end = start;
    for (let i = start; i < html.length; i++) {
      if (html[i] === "{") depth++;
      else if (html[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    try {
      const obj = JSON.parse(html.slice(start, end)) as CricinfoCommentBall;
      if (obj.id != null && obj.oversActual != null && obj.inningNumber != null) {
        byId.set(obj.id, obj);
      }
    } catch {
      /* skip */
    }
  }
  return [...byId.values()].sort(
    (a, b) =>
      (Number(a.inningNumber) - Number(b.inningNumber)) ||
      (Number(a.oversActual) - Number(b.oversActual)),
  );
}

export function commentaryUrlFromScorecardUrl(scorecardUrl: string): string {
  return scorecardUrl.replace(/\/full-scorecard$/i, "/ball-by-ball-commentary");
}
