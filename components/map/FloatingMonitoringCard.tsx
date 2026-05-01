"use client";
import { ChevronDown, Globe2 } from "lucide-react";

export function FloatingMonitoringCard() {
  return (
    <div
      className="absolute top-4 left-4 rounded-xl z-10"
      style={{
        padding: "14px 16px",
        background: "rgba(4,8,18,0.88)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(14px)",
        minWidth: "206px",
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset",
      }}
    >
      {/* Monitoring region */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Globe2 size={9} style={{ color: "rgba(75,95,130,0.7)" }} />
          <span
            className="tracking-widest uppercase"
            style={{ fontSize: "8.5px", color: "rgba(75,95,130,0.8)", fontWeight: 600 }}
          >
            Monitoring Region
          </span>
        </div>
        <button className="flex items-center justify-between w-full group">
          <span
            className="font-semibold"
            style={{ fontSize: "14px", color: "rgba(210,228,250,0.95)" }}
          >
            Middle East
          </span>
          <ChevronDown
            size={12}
            style={{ color: "rgba(75,95,130,0.7)" }}
          />
        </button>
      </div>

      <div
        className="mb-3"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: "11px",
        }}
      >
        <div className="mb-1">
          <span
            className="tracking-widest uppercase"
            style={{ fontSize: "8.5px", color: "rgba(75,95,130,0.8)", fontWeight: 600 }}
          >
            Quick Filter
          </span>
        </div>
        <button className="flex items-center justify-between w-full">
          <span style={{ fontSize: "12.5px", color: "rgba(180,200,228,0.9)" }}>
            All Categories
          </span>
          <ChevronDown
            size={12}
            style={{ color: "rgba(75,95,130,0.7)" }}
          />
        </button>
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: "11px",
        }}
      >
        <span
          className="block tracking-widest uppercase mb-1.5"
          style={{ fontSize: "8.5px", color: "rgba(75,95,130,0.8)", fontWeight: 600 }}
        >
          Total Active Results
        </span>
        <div className="flex items-end gap-2">
          <span
            className="font-bold leading-none"
            style={{ fontSize: "28px", color: "rgba(220,234,252,0.97)" }}
          >
            128
          </span>
          <div className="flex flex-col pb-0.5">
            <span
              className="font-semibold leading-tight"
              style={{ fontSize: "11px", color: "rgba(74,222,128,0.85)" }}
            >
              ↑ 12%
            </span>
            <span
              className="leading-tight"
              style={{ fontSize: "9.5px", color: "rgba(75,95,130,0.8)" }}
            >
              vs last 24h
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
