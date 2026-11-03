import { notFound } from "next/navigation";
import { CountyCricketHubAvailability } from "@/app/components/CountyCricketHubAvailability";
import { CricbuzzTabs } from "@/app/components/CricbuzzTabs";
import { CricinfoTabs } from "@/app/components/CricinfoTabs";
import { ScraperPlaceholder } from "@/app/components/ScraperPlaceholder";
import { getScraperSite, scraperSiteIds } from "@/lib/scrapers/siteNav";

type Props = { params: Promise<{ siteId: string }> };

export function generateStaticParams() {
  return scraperSiteIds().map((siteId) => ({ siteId }));
}

export default async function ScraperSitePage({ params }: Props) {
  const { siteId } = await params;
  const site = getScraperSite(siteId);
  if (!site) notFound();

  return (
    <main>
      <h1>{site.label}</h1>
      {site.status === "active" && site.id === "cricbuzz" ? (
        <>
          <p className="lead">
            Recent matches and series: load lists and export selected scorecards to one CSV. Single
            scorecard: paste a URL to QA and download that match.
          </p>
          <CricbuzzTabs />
        </>
      ) : site.status === "active" && site.id === "countycrickethub" ? (
        <>
          <p className="lead">
            Scrape County Cricket Hub player news and review injury, transfer, and retirement updates
            in one place.
          </p>
          <CountyCricketHubAvailability />
        </>
      ) : site.status === "active" && site.id === "cricinfo" ? (
        <>
          <p className="lead">
            Load a full series from the fixtures &amp; results page, or paste a single full-scorecard
            URL. Export uses the same 52-column CSV pipeline as Cricbuzz.
          </p>
          <CricinfoTabs />
        </>
      ) : (
        <ScraperPlaceholder site={site} />
      )}
    </main>
  );
}
