"use client";
import { Clock, MapPin, Bookmark } from "lucide-react";
import { OsintEvent } from "@/types/event";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface EventCardProps {
  event: OsintEvent;
  index: number;
  selected: boolean;
  onClick: () => void;
}

export function EventCard({ event, index, selected, onClick }: EventCardProps) {
  return (
    <div
      onClick={onClick}
      className="relative rounded-lg cursor-pointer transition-all duration-150"
      style={{
        padding: "10px 11px",
        border: selected
          ? "1px solid rgba(59,130,246,0.5)"
          : "1px solid rgba(255,255,255,0.055)",
        background: selected
          ? "rgba(59,130,246,0.06)"
          : "rgba(255,255,255,0.018)",
        boxShadow: selected
          ? "0 0 0 1px rgba(59,130,246,0.15), inset 0 0 20px rgba(59,130,246,0.04)"
          : "none",
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLElement).style.background =
            "rgba(255,255,255,0.032)";
          (e.currentTarget as HTMLElement).style.borderColor =
            "rgba(255,255,255,0.09)";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLElement).style.background =
            "rgba(255,255,255,0.018)";
          (e.currentTarget as HTMLElement).style.borderColor =
            "rgba(255,255,255,0.055)";
        }
      }}
    >
      {/* Header row: index + title + bookmark */}
      <div className="flex items-start gap-2 mb-1.5">
        <span
          className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center mt-px"
          style={{
            fontSize: "9px",
            fontWeight: 700,
            background: selected
              ? "rgba(59,130,246,0.7)"
              : "rgba(255,255,255,0.07)",
            color: selected ? "#fff" : "rgba(120,140,170,0.9)",
          }}
        >
          {index}
        </span>
        <p
          className="flex-1 leading-snug font-medium pr-1"
          style={{
            fontSize: "12.5px",
            color: selected
              ? "rgba(220,235,255,0.97)"
              : "rgba(190,208,230,0.85)",
          }}
        >
          {event.title}
        </p>
        <button
          className="flex-shrink-0 mt-0.5 transition-colors duration-150"
          style={{ color: "rgba(85,85,85,0.8)" }}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color =
              "rgba(96,165,250,0.8)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color =
              "rgba(85,85,85,0.8)")
          }
        >
          <Bookmark size={11} />
        </button>
      </div>

      {/* Meta: time + location */}
      <div
        className="flex items-center gap-3 mb-1.5"
        style={{ fontSize: "10.5px", color: "rgba(100,100,100,0.9)" }}
      >
        <span className="flex items-center gap-1">
          <Clock size={9} style={{ color: "rgba(85,85,85,0.7)" }} />
          {event.time}
        </span>
        <span className="flex items-center gap-1">
          <MapPin size={9} style={{ color: "rgba(85,85,85,0.7)" }} />
          {event.location}
        </span>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1 mb-1.5">
        <StatusBadge variant={event.category} />
        <StatusBadge variant={event.severity} />
        <StatusBadge variant={event.sourceType} />
        <StatusBadge variant={event.verification} />
      </div>

      {/* Summary */}
      <p
        className="leading-relaxed line-clamp-2"
        style={{ fontSize: "11.5px", color: "rgba(110,110,110,0.9)" }}
      >
        {event.summary}
      </p>
    </div>
  );
}
