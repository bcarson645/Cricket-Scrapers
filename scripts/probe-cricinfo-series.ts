const url =
  process.argv[2] ??
  "https://www.espncricinfo.com/series/ireland-in-namibia-2026-27-1558225/match-schedule-fixtures-and-results";

async function runProbe() {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html",
    },
  });
  console.log("status", res.status, res.url);
  const html = await res.text();
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m?.[1]) {
    console.log("no __NEXT_DATA__");
    return;
  }
  const root = JSON.parse(m[1]) as {
    props?: { appPageProps?: { data?: Record<string, unknown> } };
  };
  const data = root.props?.appPageProps?.data;
  if (!data) {
    console.log("no appPageProps.data");
    return;
  }
  console.log("data keys", Object.keys(data));
  const series = data.series as Record<string, unknown> | undefined;
  console.log("series id", series?.objectId, series?.longName ?? series?.name);

  const content = data.content as Record<string, unknown> | undefined;
  if (content) {
    for (const [k, v] of Object.entries(content)) {
      if (Array.isArray(v)) {
        console.log(`content.${k} array[${v.length}]`, v[0] ? Object.keys(v[0] as object) : []);
      } else if (v && typeof v === "object") {
        console.log(`content.${k} object`, Object.keys(v as object).slice(0, 20));
      } else {
        console.log(`content.${k}`, v);
      }
    }
  }

  const matches = content?.matches as unknown[] | undefined;
  if (matches?.length) {
    console.log("\nfirst match", JSON.stringify(matches[0], null, 2).slice(0, 1200));
    for (const raw of matches) {
      const match = raw as {
        objectId?: number;
        title?: string;
        statusText?: string;
        hasScorecard?: boolean;
        startDate?: string;
        teams?: { team?: { longName?: string; name?: string } }[];
      };
      const teamNames = (match.teams ?? [])
        .map((t) => t.team?.longName ?? t.team?.name)
        .filter(Boolean)
        .join(" vs ");
      console.log(
        match.objectId,
        match.startDate?.slice(0, 10),
        teamNames || match.title,
        match.statusText,
        "scorecard",
        match.hasScorecard,
      );
    }
  }
}

runProbe().catch(console.error);
