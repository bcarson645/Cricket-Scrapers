/** Stable numeric id for Crex `sf` series keys (SiteDateRangeDiscover expects numbers). */
export function crexSeriesIdFromSf(sf: string): number {
  const trimmed = sf.trim();
  if (!trimmed) return 0;
  let h = 0;
  for (let i = 0; i < trimmed.length; i++) {
    h = (Math.imul(31, h) + trimmed.charCodeAt(i)) >>> 0;
  }
  return h || 1;
}
