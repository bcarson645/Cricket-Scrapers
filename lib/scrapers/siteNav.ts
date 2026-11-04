export type ScraperSiteStatus = "active" | "planned";

export type ScraperSiteNavItem = {
  id: string;
  label: string;
  status: ScraperSiteStatus;
  /** Short context for placeholder pages. */
  note?: string;
  /** Reference URL for future scraper work. */
  referenceUrl?: string;
};

export const SCRAPER_SITES: ScraperSiteNavItem[] = [
  {
    id: "cricbuzz",
    label: "Cricbuzz",
    status: "active",
    note: "International and major tournaments; recent-match discover and scorecard export.",
  },
  {
    id: "countycrickethub",
    label: "County Cricket Hub",
    status: "active",
    note: "County player availability — injury, transfer, and retirement news.",
    referenceUrl: "https://countycrickethub.net/",
  },
  {
    id: "cricinfo",
    label: "Cricinfo",
    status: "active",
    note: "ESPN Cricinfo series scorecards and ball-by-ball TSV export (JSON + commentary API).",
    referenceUrl: "https://www.espncricinfo.com/",
  },
  {
    id: "nvplay-ecb",
    label: "NV Play (ECB)",
    status: "active",
    note: "ECB NV Play — discover by date/competition, batch or single-match 52-column CSV via w-api.ecb.nvplay.net.",
    referenceUrl: "https://live.nvplay.com/ecb/",
  },
  {
    id: "nvplay-aus",
    label: "NV Play (Australia)",
    status: "active",
    note: "Cricket Australia NV Play — discover by date/competition, batch or single-match 52-column CSV via live.nvplay.com/play.",
    referenceUrl: "https://live.nvplay.com/play/",
  },
  {
    id: "crex",
    label: "Crex",
    status: "active",
    note: "Crex.com — schedule window, series discover, and 52-column scorecard CSV via SSR JSON.",
    referenceUrl: "https://crex.com/series",
  },
  {
    id: "cricketworld",
    label: "Cricketworld",
    status: "planned",
    note: "Domestic and associate fixtures.",
    referenceUrl: "https://www.cricketworld.com/cricket/live",
  },
  {
    id: "cricclubs",
    label: "Cricclubs",
    status: "planned",
    note: "Club cricket; structure varies by board and region — mapping TBD.",
    referenceUrl: "https://cricclubs.com/",
  },
  {
    id: "ecn",
    label: "ECN",
    status: "planned",
    note: "European Cricket Network — often mirrored on Crex / Cricketworld.",
  },
  {
    id: "pcb",
    label: "PCB",
    status: "planned",
    note: "Pakistan domestic and board-hosted scorecards.",
  },
  {
    id: "bcci",
    label: "BCCI",
    status: "planned",
    note: "Indian domestic tournaments when only on board sources.",
  },
  {
    id: "lanka",
    label: "Lanka",
    status: "planned",
    note: "Sri Lanka domestic and board-hosted scorecards.",
  },
  {
    id: "windies",
    label: "Windies",
    status: "planned",
    note: "Caribbean domestic and regional tournaments.",
  },
  {
    id: "mlc",
    label: "Minor League Cricket",
    status: "planned",
    note: "MLC scorecards on the league site.",
    referenceUrl: "https://www.minorleaguecricket.com/",
  },
  {
    id: "cricheroes",
    label: "CricHeroes",
    status: "planned",
    note: "Grassroots scorecards — low priority; site structure is messy.",
    referenceUrl: "https://cricheroes.com/",
  },
];

export function scraperSiteIds(): string[] {
  return SCRAPER_SITES.map((s) => s.id);
}

export function getScraperSite(id: string): ScraperSiteNavItem | undefined {
  return SCRAPER_SITES.find((s) => s.id === id);
}

export const DEFAULT_SCRAPER_SITE_ID = "cricbuzz";
