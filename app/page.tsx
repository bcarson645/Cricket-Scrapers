import { CricbuzzScorecardQa } from "@/app/components/CricbuzzScorecardQa";
import { ScrapeWorkbench } from "@/app/components/ScrapeWorkbench";
import { buildWorkbenchView } from "@/app/data/scrapeWorkbench";

export default function HomePage() {
  const view = buildWorkbenchView();
  return (
    <main>
      <h1>Cricket scorecard scrapers</h1>
      <p className="lead">
        Paste a Cricbuzz scorecard URL to scrape and QA visually, or use discover / batch flow
        below (example site).
      </p>
      <CricbuzzScorecardQa />
      <ScrapeWorkbench initial={view} />
    </main>
  );
}
