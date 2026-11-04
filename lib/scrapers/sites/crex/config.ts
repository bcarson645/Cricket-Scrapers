export const CREX_ORIGIN = "https://crex.com";
export const CREX_SERIES_PAGE = `${CREX_ORIGIN}/series`;
export const CREX_SCHEDULE_PAGE = `${CREX_ORIGIN}/schedule`;

export const CREX_FETCH_HEADERS = {
  Accept: "text/html,application/xhtml+xml",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

export const CREX_STATS_HEADERS = {
  Accept: "application/json",
  Origin: CREX_ORIGIN,
  Referer: `${CREX_ORIGIN}/`,
  "User-Agent": CREX_FETCH_HEADERS["User-Agent"],
};
