"use client";

import { useState } from "react";
import { CrexDiscoverByDate } from "@/app/components/CrexDiscoverByDate";
import { CrexScorecardQa } from "@/app/components/CrexScorecardQa";
import { CrexSeriesBatch } from "@/app/components/CrexSeriesBatch";

type TabId = "daterange" | "series" | "single";

export function CrexTabs() {
  const [tab, setTab] = useState<TabId>("daterange");

  return (
    <section className="cricbuzz-tabs cch-hub">
      <div className="tab-list" role="tablist" aria-label="Crex tools">
        <button
          type="button"
          role="tab"
          id="crex-tab-daterange"
          aria-selected={tab === "daterange"}
          aria-controls="crex-panel-daterange"
          className={tab === "daterange" ? "tab active" : "tab"}
          onClick={() => setTab("daterange")}
        >
          Schedule (date range)
        </button>
        <button
          type="button"
          role="tab"
          id="crex-tab-series"
          aria-selected={tab === "series"}
          aria-controls="crex-panel-series"
          className={tab === "series" ? "tab active" : "tab"}
          onClick={() => setTab("series")}
        >
          Series
        </button>
        <button
          type="button"
          role="tab"
          id="crex-tab-single"
          aria-selected={tab === "single"}
          aria-controls="crex-panel-single"
          className={tab === "single" ? "tab active" : "tab"}
          onClick={() => setTab("single")}
        >
          Single scorecard
        </button>
      </div>
      <div
        role="tabpanel"
        id="crex-panel-daterange"
        aria-labelledby="crex-tab-daterange"
        hidden={tab !== "daterange"}
        className="tab-panel"
      >
        {tab === "daterange" && <CrexDiscoverByDate />}
      </div>
      <div
        role="tabpanel"
        id="crex-panel-series"
        aria-labelledby="crex-tab-series"
        hidden={tab !== "series"}
        className="tab-panel"
      >
        {tab === "series" && <CrexSeriesBatch />}
      </div>
      <div
        role="tabpanel"
        id="crex-panel-single"
        aria-labelledby="crex-tab-single"
        hidden={tab !== "single"}
        className="tab-panel"
      >
        {tab === "single" && <CrexScorecardQa />}
      </div>
    </section>
  );
}
