import type { ScraperSiteNavItem } from "@/lib/scrapers/siteNav";

type Props = { site: ScraperSiteNavItem };

export function ScraperPlaceholder({ site }: Props) {
  return (
    <section className="card placeholder-card">
      <h2>Coming soon</h2>
      <p className="lead" style={{ marginBottom: "1rem" }}>
        {site.label} scorecard scraping is not built yet. We will tackle this source after Cricbuzz
        export and ID mapping are solid.
      </p>
      {site.note && <p className="hint">{site.note}</p>}
      {site.referenceUrl && (
        <p className="hint">
          Reference:{" "}
          <a href={site.referenceUrl} target="_blank" rel="noreferrer">
            {site.referenceUrl}
          </a>
        </p>
      )}
    </section>
  );
}
