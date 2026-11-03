"use client";

import { useState } from "react";
import { CountyCricketHubAvailability } from "@/app/components/CountyCricketHubAvailability";
import { CountyCricketHubPlayers } from "@/app/components/CountyCricketHubPlayers";

type TabId = "news" | "players";

export function CountyCricketHubPanel() {
  const [tab, setTab] = useState<TabId>("news");

  return (
    <div className="cch-hub">
      <div className="tab-list" role="tablist" aria-label="County Cricket Hub tools">
        <button
          type="button"
          role="tab"
          id="cch-tab-news"
          aria-selected={tab === "news"}
          aria-controls="cch-panel-news"
          className={tab === "news" ? "tab active" : "tab"}
          onClick={() => setTab("news")}
        >
          Availability news
        </button>
        <button
          type="button"
          role="tab"
          id="cch-tab-players"
          aria-selected={tab === "players"}
          aria-controls="cch-panel-players"
          className={tab === "players" ? "tab active" : "tab"}
          onClick={() => setTab("players")}
        >
          Player database
        </button>
      </div>
      <div
        role="tabpanel"
        id="cch-panel-news"
        aria-labelledby="cch-tab-news"
        hidden={tab !== "news"}
        className="tab-panel"
      >
        {tab === "news" && <CountyCricketHubAvailability />}
      </div>
      <div
        role="tabpanel"
        id="cch-panel-players"
        aria-labelledby="cch-tab-players"
        hidden={tab !== "players"}
        className="tab-panel"
      >
        {tab === "players" && <CountyCricketHubPlayers />}
      </div>
    </div>
  );
}
