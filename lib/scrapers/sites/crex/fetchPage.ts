import { CREX_FETCH_HEADERS, CREX_ORIGIN } from "@/lib/scrapers/sites/crex/config";

export function decodeCrexSsrJson(raw: string): unknown {
  return JSON.parse(
    raw
      .replace(/&q;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">"),
  );
}

export function extractCrexSsrState(html: string): Record<string, unknown> {
  const m = html.match(/<script id="app-root-state" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m?.[1]) {
    throw new Error("Crex page did not include app-root-state JSON");
  }
  const parsed = decodeCrexSsrJson(m[1]);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid Crex app-root-state JSON");
  }
  return parsed as Record<string, unknown>;
}

export function crexAbsoluteUrl(pathOrUrl: string): string {
  const trimmed = pathOrUrl.trim();
  if (trimmed.startsWith("http")) return trimmed;
  if (trimmed.startsWith("/")) return `${CREX_ORIGIN}${trimmed}`;
  return `${CREX_ORIGIN}/${trimmed}`;
}

export async function fetchCrexHtml(pathOrUrl: string): Promise<{ url: string; html: string }> {
  const url = crexAbsoluteUrl(pathOrUrl);
  const res = await fetch(url, { headers: CREX_FETCH_HEADERS, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Crex page HTTP ${res.status} for ${url}`);
  }
  return { url, html: await res.text() };
}

export async function fetchCrexSsrState(pathOrUrl: string): Promise<{
  url: string;
  html: string;
  state: Record<string, unknown>;
}> {
  const { url, html } = await fetchCrexHtml(pathOrUrl);
  return { url, html, state: extractCrexSsrState(html) };
}
