"use client";
import { Radio } from "lucide-react";
import { mockSignals } from "@/data/mockSignals";
import type { SignalType } from "@/types/signal";

interface Props {
  confidenceMin: number;
  onConfidenceChange: (min: number) => void;
}

const LABEL_STYLE = {
  fontSize: "8.5px",
  color: "rgba(100,100,100,0.8)",
  fontWeight: 600,
} as const;

const THRESHOLD_OPTIONS: { label: string; value: number }[] = [
  { label: "All", value: 0 },
  { label: "Med+", value: 40 },
  { label: "High+", value: 70 },
];

const TYPE_COLORS: Record<SignalType, string> = {
  source: "rgba(96,165,250,0.85)",
  electronic: "rgba(74,222,128,0.85)",
  "early-warning": "rgba(251,191,36,0.85)",
};

const TYPE_LABELS: Record<SignalType, string> = {
  source: "Source",
  electronic: "Electronic",
  "early-warning": "Early Warning",
};

const SIGNAL_TYPES: SignalType[] = ["source", "electronic", "early-warning"];

export function SignalsFloatingCard({ confidenceMin, onConfidenceChange }: Props) {
  const filtered = mockSignals.filter((s) => s.confidence >= confidenceMin);

  return (
    <div
      className="absolute top-4 left-4 rounded-xl z-10"
      style={{
        padding: "14px 16px",
        background: "rgba(12,12,12,0.88)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(14px)",
        minWidth: "206px",
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-3">
        <Radio size={9} style={{ color: "rgba(96,165,250,0.7)" }} />
        <span className="tracking-widest uppercase font-semibold" style={LABEL_STYLE}>
          SIGINT Monitor
        </span>
      </div>

      {/* Signal coverage */}
      <div className="mb-3">
        <span className="tracking-widest uppercase block mb-1" style={LABEL_STYLE}>
          Signal Coverage
        </span>
        <span
          className="font-semibold"
          style={{ fontSize: "14px", color: "rgba(210,210,210,0.95)" }}
        >
          All Regions
        </span>
        <span
          className="block mt-0.5"
          style={{ fontSize: "10.5px", color: "rgba(100,100,100,0.85)" }}
        >
          Global signal monitoring active
        </span>
      </div>

      {/* Confidence threshold */}
      <div
        className="mb-3"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: "11px",
        }}
      >
        <span className="tracking-widest uppercase block mb-2" style={LABEL_STYLE}>
          Min Confidence
        </span>
        <div className="flex items-center gap-1.5">
          {THRESHOLD_OPTIONS.map((opt) => {
            const active = opt.value === confidenceMin;
            return (
              <button
                key={opt.value}
                onClick={() => onConfidenceChange(opt.value)}
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: "6px",
                  color: active ? "rgba(147,197,253,0.95)" : "rgba(100,100,100,0.85)",
                  background: active ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)",
                  border: active
                    ? "1px solid rgba(59,130,246,0.22)"
                    : "1px solid rgba(255,255,255,0.05)",
                  transition: "all 150ms",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Signal type breakdown */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: "11px",
        }}
      >
        <span className="tracking-widest uppercase block mb-2" style={LABEL_STYLE}>
          Active Signals
        </span>
        <div className="flex flex-col gap-1.5">
          {SIGNAL_TYPES.map((type) => {
            const count = filtered.filter((s) => s.type === type).length;
            return (
              <div key={type} className="flex items-center justify-between">
                <span style={{ fontSize: "10.5px", color: "rgba(140,140,140,0.85)" }}>
                  {TYPE_LABELS[type]}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: TYPE_COLORS[type],
                  }}
                >
                  {count}
                </span>
              </div>
            );
          })}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.05)",
              paddingTop: "6px",
              marginTop: "2px",
            }}
            className="flex items-center justify-between"
          >
            <span style={{ fontSize: "10.5px", color: "rgba(100,100,100,0.8)" }}>
              Total
            </span>
            <span
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "rgba(220,220,220,0.97)",
              }}
            >
              {filtered.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
