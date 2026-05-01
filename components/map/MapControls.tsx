"use client";
import { Crosshair, Globe, Plus, Minus } from "lucide-react";

const BTNS = [
  { icon: Crosshair, label: "Center view" },
  { icon: Globe, label: "Globe view" },
  { icon: Plus, label: "Zoom in" },
  { icon: Minus, label: "Zoom out" },
];

export function MapControls() {
  return (
    <div className="absolute bottom-12 right-4 flex flex-col gap-1 z-10">
      {BTNS.map(({ icon: Icon, label }) => (
        <button
          key={label}
          title={label}
          aria-label={label}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150"
          style={{
            background: "rgba(4,8,18,0.85)",
            border: "1px solid rgba(255,255,255,0.07)",
            backdropFilter: "blur(10px)",
            color: "rgba(75,95,130,0.8)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color =
              "rgba(180,210,240,0.9)";
            (e.currentTarget as HTMLElement).style.background =
              "rgba(59,130,246,0.1)";
            (e.currentTarget as HTMLElement).style.borderColor =
              "rgba(59,130,246,0.2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color =
              "rgba(75,95,130,0.8)";
            (e.currentTarget as HTMLElement).style.background =
              "rgba(4,8,18,0.85)";
            (e.currentTarget as HTMLElement).style.borderColor =
              "rgba(255,255,255,0.07)";
          }}
        >
          <Icon size={13} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}
