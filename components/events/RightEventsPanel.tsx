"use client";
import { SlidersHorizontal } from "lucide-react";
import { OsintEvent } from "@/types/event";
import { EventCard } from "./EventCard";

interface RightEventsPanelProps {
  events: OsintEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function RightEventsPanel({
  events,
  selectedId,
  onSelect,
}: RightEventsPanelProps) {
  return (
    <div
      className="flex flex-col h-full flex-shrink-0"
      style={{
        width: "372px",
        background: "rgba(10,10,10,0.95)",
        borderLeft: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <span
          className="font-semibold tracking-widest uppercase"
          style={{ fontSize: "10px", color: "rgba(170,170,170,0.8)" }}
        >
          Active Events
        </span>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: "10.5px", color: "rgba(100,100,100,0.85)" }}>
            {events.length} Results
          </span>
          <button
            style={{ color: "rgba(90,90,90,0.85)" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color =
                "rgba(96,165,250,0.8)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color =
                "rgba(90,90,90,0.85)")
            }
          >
            <SlidersHorizontal size={12} />
          </button>
        </div>
      </div>

      {/* Scrollable card list */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: "6px" }}
      >
        {events.map((event, i) => (
          <EventCard
            key={event.id}
            event={event}
            index={i + 1}
            selected={selectedId === event.id}
            onClick={() => onSelect(event.id)}
          />
        ))}
      </div>
    </div>
  );
}
