import { parseCricbuzzRecentMatchesHtml } from "../lib/scrapers/sites/cricbuzz/discoverRecent";
import assert from "node:assert";

const html = `
<a href="/live-cricket-scorecard/139489/ind-vs-nz-final">India vs New Zealand</a>
<a href="/live-cricket-scores/139478/ind-vs-eng">India vs England</a>
`;

const matches = parseCricbuzzRecentMatchesHtml(html);
assert.equal(matches.length, 2);
assert.ok(matches.some((m) => m.matchId === "139489"));
assert.ok(matches.every((m) => m.url?.includes("scorecard")));
console.log("discoverRecent parser ok", matches.map((m) => m.matchId).join(","));
