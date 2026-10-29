"use client";

import { useState } from "react";
import { CricbuzzDiscoverBatch } from "@/app/components/CricbuzzDiscoverBatch";
import { CricbuzzScorecardQa } from "@/app/components/CricbuzzScorecardQa";

type TabId = "recent" | "single";

export function CricbuzzTabs() {
  const [tab, setTab] = useState<TabId>("recent");

  return (
    <section className="cricbuzz-tabs">
      <div className="tab-list" role="tablist" aria-label="Cricbuzz tools">
        <button
          type="button"
          role="tab"
          id="tab-recent"
          aria-selected={tab === "recent"}
          aria-controls="panel-recent"
          className={tab === "recent" ? "tab active" : "tab"}
          onClick={() => setTab("recent")}
        >
          Recent matches
        </button>
        <button
          type="button"
          role="tab"
          id="tab-single"
          aria-selected={tab === "single"}
          aria-controls="panel-single"
          className={tab === "single" ? "tab active" : "tab"}
          onClick={() => setTab("single")}
        >
          Single scorecard
        </button>
      </div>
      <div
        role="tabpanel"
        id="panel-recent"
        aria-labelledby="tab-recent"
        hidden={tab !== "recent"}
        className="tab-panel"
      >
        {tab === "recent" && <CricbuzzDiscoverBatch />}
      </div>
      <div
        role="tabpanel"
        id="panel-single"
        aria-labelledby="tab-single"
        hidden={tab !== "single"}
        className="tab-panel"
      >
        {tab === "single" && <CricbuzzScorecardQa />}
      </div>
    </section>
  );
}
