import { CricbuzzTabs } from "@/app/components/CricbuzzTabs";

export default function HomePage() {
  return (
    <main>
      <h1>Cricket scorecard scrapers</h1>
      <p className="lead">
        Recent matches: load the Cricbuzz list and export selected scorecards to one CSV. Single
        scorecard: paste a URL to QA and download that match.
      </p>
      <CricbuzzTabs />
    </main>
  );
}
