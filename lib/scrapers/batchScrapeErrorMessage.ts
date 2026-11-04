type BatchErrorBody = {
  error?: string;
  errors?: { matchId?: string; url?: string; error?: string }[];
};

/** Surface per-match failures when the batch route returns 502 with an errors array. */
export function formatBatchScrapeErrorMessage(data: BatchErrorBody, fallback: string): string {
  const top = data.error?.trim() || fallback;
  const details = (data.errors ?? [])
    .map((e) => {
      const id = e.matchId?.trim();
      const url = "url" in e ? String((e as { url?: string }).url ?? "").trim() : "";
      const msg = e.error?.trim();
      if (!msg) return null;
      const label = id || url || "match";
      return `${label}: ${msg}`;
    })
    .filter((line): line is string => Boolean(line));

  if (details.length === 0) return top;
  const preview = details.slice(0, 3).join(" · ");
  const more = details.length > 3 ? ` (+${details.length - 3} more)` : "";
  return `${top} — ${preview}${more}`;
}
