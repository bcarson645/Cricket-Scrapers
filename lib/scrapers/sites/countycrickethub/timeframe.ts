export type TimeframePreset = "7d" | "30d" | "90d" | "365d" | "all" | "custom";

export type AvailabilityTimeframe = {
  preset: TimeframePreset;
  from: string | null;
  to: string | null;
  label: string;
};

export function parseDateInput(value: string): Date | null {
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = new Date(Date.UTC(y, mo, day));
  if (d.getUTCFullYear() !== y || d.getUTCMonth() !== mo || d.getUTCDate() !== day) return null;
  return d;
}

export function toDateInputValue(d: Date): string {
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

export function defaultCustomDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - 29);
  return { from: toDateInputValue(from), to: toDateInputValue(to) };
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function endOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

function addUtcDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function resolveAvailabilityTimeframe(
  preset: TimeframePreset,
  customFrom: string | null,
  customTo: string | null,
): AvailabilityTimeframe {
  const today = startOfUtcDay(new Date());

  if (preset === "all") {
    return { preset, from: null, to: null, label: "All time" };
  }

  if (preset === "custom") {
    const fromDate = customFrom ? parseDateInput(customFrom) : null;
    const toDate = customTo ? parseDateInput(customTo) : today;
    if (customFrom && !fromDate) {
      throw new Error("Invalid start date (use YYYY-MM-DD)");
    }
    if (customTo && !toDate) {
      throw new Error("Invalid end date (use YYYY-MM-DD)");
    }
    if (fromDate && toDate && fromDate.getTime() > toDate.getTime()) {
      throw new Error("Start date must be on or before end date");
    }
    const fromLabel = fromDate ? toDateInputValue(fromDate) : "…";
    const toLabel = toDate ? toDateInputValue(toDate) : "…";
    return {
      preset,
      from: fromDate ? toDateInputValue(fromDate) : null,
      to: toDate ? toDateInputValue(toDate) : null,
      label: `Custom (${fromLabel} – ${toLabel})`,
    };
  }

  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : preset === "90d" ? 90 : 365;
  const from = addUtcDays(today, -(days - 1));
  return {
    preset,
    from: toDateInputValue(from),
    to: toDateInputValue(today),
    label:
      preset === "7d"
        ? "Last 7 days"
        : preset === "30d"
          ? "Last 30 days"
          : preset === "90d"
            ? "Last 90 days"
            : "Last 12 months",
  };
}

export function filterAvailabilityByTimeframe<T extends { date: string }>(
  items: T[],
  timeframe: AvailabilityTimeframe,
): T[] {
  if (timeframe.preset === "all" && !timeframe.from && !timeframe.to) {
    return items;
  }
  const from = timeframe.from ? parseDateInput(timeframe.from) : null;
  const to = timeframe.to ? parseDateInput(timeframe.to) : null;
  return items.filter((item) => {
    const t = new Date(item.date).getTime();
    if (from && t < startOfUtcDay(from).getTime()) return false;
    if (to && t > endOfUtcDay(to).getTime()) return false;
    return true;
  });
}
