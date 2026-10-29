"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SCRAPER_SITES } from "@/lib/scrapers/siteNav";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="sidebar-nav" aria-label="Scraper sites">
      <p className="sidebar-heading">Scrapers</p>
      <ul className="sidebar-list">
        {SCRAPER_SITES.map((site) => {
          const href = `/scrapers/${site.id}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={site.id}>
              <Link
                href={href}
                className={active ? "sidebar-link active" : "sidebar-link"}
                aria-current={active ? "page" : undefined}
              >
                <span className="sidebar-link-label">{site.label}</span>
                {site.status === "active" ? (
                  <span className="sidebar-badge sidebar-badge-live">Live</span>
                ) : (
                  <span className="sidebar-badge">Soon</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
