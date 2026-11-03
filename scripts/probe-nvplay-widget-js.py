import re
import urllib.request

js = urllib.request.urlopen(
    "https://widgets.nvplay.com/2.0/js/widgets.nvplay.js?235cb8e", timeout=60
).read().decode("utf-8", "replace")
for pat in ["scorecard", "ballbyball", "ball-by-ball", "commentary", "Bearer", "Authorization"]:
    print(pat, js.count(pat))

# path fragments near scorecard
idx = 0
seen = set()
while True:
    i = js.find("scorecard", idx)
    if i < 0:
        break
    chunk = js[max(0, i - 40) : i + 60]
    if chunk not in seen:
        seen.add(chunk)
        print("...", chunk.replace("\n", " ")[:100])
    idx = i + 1
