"use client";

import { useState } from "react";
import { localIsoDate } from "@/lib/scrapers/dateRangeFilter";
import { SiteDateRangeDiscover } from "@/app/components/SiteDateRangeDiscover";
import { downloadCricinfoBatchCsv } from "@/app/components/cricinfoBatchExport";

function defaultRecentRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 13);
  return { from: localIsoDate(from), to: localIsoDate(to) };
}

export function CricinfoDiscoverByDate() {
  const [scorecardOnly, setScorecardOnly] = useState(true);

  return (
    <SiteDateRangeDiscover
      siteLabel="Cricinfo"
      apiPath="/api/cricinfo/discover/schedule"
      idPrefix="ci"
      initialRange={defaultRecentRange()}
      intro="Loads Cricinfo live match results for each day in your range (same data as the results page with ?date=DD-MM-YYYY). Only games whose start date falls on that day are kept. Ranges over 120 days are rejected — use a shorter window or the Series tab."
      loadButtonLabel="Load Cricinfo matches in range"
      scorecardOnly={scorecardOnly}
      onScorecardOnlyChange={setScorecardOnly}
      scorecardOnlyLabel="Scorecard available only"
      matchIdColumnLabel="Cricinfo ID"
      exportKey="url"
      onScrapeCsv={downloadCricinfoBatchCsv}
    />
  );
}
