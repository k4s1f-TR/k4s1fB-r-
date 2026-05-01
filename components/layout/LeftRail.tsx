"use client";
import {
  Crosshair,
  Globe,
  Radio,
  Plane,
  Ship,
  FileText,
  Bookmark,
  BarChart2,
  Settings,
  LogOut,
  Eye,
} from "lucide-react";

const topIcons = [
  { icon: Crosshair, label: "Situation", active: true },
  { icon: Globe, label: "Global View" },
  { icon: Radio, label: "Signals" },
  { icon: Plane, label: "Air" },
  { icon: Ship, label: "Maritime" },
  { icon: FileText, label: "Sources" },
  { icon: Bookmark, label: "Bookmarks" },
  { icon: BarChart2, label: "Analytics" },
];

const bottomIcons = [
  { icon: Settings, label: "Settings" },
  { icon: LogOut, label: "Exit" },
];

function RailIcon({
  icon: Icon,
  label,
  active = false,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      className="relative w-full flex items-center justify-center h-10 rounded-lg transition-all duration-200 group"
      style={
        active
          ? {
              background: "rgba(59,130,246,0.08)",
              color: "rgba(147,197,253,0.9)",
            }
          : {
              color: "rgba(75,90,120,0.9)",
            }
      }
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color = "rgba(180,200,230,0.9)";
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color = "rgba(75,90,120,0.9)";
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }
      }}
    >
      {/* Active left bar */}
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r-full"
          style={{ background: "rgba(96,165,250,0.85)" }}
        />
      )}
      <Icon size={16} strokeWidth={active ? 1.8 : 1.5} />
    </button>
  );
}

export function LeftRail() {
  return (
    <div
      className="flex flex-col items-center py-3 flex-shrink-0"
      style={{
        width: "68px",
        minWidth: "68px",
        background: "rgba(4, 7, 15, 0.98)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Logo mark */}
      <div className="mb-5 mt-1">
        <div
          className="w-8 h-8 rounded-[9px] flex items-center justify-center"
          style={{
            background: "linear-gradient(145deg, #0f2545 0%, #091830 100%)",
            border: "1px solid rgba(59,130,246,0.22)",
            boxShadow: "0 0 14px rgba(59,130,246,0.1)",
          }}
        >
          <Eye size={16} strokeWidth={1.6} color="rgba(96,165,250,0.9)" />
        </div>
      </div>

      {/* Primary nav icons */}
      <div className="flex flex-col w-full px-2 gap-0.5 flex-1">
        {topIcons.map((item) => (
          <RailIcon key={item.label} {...item} />
        ))}
      </div>

      {/* Footer icons */}
      <div className="flex flex-col w-full px-2 gap-0.5 mt-2">
        <div
          className="mx-1 mb-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        />
        {bottomIcons.map((item) => (
          <RailIcon key={item.label} {...item} />
        ))}
      </div>
    </div>
  );
}
