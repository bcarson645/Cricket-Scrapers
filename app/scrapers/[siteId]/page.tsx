import { notFound } from "next/navigation";
import { CricbuzzTabs } from "@/app/components/CricbuzzTabs";
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
      ) : (
        <ScraperPlaceholder site={site} />
      )}
    </main>
  );
}
