"use client";
import { useState } from "react";
import { LeftRail } from "./LeftRail";
import { HeaderNav } from "./HeaderNav";
import { GlobeMap } from "@/components/map/GlobeMap";
import { FloatingMonitoringCard } from "@/components/map/FloatingMonitoringCard";
import { MapControls } from "@/components/map/MapControls";
import { LiveStatusPill } from "@/components/map/LiveStatusPill";
import { RightEventsPanel } from "@/components/events/RightEventsPanel";
import { mockEvents } from "@/data/mockEvents";

export function AppShell() {
  const [selectedId, setSelectedId] = useState<string | null>("1");

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden"
      style={{ background: "#04080f" }}
    >
      <HeaderNav />

      <div className="flex flex-1 overflow-hidden">
        <LeftRail />

        {/* Map area — relative so overlays can be absolute */}
        <div className="relative flex-1 overflow-hidden">
          <GlobeMap
            events={mockEvents}
            selectedId={selectedId}
            onSelectEvent={setSelectedId}
          />
          <FloatingMonitoringCard />
          <MapControls />
          <LiveStatusPill />
        </div>

        <RightEventsPanel
          events={mockEvents}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>
    </div>
  );
}
