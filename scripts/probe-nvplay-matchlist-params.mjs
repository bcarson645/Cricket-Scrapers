const CUSTOMER_ID = "6cb09e4b-e702-4942-8760-659da2d1b3ff";

const authRes = await fetch(
  `https://w-auth.nvplay.com/api/widgetauthorisation/${CUSTOMER_ID}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      requestedWidgets: '["match-list","scorecard"]',
      type: "json",
    }),
  },
);
const auth = await authRes.json();
const base = auth.ApiBaseUrl.replace(/\/$/, "");

const baseUrl = `${base}/api/matchlist?customerId=${CUSTOMER_ID}`;
const items = await fetch(baseUrl, { headers: { Accept: "application/json" } }).then((r) =>
  r.json(),
);
console.log("default count", items.length);
if (items[0]) {
  console.log("keys", Object.keys(items[0]).sort().join(", "));
  console.log("sample", JSON.stringify(items[0], null, 2).slice(0, 1200));
}

const competitions = [...new Set(items.map((x) => x.CompetitionName ?? x.CompetitionId))].slice(
  0,
  15,
);
console.log("sample competitions", competitions);

const extraParams = [
  "competitionId=1",
  "competitionName=County",
  "date=2025-08-01",
  "matchDate=2025-08-01",
  "fromDate=2025-08-01",
  "toDate=2025-08-02",
  "startDate=2025-08-01",
  "endDate=2025-08-02",
  "day=2025-08-01",
  "filterDate=2025-08-01",
];

for (const q of extraParams) {
  const url = `${baseUrl}&${q}`;
  try {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    const text = await r.text();
    let len = "?";
    try {
      len = JSON.parse(text).length;
    } catch {
      len = text.slice(0, 80);
    }
    console.log(r.status, q, "->", len);
  } catch (e) {
    console.log("ERR", q, e.message);
  }
}
