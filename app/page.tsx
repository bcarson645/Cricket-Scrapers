import { CricbuzzDiscoverBatch } from "@/app/components/CricbuzzDiscoverBatch";
import { CricbuzzScorecardQa } from "@/app/components/CricbuzzScorecardQa";
import { ScrapeWorkbench } from "@/app/components/ScrapeWorkbench";
import { buildWorkbenchView } from "@/app/data/scrapeWorkbench";

export default function HomePage() {
  const view = buildWorkbenchView();
  return (
    <main>
      <h1>Cricket scorecard scrapers</h1>
      <p className="lead">
        Discover recent Cricbuzz matches and export scorecards to one CSV, paste a URL for single-match
        QA, or use the example batch flow below.
      </p>
      <CricbuzzDiscoverBatch />
      <CricbuzzScorecardQa />
      <ScrapeWorkbench initial={view} />
    </main>
  );
}
