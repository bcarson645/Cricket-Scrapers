import json
import urllib.error
import urllib.request

CUSTOMER_ID = "6cb09e4b-e702-4942-8760-659da2d1b3ff"
MATCH_ID = "5520000-6664-a623-2334-08de2d98b6d4"

auth_req = urllib.request.Request(
    f"https://w-auth.nvplay.com/api/widgetauthorisation/{CUSTOMER_ID}",
    data=json.dumps(
        {"requestedWidgets": '["match-list","scorecard","commentary"]', "type": "json"}
    ).encode(),
    method="POST",
    headers={"Content-Type": "application/json", "Accept": "application/json"},
)
auth = json.loads(urllib.request.urlopen(auth_req, timeout=30).read())
base = auth["ApiBaseUrl"].rstrip("/")

for p in [
    "/api/match-list",
    "/api/matchlist",
    "/api/fixtures",
    "/api/matches",
    "/api/matches/live",
]:
    url = base + p
    try:
        with urllib.request.urlopen(
            urllib.request.Request(url, headers={"Accept": "application/json"}), timeout=20
        ) as resp:
            print(resp.status, p, resp.read(200)[:200])
    except urllib.error.HTTPError as e:
        print(e.code, p, e.read(100)[:100])
