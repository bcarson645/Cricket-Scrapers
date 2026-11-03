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

const paths = [
  `/api/competitions?customerId=${CUSTOMER_ID}`,
  `/api/competition?customerId=${CUSTOMER_ID}`,
  `/api/competitionlist?customerId=${CUSTOMER_ID}`,
  `/api/customer/${CUSTOMER_ID}/competitions`,
  `/api/customer/${CUSTOMER_ID}/matches`,
];

for (const p of paths) {
  const url = `${base}${p}`;
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  const text = await r.text();
  console.log(r.status, p, text.slice(0, 150).replace(/\s+/g, " "));
}

// Filter client-side demo for County Champ on a date
const items = await fetch(`${base}/api/matchlist?customerId=${CUSTOMER_ID}`, {
  headers: { Accept: "application/json" },
}).then((r) => r.json());

const comp = "Rothesay County Championship - Division 1";
const day = "2025-08-01";
const filtered = items.filter((m) => {
  if (m.CompetitionName !== comp) return false;
  const utc = String(m.StartDateTimeUTC ?? "");
  return utc.startsWith(day);
});
console.log("filtered", comp, day, filtered.length);
if (filtered[0]) {
  console.log(
    filtered[0].MatchId,
    filtered[0].Team1Name,
    "v",
    filtered[0].Team2Name,
    filtered[0].IsComplete,
  );
}
