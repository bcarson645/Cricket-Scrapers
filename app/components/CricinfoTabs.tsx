"use client";

import { useState } from "react";
import { CricinfoBallByBallPanel } from "@/app/components/CricinfoBallByBallPanel";
import { CricinfoScorecardQa } from "@/app/components/CricinfoScorecardQa";
import { CricinfoSeriesBatch } from "@/app/components/CricinfoSeriesBatch";

type TabId = "series" | "single" | "ballbyball";

export function CricinfoTabs() {
  const [tab, setTab] = useState<TabId>("series");

  return (
    <section className="cricbuzz-tabs">
      <div className="tab-list" role="tablist" aria-label="Cricinfo tools">
        <button
          type="button"
          role="tab"
          id="ci-tab-series"
          aria-selected={tab === "series"}
          aria-controls="ci-panel-series"
          className={tab === "series" ? "tab active" : "tab"}
          onClick={() => setTab("series")}
        >
          Series
        </button>
        <button
          type="button"
          role="tab"
          id="ci-tab-single"
          aria-selected={tab === "single"}
          aria-controls="ci-panel-single"
          className={tab === "single" ? "tab active" : "tab"}
          onClick={() => setTab("single")}
        >
          Single scorecard
        </button>
        <button
          type="button"
          role="tab"
          id="ci-tab-ballbyball"
          aria-selected={tab === "ballbyball"}
          aria-controls="ci-panel-ballbyball"
          className={tab === "ballbyball" ? "tab active" : "tab"}
          onClick={() => setTab("ballbyball")}
        >
          Ball-by-ball
        </button>
      </div>
      <div
        role="tabpanel"
        id="ci-panel-series"
        aria-labelledby="ci-tab-series"
        hidden={tab !== "series"}
        className="tab-panel"
      >
        {tab === "series" && <CricinfoSeriesBatch />}
      </div>
      <div
        role="tabpanel"
        id="ci-panel-single"
        aria-labelledby="ci-tab-single"
        hidden={tab !== "single"}
        className="tab-panel"
      >
        {tab === "single" && <CricinfoScorecardQa />}
      </div>
      <div
        role="tabpanel"
        id="ci-panel-ballbyball"
        aria-labelledby="ci-tab-ballbyball"
        hidden={tab !== "ballbyball"}
        className="tab-panel"
      >
        {tab === "ballbyball" && <CricinfoBallByBallPanel />}
      </div>
    </section>
  );
}
