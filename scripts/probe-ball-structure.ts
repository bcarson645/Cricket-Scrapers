import fs from "fs";

const url =
  "https://www.espncricinfo.com/series/ireland-in-namibia-2026-27-1558225/namibia-vs-ireland-1st-odi-1558231/ball-by-ball-commentary";

async function main() {
  const r = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html",
    },
  });
  const html = await r.text();
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m?.[1]) throw new Error("no next data");
  const data = JSON.parse(m[1]).props.appPageProps.data as {
    match: Record<string, unknown>;
    content: { comments?: unknown[]; overComments?: unknown[]; innings?: unknown[] };
  };
  const comments = data.content.comments ?? [];
  console.log("comments count", comments.length);
  console.log("sample comment keys", comments[0] ? Object.keys(comments[0] as object) : []);
  console.log("sample comment", JSON.stringify(comments[0], null, 2).slice(0, 2500));
  console.log("match objectId", data.match?.objectId);
  const support = data.content.supportInfo as Record<string, unknown> | undefined;
  console.log("supportInfo", JSON.stringify(support)?.slice(0, 800));
  const overs = data.content.overComments ?? [];
  console.log("\noverComments count", overs.length);
  console.log("sample over keys", overs[0] ? Object.keys(overs[0] as object) : []);
  fs.writeFileSync("tmp-ball-comment-sample.json", JSON.stringify(comments.slice(0, 5), null, 2));
}

main().catch(console.error);
