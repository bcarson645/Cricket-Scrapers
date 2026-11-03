export type AvailabilityCategory = "injury" | "transfer" | "retirement";

export const AVAILABILITY_CATEGORIES: AvailabilityCategory[] = [
  "injury",
  "transfer",
  "retirement",
];

export function parseAvailabilityCategories(param: string | null): AvailabilityCategory[] {
  if (!param || param.trim().toLowerCase() === "all") {
    return [...AVAILABILITY_CATEGORIES];
  }
  const picked = new Set<AvailabilityCategory>();
  for (const part of param.split(",")) {
    const key = part.trim().toLowerCase();
    if (key === "injury" || key === "transfer" || key === "retirement") {
      picked.add(key);
    }
  }
  if (picked.size === 0) {
    throw new Error("Select at least one category: injury, transfer, retirement (or all)");
  }
  return AVAILABILITY_CATEGORIES.filter((c) => picked.has(c));
}

export function categoryFilterLabel(categories: AvailabilityCategory[]): string {
  if (categories.length === AVAILABILITY_CATEGORIES.length) return "All categories";
  const labels: Record<AvailabilityCategory, string> = {
    injury: "Injury & availability",
    transfer: "Transfers & releases",
    retirement: "Retirements",
  };
  return categories.map((c) => labels[c]).join(", ");
}
