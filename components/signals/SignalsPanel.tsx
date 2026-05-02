"use client";
import { useState } from "react";
import { Radio } from "lucide-react";
import type { OsintSignal, SignalType } from "@/types/signal";
import { SIGNAL_TYPE_OPTIONS } from "@/types/signal";

const TYPE_COLORS: Record<SignalType, { badge: string; text: string }> = {
  source: {
    badge: "rgba(96,165,250,0.12)",
    text: "rgba(96,165,250,0.9)",
  },
  electronic: {
    badge: "rgba(74,222,128,0.1)",
    text: "rgba(74,222,128,0.9)",
  },
  "early-warning": {
    badge: "rgba(251,191,36,0.1)",
    text: "rgba(251,191,36,0.9)",
  },
};

const TYPE_LABELS: Record<SignalType, string> = {
  source: "SOURCE",
  electronic: "ELECTRONIC",
  "early-warning": "EARLY WARNING",
};

function confidenceColor(score: number): string {
  if (score >= 70) return "rgba(74,222,128,0.9)";
  if (score >= 40) return "rgba(251,191,36,0.9)";
  return "rgba(248,113,113,0.9)";
}

export function SignalsPanel({
  signals,
  confidenceMin,
  selectedId,
  onSelect,
}: {
  signals: OsintSignal[];
  confidenceMin: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [activeType, setActiveType] = useState<SignalType | "all">("all");

  const displayed = signals
    .filter((s) => s.confidence >= confidenceMin)
    .filter((s) => activeType === "all" || s.type === activeType);

  return (
    <div
      className="flex flex-col h-full flex-shrink-0"
      style={{
        width: "372px",
        background: "rgba(10,10,10,0.95)",
        borderLeft: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-2">
          <Radio size={11} style={{ color: "rgba(96,165,250,0.7)" }} />
          <span
            className="font-semibold tracking-widest uppercase"
            style={{ fontSize: "10px", color: "rgba(170,170,170,0.8)" }}
          >
            Signal Feed
          </span>
        </div>
        <span style={{ fontSize: "10.5px", color: "rgba(100,100,100,0.85)" }}>
          {displayed.length} Signals
        </span>
      </div>


      {/* Type filter toggles */}
      <div
        className="flex items-center gap-1 px-3 py-2 flex-shrink-0 flex-wrap"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        {SIGNAL_TYPE_OPTIONS.map((opt) => {
          const active = opt.key === activeType;
          return (
            <button
              key={opt.key}
              onClick={() => setActiveType(opt.key)}
              style={{
                fontSize: "9.5px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                padding: "3px 8px",
                borderRadius: "5px",
                color: active
                  ? "rgba(147,197,253,0.95)"
                  : "rgba(100,100,100,0.85)",
                background: active ? "rgba(59,130,246,0.12)" : "transparent",
                border: active
                  ? "1px solid rgba(59,130,246,0.2)"
                  : "1px solid transparent",
                transition: "all 150ms",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Signal list */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          padding: "8px 10px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {displayed.map((signal) => {
          const colors = TYPE_COLORS[signal.type];
          const isSelected = signal.id === selectedId;
          return (
            <div
              key={signal.id}
              onClick={() => onSelect(signal.id)}
              style={{
                background: isSelected ? "rgba(28,28,28,0.9)" : "rgba(18,18,18,0.7)",
                border: isSelected
                  ? "1px solid rgba(74,222,128,0.28)"
                  : "1px solid rgba(255,255,255,0.05)",
                borderRadius: "8px",
                padding: "10px 12px",
                cursor: "pointer",
              }}
            >
              {/* Type badge + confidence */}
              <div className="flex items-center justify-between mb-2">
                <span
                  style={{
                    fontSize: "8.5px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: colors.badge,
                    color: colors.text,
                  }}
                >
                  {TYPE_LABELS[signal.type]}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    style={{ fontSize: "9px", color: "rgba(100,100,100,0.7)" }}
                  >
                    CONF
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: confidenceColor(signal.confidence),
                    }}
                  >
                    {signal.confidence}%
                  </span>
                </div>
              </div>

              {/* Source label */}
              <div
                className="mb-1.5"
                style={{
                  fontSize: "10.5px",
                  fontWeight: 600,
                  color: "rgba(170,170,170,0.85)",
                }}
              >
                {signal.source_label}
              </div>

              {/* Raw text */}
              <p
                style={{
                  fontSize: "11px",
                  color: "rgba(130,130,130,0.85)",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {signal.raw_text}
              </p>

              {/* Timestamp + linked event */}
              <div className="flex items-center justify-between mt-2">
                <span
                  style={{ fontSize: "9.5px", color: "rgba(85,85,85,0.9)" }}
                >
                  {signal.timestamp}
                </span>
                {signal.linked_event_id && (
                  <span
                    style={{
                      fontSize: "8.5px",
                      color: "rgba(96,165,250,0.6)",
                      letterSpacing: "0.03em",
                    }}
                  >
                    → Event #{signal.linked_event_id}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="flex-shrink-0 px-4 py-2.5"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <span style={{ fontSize: "11px", color: "rgba(100,100,100,0.6)" }}>
          Live signal monitoring active
        </span>
      </div>
    </div>
  );
}
