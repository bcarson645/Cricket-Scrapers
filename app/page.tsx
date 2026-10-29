import { CricbuzzTabs } from "@/app/components/CricbuzzTabs";
import { ScrapeWorkbench } from "@/app/components/ScrapeWorkbench";
import { buildWorkbenchView } from "@/app/data/scrapeWorkbench";

export default function HomePage() {
  const view = buildWorkbenchView();
  return (
    <main>
      <h1>Cricket scorecard scrapers</h1>
      <p className="lead">
        Use the tabs for Cricbuzz: browse recent matches for batch CSV export, or open one scorecard
        by URL for QA. The example workbench is below.
      </p>
      <CricbuzzTabs />
      <ScrapeWorkbench initial={view} />
    </main>
  );
}
