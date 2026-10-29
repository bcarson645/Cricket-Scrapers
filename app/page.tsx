import { redirect } from "next/navigation";
import { DEFAULT_SCRAPER_SITE_ID } from "@/lib/scrapers/siteNav";

export default function HomePage() {
  redirect(`/scrapers/${DEFAULT_SCRAPER_SITE_ID}`);
}
