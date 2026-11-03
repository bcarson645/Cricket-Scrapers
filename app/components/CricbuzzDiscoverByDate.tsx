"use client";

import { SiteDateRangeDiscover } from "@/app/components/SiteDateRangeDiscover";
import { downloadCricbuzzBatchCsv } from "@/app/components/cricbuzzBatchExport";

export function CricbuzzDiscoverByDate() {
  return (
    <SiteDateRangeDiscover
      siteLabel="Cricbuzz"
      apiPath="/api/cricbuzz/discover/schedule"
      idPrefix="cb"
      intro="Loads recent and upcoming Cricbuzz live-scores listings, then filters by match start date. Multi-day games use the start day only."
      loadButtonLabel="Load Cricbuzz matches in range"
      matchIdColumnLabel="Cricbuzz ID"
      onScrapeCsv={downloadCricbuzzBatchCsv}
    />
  );
}
