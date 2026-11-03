import re
import urllib.request

paths = [
    "widgets/atoms/InningsTabs.js",
    "widgets/atoms/ScorecardTeamScores.js",
    "widgets/atoms/ScorecardHeader.js",
]
for path in paths:
    try:
        js = urllib.request.urlopen(
            f"https://widgets.nvplay.com/2.0/js/{path}", timeout=30
        ).read().decode()
        print("===", path, "len", len(js))
        for pat in [r"/api/[a-zA-Z0-9_./-]{3,80}", r"scorecard", r"commentary", r"ball"]:
            hits = sorted(set(re.findall(pat, js, re.I)))
            if hits:
                print(pat, hits[:15])
    except Exception as e:
        print(path, e)
