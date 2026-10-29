import type { SiteAdapter } from "@/lib/scrapers/types";
import { cricbuzzSiteAdapter } from "@/lib/scrapers/sites/cricbuzz/adapter";
import { exampleSiteAdapter } from "@/lib/scrapers/sites/example";

const adapters: Record<string, SiteAdapter> = {
  [exampleSiteAdapter.siteId]: exampleSiteAdapter,
  [cricbuzzSiteAdapter.siteId]: cricbuzzSiteAdapter,
};

export function listSiteIds(): string[] {
  return Object.keys(adapters).sort();
}

export function getSiteAdapter(siteId: string): SiteAdapter {
  const adapter = adapters[siteId];
  if (!adapter) {
    throw new Error(`Unknown site: ${siteId}`);
  }
  return adapter;
}
