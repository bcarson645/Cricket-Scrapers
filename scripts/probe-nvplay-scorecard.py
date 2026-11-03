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
print("auth keys", auth.keys())
base = auth["ApiBaseUrl"].rstrip("/")

paths = [
    f"/api/scorecard/{MATCH_ID}",
    f"/api/scorecard/{MATCH_ID}?format=json",
    f"/api/commentary/{MATCH_ID}",
    f"/api/matchcentre/{MATCH_ID}",
    f"/api/match-centre/{MATCH_ID}",
    f"/api/live-summary/{MATCH_ID}",
    f"/api/match/{MATCH_ID}/commentary",
]

for p in paths:
    url = base + p
    for label, headers in [
        ("plain", {}),
        ("accept-json", {"Accept": "application/json"}),
        ("widget-customer", {"X-Customer-Id": CUSTOMER_ID}),
    ]:
        req = urllib.request.Request(url, headers={**headers, "Accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                body = resp.read(500)
                print(resp.status, label, p, body[:120])
        except urllib.error.HTTPError as e:
            print(e.code, label, p, e.read(80)[:80])
