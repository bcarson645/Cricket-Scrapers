"use client";

import { formatBatchScrapeErrorMessage } from "@/lib/scrapers/batchScrapeErrorMessage";

export async function downloadNvplayEcbBatchCsv(matchIds: string[]): Promise<void> {
  const res = await fetch("/api/nvplay-ecb/scorecards/batch?format=csv", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ matchIds }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(formatBatchScrapeErrorMessage(data, "Batch scrape failed"));
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "nvplay-ecb-scorecards.csv";
  a.click();
  URL.revokeObjectURL(url);
}
