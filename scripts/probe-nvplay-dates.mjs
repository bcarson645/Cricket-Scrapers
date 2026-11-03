const CUSTOMER_ID = "6cb09e4b-e702-4942-8760-659da2d1b3ff";
const auth = await fetch(
  `https://w-auth.nvplay.com/api/widgetauthorisation/${CUSTOMER_ID}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      requestedWidgets: '["match-list"]',
      type: "json",
    }),
  },
).then((r) => r.json());
const base = auth.ApiBaseUrl.replace(/\/$/, "");
const items = await fetch(`${base}/api/matchlist?customerId=${CUSTOMER_ID}`, {
  headers: { Accept: "application/json" },
}).then((r) => r.json());

const comp = "Rothesay County Championship - Division 1";
const div1 = items.filter((m) => m.CompetitionName === comp);
console.log("div1 total", div1.length);
const dates = [...new Set(div1.map((m) => String(m.StartDateTimeUTC ?? "").slice(0, 10)))].sort();
console.log("date range", dates[0], "..", dates.at(-1), "unique days", dates.length);
console.log("sample dates", dates.slice(0, 5), "...", dates.slice(-3));

const complete = div1.filter((m) => m.IsComplete);
console.log("complete", complete.length);

const known = items.find((m) =>
  String(m.MatchId).includes("5520000-6664-a623-2334-08de2d98b6d4"),
);
console.log("known match", known?.CompetitionName, known?.StartDateTimeUTC, known?.IsComplete);
