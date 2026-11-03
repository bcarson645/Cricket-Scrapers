import type { AvailabilityCategory } from "@/lib/scrapers/sites/countycrickethub/categories";
import type { AvailabilityTimeframe } from "@/lib/scrapers/sites/countycrickethub/timeframe";

export type AvailabilityNewsItem = {
  date: string;
  dateDisplay: string;
  county: string;
  playerName: string;
  details: string;
  link: string | null;
  category: AvailabilityCategory;
};

export type GroupedAvailabilityNews = Record<
  AvailabilityCategory,
  { total: number; items: AvailabilityNewsItem[] }
>;

export type LoadAvailabilityNewsResult = {
  site: "M" | "F";
  sourceUrl: string;
  timeframe: AvailabilityTimeframe;
  categories: AvailabilityCategory[];
  sections: GroupedAvailabilityNews;
};

export type { AvailabilityTimeframe } from "@/lib/scrapers/sites/countycrickethub/timeframe";
