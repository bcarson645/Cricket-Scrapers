import { countyNameFromTeamId } from "@/lib/scrapers/sites/countycrickethub/teams";
import {
  AVAILABILITY_CATEGORIES,
  type AvailabilityCategory,
} from "@/lib/scrapers/sites/countycrickethub/categories";
import {
  filterAvailabilityByTimeframe,
  type AvailabilityTimeframe,
} from "@/lib/scrapers/sites/countycrickethub/timeframe";
import type {
  AvailabilityNewsItem,
  GroupedAvailabilityNews,
  LoadAvailabilityNewsResult,
} from "@/lib/scrapers/sites/countycrickethub/availabilityTypes";

export type { AvailabilityCategory } from "@/lib/scrapers/sites/countycrickethub/categories";
export {
  AVAILABILITY_CATEGORIES,
  categoryFilterLabel,
  parseAvailabilityCategories,
} from "@/lib/scrapers/sites/countycrickethub/categories";
export type CchSite = "M" | "F";

export type {
  AvailabilityNewsItem,
  GroupedAvailabilityNews,
  LoadAvailabilityNewsResult,
} from "@/lib/scrapers/sites/countycrickethub/availabilityTypes";
export type { AvailabilityTimeframe, TimeframePreset } from "@/lib/scrapers/sites/countycrickethub/timeframe";
export {
  defaultCustomDateRange,
  resolveAvailabilityTimeframe,
  toDateInputValue,
} from "@/lib/scrapers/sites/countycrickethub/timeframe";

type RawInjuryUpdate = {
  update_date: string;
  team_id: number;
  player_name: string;
  update_details: string;
  update_link: string | null;
};

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function ordinalDay(day: number): string {
  const n = day % 100;
  if (n >= 11 && n <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

export function formatCchNewsDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.getUTCDate();
  const month = MONTHS[d.getUTCMonth() + 1] ?? "";
  const year = String(d.getUTCFullYear()).slice(-2);
  return `${ordinalDay(day)} ${month}, ${year}`;
}

export function categorizeAvailabilityNews(details: string): AvailabilityCategory {
  const d = details.toLowerCase();
  if (/\bretir(e|ed|ement)\b/.test(d) || /retired from/.test(d)) {
    return "retirement";
  }
  if (
    /\bleav(e|es|ing)\b/.test(d) ||
    /\breleased\b/.test(d) ||
    /another county/.test(d) ||
    /short-term contract/.test(d) ||
    /registration status/.test(d) ||
    /agreement with/.test(d) ||
    /will leave/.test(d) ||
    /end of the \d{4} season/.test(d) ||
    /end of \d{4} season/.test(d)
  ) {
    return "transfer";
  }
  return "injury";
}

export async function fetchCountyCricketHubInjuryNews(site: CchSite): Promise<RawInjuryUpdate[]> {
  const res = await fetch(`https://countycrickethub.net/ccdbapi/injurynews/${site}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`County Cricket Hub API HTTP ${res.status}`);
  }
  const data = (await res.json()) as RawInjuryUpdate[];
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from County Cricket Hub");
  }
  return data;
}

export function parseAvailabilityNews(
  raw: RawInjuryUpdate[],
  site: CchSite,
): AvailabilityNewsItem[] {
  return raw
    .map((row) => {
      const details = row.update_details?.trim() ?? "";
      return {
        date: row.update_date,
        dateDisplay: formatCchNewsDate(row.update_date),
        county: countyNameFromTeamId(row.team_id, site),
        playerName: row.player_name?.trim() ?? "",
        details,
        link: row.update_link?.trim() || null,
        category: categorizeAvailabilityNews(details),
      };
    })
    .filter((row) => row.playerName.length > 0)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function groupAvailabilityNews(
  items: AvailabilityNewsItem[],
  limitPerSection: number | null,
): GroupedAvailabilityNews {
  const buckets: Record<AvailabilityCategory, AvailabilityNewsItem[]> = {
    injury: [],
    transfer: [],
    retirement: [],
  };
  for (const item of items) {
    buckets[item.category].push(item);
  }
  const cap = (list: AvailabilityNewsItem[]) =>
    limitPerSection == null ? list : list.slice(0, limitPerSection);
  return {
    injury: { total: buckets.injury.length, items: cap(buckets.injury) },
    transfer: { total: buckets.transfer.length, items: cap(buckets.transfer) },
    retirement: { total: buckets.retirement.length, items: cap(buckets.retirement) },
  };
}

export function applyCategoryFilter(
  sections: GroupedAvailabilityNews,
  categories: AvailabilityCategory[],
): GroupedAvailabilityNews {
  const allowed = new Set(categories);
  return {
    injury: allowed.has("injury") ? sections.injury : { total: 0, items: [] },
    transfer: allowed.has("transfer") ? sections.transfer : { total: 0, items: [] },
    retirement: allowed.has("retirement") ? sections.retirement : { total: 0, items: [] },
  };
}

export async function loadGroupedAvailabilityNews(
  site: CchSite,
  timeframe: AvailabilityTimeframe,
  categories: AvailabilityCategory[] = AVAILABILITY_CATEGORIES,
  limitPerSection: number | null = null,
): Promise<LoadAvailabilityNewsResult> {
  const raw = await fetchCountyCricketHubInjuryNews(site);
  let items = parseAvailabilityNews(raw, site);
  items = filterAvailabilityByTimeframe(items, timeframe);
  const useLimit =
    limitPerSection ??
    (timeframe.preset === "all" ? 200 : null);
  const grouped = groupAvailabilityNews(items, useLimit);
  return {
    site,
    sourceUrl: `https://countycrickethub.net/news-injury.html?site=${site}`,
    timeframe,
    categories,
    sections: applyCategoryFilter(grouped, categories),
  };
}
