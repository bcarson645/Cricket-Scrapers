import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cricket scorecard scrapers",
  description: "Discover and scrape match scorecards by site and date range",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
