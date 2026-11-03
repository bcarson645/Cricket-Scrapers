import re
import urllib.request

js = urllib.request.urlopen(
    "https://widgets.nvplay.com/2.0/js/widgets.nvplay.js?235cb8e", timeout=30
).read().decode("utf-8", "replace")
paths = sorted(set(re.findall(r'["\'](/[a-zA-Z0-9_./-]{5,100})["\']', js)))
for p in paths:
    if any(k in p.lower() for k in ("match", "fixture", "competition", "score", "customer", "widget")):
        print(p)

for m in re.finditer(r"globalApiBaseUrl[^;]{0,200}", js):
    print("CTX:", m.group(0)[:180])
