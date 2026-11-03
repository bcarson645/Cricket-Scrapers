const CUSTOMER_ID = "6cb09e4b-e702-4942-8760-659da2d1b3ff";
const MATCH_ID = "5520000-6664-a623-2334-08de2d98b6d4";

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
console.log("ApiBaseUrl", auth.ApiBaseUrl);
console.log("AllowedWidgets", auth.AllowedWidgets);

const base = auth.ApiBaseUrl.replace(/\/$/, "");
const paths = [
  `/api/match/${MATCH_ID}`,
  `/api/match/${MATCH_ID}/scorecard`,
  `/api/match/${MATCH_ID}/ballbyball`,
  `/api/match/${MATCH_ID}/ball-by-ball`,
  `/api/matches/${MATCH_ID}`,
  `/api/matches/${MATCH_ID}/scorecard`,
  `/api/matches/${MATCH_ID}/ballbyball`,
  `/api/scorecard/${MATCH_ID}`,
  `/api/ballbyball/${MATCH_ID}`,
  `/match/${MATCH_ID}`,
  `/match/${MATCH_ID}/scorecard`,
  `/match/${MATCH_ID}/ballbyball`,
  `/v1/match/${MATCH_ID}`,
  `/v1/match/${MATCH_ID}/scorecard`,
  `/v1/match/${MATCH_ID}/ballbyball`,
  `/v2/match/${MATCH_ID}/scorecard`,
  `/json/match/${MATCH_ID}`,
  `/json/match/${MATCH_ID}/scorecard`,
  `/json/match/${MATCH_ID}/ballbyball`,
  `/json/match/${MATCH_ID}/ball-by-ball`,
  `/json/match/${MATCH_ID}/comments`,
  `/json/match/${MATCH_ID}/innings/1/balls`,
];

for (const p of paths) {
  const url = `${base}${p}`;
  try {
    const r = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    const text = await r.text();
    const preview = text.slice(0, 120).replace(/\s+/g, " ");
    console.log(r.status, p, preview);
  } catch (e) {
    console.log("ERR", p, e);
  }
}
