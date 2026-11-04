"use client";

import { useState } from "react";
import { NvPlayAusDiscoverBatch } from "@/app/components/NvPlayAusDiscoverBatch";
import { NvPlayAusScorecardQa } from "@/app/components/NvPlayAusScorecardQa";
import { NVPLAY_AUS_LIVE_URL } from "@/lib/scrapers/sites/nvplay-aus/config";

type TabId = "discover" | "single";

export function NvPlayAusPanel() {
  const [tab, setTab] = useState<TabId>("discover");

  return (
    <div className="cch-hub">
      <p className="lead" style={{ marginBottom: "1.25rem" }}>
        Cricket Australia Play-Cricket on{" "}
        <a href={NVPLAY_AUS_LIVE_URL} target="_blank" rel="noreferrer">
          live.nvplay.com/play
        </a>
        . Discover matches by date and competition, or paste a single match link for QA export (52-column
        CSV).
      </p>
      <div className="tab-list" role="tablist" aria-label="NV Play Australia tools">
        <button
          type="button"
          role="tab"
          id="nv-tab-discover"
          aria-selected={tab === "discover"}
          aria-controls="nv-panel-discover"
          className={tab === "discover" ? "tab active" : "tab"}
          onClick={() => setTab("discover")}
        >
          Date &amp; competition
        </button>
        <button
          type="button"
          role="tab"
          id="nv-tab-single"
          aria-selected={tab === "single"}
          aria-controls="nv-panel-single"
          className={tab === "single" ? "tab active" : "tab"}
          onClick={() => setTab("single")}
        >
          Single match
        </button>
      </div>
      <div
        role="tabpanel"
        id="nv-panel-discover"
        aria-labelledby="nv-tab-discover"
        hidden={tab !== "discover"}
        className="tab-panel"
      >
        {tab === "discover" && <NvPlayAusDiscoverBatch />}
      </div>
      <div
        role="tabpanel"
        id="nv-panel-single"
        aria-labelledby="nv-tab-single"
        hidden={tab !== "single"}
        className="tab-panel"
      >
        {tab === "single" && <NvPlayAusScorecardQa />}
      </div>
    </div>
  );
}
