import json
import re
import urllib.error
import urllib.request

CUSTOMER_ID = "6cb09e4b-e702-4942-8760-659da2d1b3ff"
AUTH_BASE = "https://w-auth.nvplay.com"


def post_auth(use_json: bool = True) -> dict:
    url = f"{AUTH_BASE}/api/widgetauthorisation/{CUSTOMER_ID}"
    payload = {"requestedWidgets": '["match-list"]', "type": "json"}
    if not use_json:
        payload = {}
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={"Content-Type": "application/json", "Accept": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    for label, payload in [
        ("json", {"requestedWidgets": '["match-list"]', "type": "json"}),
        ("empty", {}),
    ]:
        url = f"{AUTH_BASE}/api/widgetauthorisation/{CUSTOMER_ID}"
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            method="POST",
            headers={"Content-Type": "application/json", "Accept": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                body = json.loads(resp.read().decode("utf-8"))
                print("===", label, "keys", body.keys())
                extra = {k: body[k] for k in body if k not in (
                    "CustomerId", "AllowAllWidgets", "AllowAllVideo", "AllowedWidgets",
                    "ApiBaseUrl", "VersionSuffix", "UseJson",
                )}
                if extra:
                    print("extra", extra)
        except urllib.error.HTTPError as e:
            print(label, "failed", e.code)


if __name__ == "__main__":
    main()
    js = urllib.request.urlopen(
        "https://widgets.nvplay.com/2.0/js/widgets.nvplay.js?235cb8e", timeout=30
    ).read().decode("utf-8", "replace")
    paths = sorted(set(re.findall(r"pe\+['\"]/([^'\"]+)['\"]", js)))
    print("api path fragments", len(paths))
    for p in paths[:30]:
        print(" ", p)
