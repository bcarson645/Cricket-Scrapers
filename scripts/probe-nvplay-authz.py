import re
import urllib.request

js = urllib.request.urlopen(
    "https://widgets.nvplay.com/2.0/js/widgets.nvplay.js?235cb8e", timeout=60
).read().decode("utf-8", "replace")
for m in re.finditer(r"authzData[^;]{0,220}", js):
    print(m.group(0)[:220])
print("--- scorecard api ---")
for m in re.finditer(r"scorecard[^\"']{0,100}", js):
    s = m.group(0)
    if "api" in s.lower() or "json" in s.lower() or "/" in s:
        print(s[:100])
