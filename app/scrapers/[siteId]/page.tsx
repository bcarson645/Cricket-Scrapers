import { notFound } from "next/navigation";
import { CountyCricketHubPanel } from "@/app/components/CountyCricketHubPanel";
import { CricbuzzTabs } from "@/app/components/CricbuzzTabs";
import { CricinfoTabs } from "@/app/components/CricinfoTabs";
import { NvPlayEcbPanel } from "@/app/components/NvPlayEcbPanel";
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
            Availability news and squad player profiles from County Cricket Hub — separate tabs,
            filters, and paginated results.
          </p>
          <CountyCricketHubPanel />
        </>
      ) : site.status === "active" && site.id === "cricinfo" ? (
        <>
          <p className="lead">
            Load a series, export scorecards (52-column CSV), or use the Ball-by-ball tab for
            per-delivery TSV export from a scorecard or commentary URL.
          </p>
          <CricinfoTabs />
        </>
      ) : site.status === "active" && site.id === "nvplay-ecb" ? (
        <NvPlayEcbPanel />
      ) : (
        <ScraperPlaceholder site={site} />
      )}
    </main>
  );
}
