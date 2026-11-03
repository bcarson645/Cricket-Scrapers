"use client";

import type { SeriesOption } from "@/lib/scrapers/dateRangeFilter";

type Props = {
  series: SeriesOption[];
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
  onSelectAll: (all: boolean) => void;
  entityLabel?: string;
};

export function SeriesCheckboxList({
  series,
  selectedIds,
  onToggle,
  onSelectAll,
  entityLabel = "Series",
}: Props) {
  const allSelected = series.length > 0 && series.every((s) => selectedIds.has(s.seriesId));

  if (series.length === 0) return null;

  return (
    <section className="card cch-result-filters">
      <div className="cch-result-section-head">
        <h2>{entityLabel}</h2>
        <div className="btn-row" style={{ marginTop: 0 }}>
          <button
            type="button"
            className="secondary"
            disabled={allSelected}
            onClick={() => onSelectAll(true)}
          >
            Select all
          </button>
          <button type="button" className="secondary" onClick={() => onSelectAll(false)}>
            Clear all
          </button>
        </div>
      </div>
      <p className="hint" style={{ marginTop: 0 }}>
        Choose one or more {entityLabel.toLowerCase()}, then select matches for CSV export.
      </p>
      <div className="nv-comp-list">
        {series.map((s) => (
          <label key={s.seriesId} className="category-check">
            <input
              type="checkbox"
              checked={selectedIds.has(s.seriesId)}
              onChange={() => onToggle(s.seriesId)}
            />
            {s.seriesName}
            <span className="nv-comp-count">({s.matchCount})</span>
          </label>
        ))}
      </div>
    </section>
  );
}
