# Drop reference files here (gitignored except this note):
#
# - sample URL in a text file (optional)
# - golden CSV or Excel export for one match (expected rows)
# - bulk workbook / CSV (the large multi-match file)
#
# Internal ↔ Cricbuzz IDs: see fixtures/mappings/README.md and registry.json
#
# We diff scraper output against fixtures/golden/ using:
#   npm run compare:cricbuzz -- fixtures/golden/your-match.csv
