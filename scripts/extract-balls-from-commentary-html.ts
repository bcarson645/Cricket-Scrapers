import fs from "fs";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

type CiBall = Record<string, unknown> & { id?: number; oversActual?: number; inningNumber?: number };

async function main() {
  const u =
    "https://www.espncricinfo.com/series/ipl-2025-1449924/mumbai-indians-vs-punjab-kings-qualifier-2-1473510/ball-by-ball-commentary";
  const h = await fetch(u, { headers: { "User-Agent": UA } }).then((r) => r.text());

  const byId = new Map<number, CiBall>();
  const re = /\{"_uid":\d+,"id":(\d+),[\s\S]*?"inningNumber":(\d+)[\s\S]*?"oversActual":([\d.]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(h)) !== null) {
    const start = m.index;
    let depth = 0;
    let end = start;
    for (let i = start; i < h.length; i++) {
      if (h[i] === "{") depth++;
      else if (h[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    try {
      const obj = JSON.parse(h.slice(start, end)) as CiBall;
      if (obj.id != null && obj.oversActual != null) byId.set(obj.id, obj);
    } catch {
      /* skip partial */
    }
  }

  const balls = [...byId.values()].sort(
    (a, b) =>
      (Number(a.inningNumber) - Number(b.inningNumber)) ||
      (Number(a.oversActual) - Number(b.oversActual)),
  );
  console.log("unique balls", balls.length);
  const byInn = new Map<number, number>();
  for (const b of balls) byInn.set(Number(b.inningNumber), (byInn.get(Number(b.inningNumber)) ?? 0) + 1);
  console.log("by inn", Object.fromEntries(byInn));
  fs.writeFileSync("output/comments-from-html-1473510.json", JSON.stringify(balls));
  console.log("last ball", balls[balls.length - 1]?.oversActual, balls[balls.length - 1]?.totalInningRuns);
}

main();
