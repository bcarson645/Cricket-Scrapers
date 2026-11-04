"use client";

import { useState } from "react";
import { localIsoDate } from "@/lib/scrapers/dateRangeFilter";
import { SiteDateRangeDiscover } from "@/app/components/SiteDateRangeDiscover";
import { downloadCrexBatchCsv } from "@/app/components/crexBatchExport";

function defaultRecentRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 3);
  return { from: localIsoDate(from), to: localIsoDate(to) };
}

export function CrexDiscoverByDate() {
  const [scorecardOnly, setScorecardOnly] = useState(true);

  return (
    <SiteDateRangeDiscover
      siteLabel="Crex"
      apiPath="/api/crex/discover/schedule"
      idPrefix="crex"
      initialRange={defaultRecentRange()}
      intro="Loads fixtures from crex.com/schedule (embedded rolling window — usually a few days around today). Filter by date range and series, then export scorecards. For a full tour, use the Series tab with a link from crex.com/series."
      loadButtonLabel="Load Crex schedule"
      scorecardOnly={scorecardOnly}
      onScorecardOnlyChange={setScorecardOnly}
      scorecardOnlyLabel="Finished / scored matches only"
      matchIdColumnLabel="Crex fkey"
      exportKey="url"
      onScrapeCsv={downloadCrexBatchCsv}
    />
  );
}
