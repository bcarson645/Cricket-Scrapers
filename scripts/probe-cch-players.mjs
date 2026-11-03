const paths = [
  "/ccdbapi/players",
  "/ccdbapi/players/M",
  "/ccdbapi/squad/15",
  "/ccdbapi/squad/M/15",
  "/ccdbapi/mensquad/15",
  "/ccdbapi/squadlist/15",
  "/ccdbapi/playerids",
  "/ccdbapi/allplayers",
  "/ccdbapi/teams/15/players",
  "/ccdbapi/teams/15/squad",
];

for (const p of paths) {
  try {
    const r = await fetch(`https://countycrickethub.net${p}`, {
      headers: { Accept: "application/json" },
    });
    const t = await r.text();
    if (r.status !== 404) console.log(r.status, p, t.slice(0, 120));
  } catch (e) {
    console.log("err", p, e);
  }
}

const squadJs = await (await fetch("https://countycrickethub.net/squad.html")).text();
const scripts = [...squadJs.matchAll(/src="([^"]+\.js)"/g)].map((m) => m[1]);
console.log("squad scripts", scripts);
