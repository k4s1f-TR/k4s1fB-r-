"use client";
import { useState, useMemo, useEffect } from "react";
import { LeftRail } from "./LeftRail";
import { HeaderNav } from "./HeaderNav";
import { GlobeMap } from "@/components/map/GlobeMap";
import { FloatingMonitoringCard } from "@/components/map/FloatingMonitoringCard";
import { MapControls } from "@/components/map/MapControls";
import { LiveStatusPill } from "@/components/map/LiveStatusPill";
import { RightEventsPanel } from "@/components/events/RightEventsPanel";
import { SignalsPanel } from "@/components/signals/SignalsPanel";
import { SignalsFloatingCard } from "@/components/signals/SignalsFloatingCard";
import { mockEvents } from "@/data/mockEvents";
import { mockSignals } from "@/data/mockSignals";
import type { RegionKey, EventCategory } from "@/types/event";

export type ViewMode = "situation" | "global" | "signals";

export function AppShell() {
  const [selectedId, setSelectedId] = useState<string | null>("1");
  const [activeView, setActiveView] = useState<ViewMode>("situation");
  const [activeRegion, setActiveRegion] = useState<RegionKey>("middle-east");
  const [activeCategory, setActiveCategory] = useState<EventCategory | "all">("all");
  const [signalConfidenceMin, setSignalConfidenceMin] = useState(0);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);

  const displayedSignals = useMemo(
    () =>
      activeView === "signals"
        ? mockSignals.filter((s) => s.confidence >= signalConfidenceMin)
        : [],
    [activeView, signalConfidenceMin]
  );

  const baseEvents = useMemo(
    () =>
      activeView === "global"
        ? mockEvents
        : mockEvents.filter((e) => e.region === activeRegion),
    [activeView, activeRegion]
  );

  const displayedEvents = useMemo(
    () =>
      activeCategory === "all"
        ? baseEvents
        : baseEvents.filter((e) => e.category === activeCategory),
    [baseEvents, activeCategory]
  );

  useEffect(() => {
    if (selectedId !== null && !displayedEvents.some((e) => e.id === selectedId)) {
      setSelectedId(null);
    }
  }, [displayedEvents, selectedId]);

  function handleViewChange(view: ViewMode) {
    setActiveView(view);
    setActiveCategory("all");
    setSelectedId(null);
    setSelectedSignalId(null);
    if (view === "situation") setActiveRegion("middle-east");
  }

  function handleRegionChange(region: RegionKey) {
    setActiveRegion(region);
    setActiveView("situation");
    setSelectedId(null);
  }

  function handleCategoryChange(category: EventCategory | "all") {
    setActiveCategory(category);
  }

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden"
      style={{ background: "#0a0a0a" }}
    >
      <HeaderNav />

      <div className="flex flex-1 overflow-hidden">
        <LeftRail activeView={activeView} onViewChange={handleViewChange} />

        {/* Map area — relative so overlays can be absolute */}
        <div className="relative flex-1 overflow-hidden">
          <GlobeMap
            events={activeView === "signals" ? [] : displayedEvents}
            selectedId={selectedId}
            onSelectEvent={setSelectedId}
            signals={displayedSignals}
            selectedSignalId={selectedSignalId}
            onSelectSignal={setSelectedSignalId}
            isSignalsMode={activeView === "signals"}
          />
          {activeView === "signals" && (
            <SignalsFloatingCard
              confidenceMin={signalConfidenceMin}
              onConfidenceChange={setSignalConfidenceMin}
            />
          )}
          {activeView !== "signals" && (
            <FloatingMonitoringCard
              view={activeView}
              activeRegion={activeRegion}
              activeCategory={activeCategory}
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
      </div>
    </div>
  );
}
