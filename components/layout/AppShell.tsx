"use client";

import { useMemo, useState } from "react";
import { LeftRail } from "./LeftRail";
import { HeaderNav } from "./HeaderNav";
import { GlobeMap } from "@/components/map/GlobeMap";
import { FloatingMonitoringCard } from "@/components/map/FloatingMonitoringCard";
import { MapControls } from "@/components/map/MapControls";
import { LiveStatusPill } from "@/components/map/LiveStatusPill";
import { RightEventsPanel } from "@/components/events/RightEventsPanel";
import { SignalsPanel } from "@/components/signals/SignalsPanel";
import { SignalsFloatingCard } from "@/components/signals/SignalsFloatingCard";
import { SourcesScreen } from "@/components/sources/SourcesScreen";
import { PoliticsPanel } from "@/components/politics/PoliticsPanel";
import { mockEvents } from "@/data/mockEvents";
import { mockSignals } from "@/data/mockSignals";
import type { EventCategory, RegionKey } from "@/types/event";

export type ViewMode = "situation" | "global" | "signals";
type ActiveSection = "dashboard" | "sources";
type ActiveTopTab = "situation" | "politics" | "sources";

export function AppShell() {
  const [selectedId, setSelectedId] = useState<string | null>("1");
  const [activeSection, setActiveSection] = useState<ActiveSection>("dashboard");
  const [activeTopTab, setActiveTopTab] = useState<ActiveTopTab>("situation");
  const [activeView, setActiveView] = useState<ViewMode>("situation");
  const [activeRegion, setActiveRegion] = useState<RegionKey>("middle-east");
  const [activeCategory, setActiveCategory] = useState<EventCategory | "all">("all");
  const [signalConfidenceMin, setSignalConfidenceMin] = useState(0);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const [showRadarSites, setShowRadarSites] = useState(false);

  const displayedSignals = useMemo(
    () =>
      activeView === "signals"
        ? mockSignals.filter((s) => s.confidence >= signalConfidenceMin)
        : [],
    [activeView, signalConfidenceMin],
  );

  const baseEvents = useMemo(
    () =>
      activeView === "global"
        ? mockEvents
        : mockEvents.filter((e) => e.region === activeRegion),
    [activeView, activeRegion],
  );

  const displayedEvents = useMemo(
    () =>
      activeCategory === "all"
        ? baseEvents
        : baseEvents.filter((e) => e.category === activeCategory),
    [baseEvents, activeCategory],
  );

  function handleViewChange(view: ViewMode) {
    setActiveSection("dashboard");
    setActiveTopTab("situation");
    setActiveView(view);
    setActiveCategory("all");
    setSelectedId(null);
    setSelectedSignalId(null);
    if (view === "situation") setActiveRegion("middle-east");
  }

  function handleRegionChange(region: RegionKey) {
    setActiveSection("dashboard");
    setActiveRegion(region);
    setActiveView("situation");
    setSelectedId(null);
  }

  function handleCategoryChange(category: EventCategory | "all") {
    setActiveCategory(category);
    if (activeTopTab === "politics" && category !== "politics") {
      setActiveTopTab("situation");
    }
    const nextDisplayedEvents =
      category === "all" ? baseEvents : baseEvents.filter((e) => e.category === category);

    if (selectedId !== null && !nextDisplayedEvents.some((e) => e.id === selectedId)) {
      setSelectedId(null);
    }
  }

  function handleTopTabSelect(tab: ActiveTopTab) {
    if (tab === "sources") {
      setActiveSection("sources");
      setActiveTopTab("sources");
      return;
    }

    if (tab === "politics") {
      setActiveSection("dashboard");
      setActiveTopTab("politics");
      setActiveView("global");
      setActiveRegion("middle-east");
      setActiveCategory("politics");
      setSelectedId(null);
      setSelectedSignalId(null);
      return;
    }

    handleViewChange("situation");
  }

  return (
    <div
      className="flex h-screen w-screen flex-col overflow-hidden"
      style={{ background: "#0a0a0a" }}
    >
      <HeaderNav
        activeTab={activeTopTab}
        onTabSelect={handleTopTabSelect}
      />

      <div className="flex flex-1 overflow-hidden">
        <LeftRail
          activeView={activeSection === "dashboard" && activeTopTab === "situation" ? activeView : null}
          onViewChange={handleViewChange}
        />

        {activeSection === "sources" ? (
          <SourcesScreen />
        ) : activeTopTab === "politics" ? (
          <PoliticsPanel events={displayedEvents} />
        ) : (
          <>
            <div className="relative flex-1 overflow-hidden">
              <GlobeMap
                events={activeView === "signals" ? [] : displayedEvents}
                selectedId={selectedId}
                onSelectEvent={setSelectedId}
                signals={displayedSignals}
                selectedSignalId={selectedSignalId}
                onSelectSignal={setSelectedSignalId}
                isSignalsMode={activeView === "signals"}
                showRadarSites={activeView === "signals" && showRadarSites}
              />
              {activeView === "signals" && (
                <SignalsFloatingCard
                  confidenceMin={signalConfidenceMin}
                  onConfidenceChange={setSignalConfidenceMin}
                  showRadarSites={showRadarSites}
                  onToggleRadarSites={() => setShowRadarSites((v) => !v)}
                />
              )}
              {activeView !== "signals" && (
                <FloatingMonitoringCard
                  view={activeView}
                  activeRegion={activeRegion}
                  activeCategory={activeCategory}
                  isPoliticsWatch={false}
                  eventCount={displayedEvents.length}
                  onViewChange={handleViewChange}
                  onRegionChange={handleRegionChange}
                  onCategoryChange={handleCategoryChange}
                />
              )}
              <MapControls />
              <LiveStatusPill />
            </div>

            {activeView !== "signals" && (
              <RightEventsPanel
                events={displayedEvents}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            )}
            {activeView === "signals" && (
              <SignalsPanel
                confidenceMin={signalConfidenceMin}
                selectedId={selectedSignalId}
                onSelect={setSelectedSignalId}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
