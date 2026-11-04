"use client";

import type { SiteMatchSummary } from "@/lib/scrapers/types";
import { MatchExportTable } from "@/app/components/MatchExportTable";
import { downloadCrexBatchCsv } from "@/app/components/crexBatchExport";

type Props = {
  matches: SiteMatchSummary[];
  busy: boolean;
};

export function CrexMatchExportSection({ matches, busy }: Props) {
  return (
    <MatchExportTable
      matches={matches}
      busy={busy}
      matchIdColumnLabel="Crex match id"
      exportKey="url"
      onScrapeCsv={downloadCrexBatchCsv}
    />
  );
}
