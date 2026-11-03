"use client";

import type { SiteMatchSummary } from "@/lib/scrapers/types";
import { MatchExportTable } from "@/app/components/MatchExportTable";

export async function downloadCricbuzzBatchCsv(matchIds: string[]): Promise<void> {
  const res = await fetch("/api/cricbuzz/scorecards/batch?format=csv", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ matchIds }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Batch scrape failed");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cricbuzz-scorecards.csv";
  a.click();
  URL.revokeObjectURL(url);
}

type BatchTableProps = {
  matches: SiteMatchSummary[];
  busy: boolean;
};

export function CricbuzzMatchExportSection({ matches, busy }: BatchTableProps) {
  return (
    <MatchExportTable
      matches={matches}
      busy={busy}
      matchIdColumnLabel="Cricbuzz ID"
      exportKey="matchId"
      onScrapeCsv={downloadCricbuzzBatchCsv}
    />
  );
}
