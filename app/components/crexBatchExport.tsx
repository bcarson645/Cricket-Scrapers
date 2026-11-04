"use client";

import { formatBatchScrapeErrorMessage } from "@/lib/scrapers/batchScrapeErrorMessage";

export async function downloadCrexBatchCsv(urls: string[]): Promise<void> {
  const res = await fetch("/api/crex/scorecards/batch?format=csv", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scorecardUrls: urls }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(formatBatchScrapeErrorMessage(data, "Batch scrape failed"));
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "crex-scorecards.csv";
  a.click();
  URL.revokeObjectURL(url);
}
