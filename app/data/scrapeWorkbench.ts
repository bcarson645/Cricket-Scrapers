import { listSiteIds, getSiteAdapter } from "@/lib/scrapers/registry";

export type SiteOption = { id: string; label: string };

export type WorkbenchView = {
  sites: SiteOption[];
  defaultSiteId: string;
  defaultStart: string;
  defaultEnd: string;
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Pure builder — components only render this shape. */
export function buildWorkbenchView(): WorkbenchView {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 14);

  const sites = listSiteIds().map((id) => {
    const adapter = getSiteAdapter(id);
    return { id, label: adapter.label };
  });

  return {
    sites,
    defaultSiteId: sites[0]?.id ?? "example",
    defaultStart: isoDate(start),
    defaultEnd: isoDate(end),
  };
}

export type DiscoverResult = {
  siteId: string;
  start: string;
  end: string;
  matches: ReturnType<ReturnType<typeof getSiteAdapter>["discoverMatches"]>;
};

export function discoverMatches(siteId: string, start: string, end: string): DiscoverResult {
  const adapter = getSiteAdapter(siteId);
  return {
    siteId,
    start,
    end,
    matches: adapter.discoverMatches(start, end),
  };
}
