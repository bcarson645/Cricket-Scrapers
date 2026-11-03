"use client";

import type { SiteMatchSummary } from "@/lib/scrapers/types";
import { MatchExportTable } from "@/app/components/MatchExportTable";

export async function downloadCricinfoBatchCsv(urls: string[]): Promise<void> {
  const res = await fetch("/api/cricinfo/scorecards/batch?format=csv", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scorecardUrls: urls }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Batch scrape failed");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cricinfo-scorecards.csv";
  a.click();
  URL.revokeObjectURL(url);
}

type Props = {
  matches: SiteMatchSummary[];
  busy: boolean;
};

export function CricinfoMatchExportSection({ matches, busy }: Props) {
  return (
    <MatchExportTable
      matches={matches}
      busy={busy}
      matchIdColumnLabel="Cricinfo ID"
      exportKey="url"
      onScrapeCsv={downloadCricinfoBatchCsv}
    />
  );
}
