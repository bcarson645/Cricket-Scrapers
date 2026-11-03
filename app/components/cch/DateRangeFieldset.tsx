"use client";

import {
  formatRangeDate,
  inclusiveDayCount,
} from "@/lib/scrapers/dateRangeFilter";

type Props = {
  from: string;
  to: string;
  onFromChange: (iso: string) => void;
  onToChange: (iso: string) => void;
  busy?: boolean;
  idPrefix: string;
};

export function DateRangeFieldset({ from, to, onFromChange, onToChange, busy, idPrefix }: Props) {
  const rangeDays = inclusiveDayCount(from, to);

  function handleFrom(next: string) {
    onFromChange(next);
    if (next && to && next > to) onToChange(next);
  }

  function handleTo(next: string) {
    onToChange(next);
    if (next && from && next < from) onFromChange(next);
  }

  const summaryId = `${idPrefix}-date-summary`;

  return (
    <fieldset className="nv-date-query">
      <legend>Date range</legend>
      <p className="nv-date-range-summary" id={summaryId}>
        <span className="nv-date-range-label">Selected</span>
        <span className="nv-date-range-values">
          {formatRangeDate(from)} – {formatRangeDate(to)}
        </span>
        {rangeDays != null && (
          <span className="nv-date-range-days">
            {rangeDays} day{rangeDays === 1 ? "" : "s"}
          </span>
        )}
      </p>
      <div className="nv-date-field">
        <label htmlFor={`${idPrefix}-from`}>From</label>
        <input
          id={`${idPrefix}-from`}
          className="input-wide nv-date-input"
          type="date"
          value={from}
          max={to}
          onChange={(e) => handleFrom(e.target.value)}
          disabled={busy}
          aria-describedby={summaryId}
        />
      </div>
      <div className="nv-date-field">
        <label htmlFor={`${idPrefix}-to`}>To</label>
        <input
          id={`${idPrefix}-to`}
          className="input-wide nv-date-input"
          type="date"
          value={to}
          min={from}
          onChange={(e) => handleTo(e.target.value)}
          disabled={busy}
          aria-describedby={summaryId}
        />
      </div>
    </fieldset>
  );
}
