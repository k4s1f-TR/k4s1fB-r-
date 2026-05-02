"use client";
import { useState } from "react";
import {
  Building2,
  ChevronDown,
  Search,
  SlidersHorizontal,
  Bookmark,
  ArrowRight,
} from "lucide-react";
import type { OsintEvent, EventSeverity } from "@/types/event";
import { mockSources } from "@/data/mockSources";

type SeverityFilter = "all" | EventSeverity;

const SEVERITY_PILLS: { key: SeverityFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "critical", label: "Critical" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
];

const SEV: Record<EventSeverity, { text: string; border: string; bg: string; accent: string }> = {
  critical: { text: "rgba(239,68,68,0.95)", border: "rgba(239,68,68,0.4)", bg: "rgba(239,68,68,0.1)", accent: "#ef4444" },
  high:     { text: "rgba(249,115,22,0.95)", border: "rgba(249,115,22,0.4)", bg: "rgba(249,115,22,0.1)", accent: "#f97316" },
  medium:   { text: "rgba(234,179,8,0.95)",  border: "rgba(234,179,8,0.4)",  bg: "rgba(234,179,8,0.1)",  accent: "#eab308" },
  low:      { text: "rgba(140,140,140,0.9)", border: "rgba(100,100,100,0.3)", bg: "rgba(100,100,100,0.08)", accent: "#555" },
};

const PILL_ACTIVE: Record<SeverityFilter, { text: string; border: string; bg: string }> = {
  all:      { text: "rgba(147,197,253,0.95)", border: "rgba(96,165,250,0.45)", bg: "rgba(96,165,250,0.1)" },
  critical: { text: "rgba(239,68,68,0.95)",  border: "rgba(239,68,68,0.5)",   bg: "rgba(239,68,68,0.12)" },
  high:     { text: "rgba(249,115,22,0.95)", border: "rgba(249,115,22,0.5)",  bg: "rgba(249,115,22,0.12)" },
  medium:   { text: "rgba(234,179,8,0.95)",  border: "rgba(234,179,8,0.5)",   bg: "rgba(234,179,8,0.12)" },
  low:      { text: "rgba(160,160,160,0.95)", border: "rgba(100,100,100,0.4)", bg: "rgba(100,100,100,0.1)" },
};

function getSourceName(sourceId: string): string {
  return mockSources.find((s) => s.id === sourceId)?.name ?? sourceId;
}

/* ─── Side panel mock data ──────────────────────────────────────── */
type SignalRowData = {
  label: string;
  value: string;
  change?: string;
  up?: boolean;
  detail?: {
    left: string;
    leftUp: boolean;
    right: string;
    rightUp: boolean;
  };
};

const GLOBAL_ECON_ROWS: SignalRowData[] = [
  { label: "USD/TRY",   value: "32.84", change: "+0.42%", up: true  },
  { label: "EUR/TRY",   value: "35.21", change: "-0.18%", up: false },
  { label: "GBP/TRY",   value: "41.15", change: "+0.61%", up: true  },
  { label: "Gold",      value: "2,385", change: "+0.89%", up: true  },
  { label: "Brent Oil", value: "84.20", change: "-0.33%", up: false },
];

const TR_BIST_ROWS: SignalRowData[] = [
  { label: "BIST 100",  value: "9,842",    change: "+1.24%", up: true },
  { label: "BIST 30",   value: "10,215",   change: "+1.38%", up: true },
  { label: "ASELS",     value: "128.60",   change: "+2.10%", up: true },
  { label: "Volume",    value: "42.3 Billion"                          },
  {
    label: "Advancers / Decliners",
    value: "",
    detail: { left: "312", leftUp: true, right: "187", rightUp: false },
  },
];

const CRYPTO_ROWS: SignalRowData[] = [
  { label: "BTC", value: "64,820", change: "+1.12%", up: true },
  { label: "ETH", value: "3,180", change: "+0.74%", up: true },
  { label: "BNB", value: "582.4", change: "-0.29%", up: false },
  { label: "SOL", value: "148.6", change: "+2.06%", up: true },
  { label: "XRP", value: "0.532", change: "-0.41%", up: false },
];

/* ─── Side panel sub-components ────────────────────────────────── */
function SignalRow({ label, value, change, up, detail }: SignalRowData) {
  const changeColor =
    up === true  ? "rgba(74,222,128,0.85)"
    : up === false ? "rgba(239,68,68,0.85)"
    : "rgba(90,90,90,0.8)";
  const detailUpColor = "rgba(74,222,128,0.85)";
  const detailDownColor = "rgba(239,68,68,0.85)";
  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
    >
      <span style={{ fontSize: "10.5px", color: "rgba(100,100,100,0.9)" }}>{label}</span>
      <div className="flex items-center gap-1.5">
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "rgba(195,205,220,0.9)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </span>
        {detail && (
          <div
            className="flex items-center gap-1"
            style={{
              fontSize: "9.5px",
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span style={{ color: "rgba(195,205,220,0.9)" }}>{detail.left}</span>
            <span style={{ color: detail.leftUp ? detailUpColor : detailDownColor }}>
              {detail.leftUp ? "▲" : "▼"}
            </span>
            <span style={{ color: "rgba(90,90,90,0.8)" }}>/</span>
            <span style={{ color: "rgba(195,205,220,0.9)" }}>{detail.right}</span>
            <span style={{ color: detail.rightUp ? detailUpColor : detailDownColor }}>
              {detail.rightUp ? "▲" : "▼"}
            </span>
          </div>
        )}
        {change !== undefined && (
          <span style={{ fontSize: "9.5px", fontWeight: 600, color: changeColor }}>
            {up === true ? "▲" : up === false ? "▼" : ""}{change}
          </span>
        )}
      </div>
    </div>
  );
}

function CompactMarketPanel({
  title,
  rows,
}: {
  title: string;
  rows: SignalRowData[];
}) {
  return (
    <div
      style={{
        width: "100%",
        background: "rgba(12,12,12,0.97)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "10px",
        padding: "12px 14px",
      }}
    >
      <p
        style={{
          fontSize: "10.5px",
          fontWeight: 700,
          color: "rgba(175,185,200,0.88)",
          marginBottom: "8px",
        }}
      >
        {title}
      </p>
      {rows.map((row) => (
        <SignalRow key={row.label} {...row} />
      ))}
    </div>
  );
}

/* ─── Event severity badge ──────────────────────────────────────── */
function SevBadge({ severity }: { severity: EventSeverity }) {
  const s = SEV[severity];
  return (
    <span
      className="px-1.5 py-0.5 rounded uppercase tracking-wide"
      style={{ fontSize: "9px", fontWeight: 700, background: s.bg, color: s.text, border: `1px solid ${s.border}`, flexShrink: 0 }}
    >
      {severity}
    </span>
  );
}


/* ─── Compact list card ─────────────────────────────────────────── */
function ListCard({
  event,
  selected,
  onSelect,
}: {
  event: OsintEvent;
  selected: boolean;
  onSelect: () => void;
}) {
  const s = SEV[event.severity];
  return (
    <div
      onClick={onSelect}
      className="relative cursor-pointer"
      style={{
        background: selected ? "rgba(59,130,246,0.06)" : "rgba(255,255,255,0.018)",
        border: selected ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.055)",
        borderRadius: "7px",
        padding: "10px 12px 10px 16px",
        marginBottom: "5px",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.09)";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.018)";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.055)";
        }
      }}
    >
      {/* severity accent */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: s.accent, opacity: 0.6, borderRadius: "7px 0 0 7px" }}
      />

      {/* title row */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p
          className="leading-snug line-clamp-2 flex-1"
          style={{ fontSize: "12px", fontWeight: 500, color: selected ? "rgba(220,235,255,0.97)" : "rgba(185,205,230,0.85)" }}
        >
          {event.title}
        </p>
        <button
          style={{ color: "rgba(60,60,60,0.8)", flexShrink: 0, marginTop: "1px" }}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(147,197,253,0.8)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(60,60,60,0.8)")}
        >
          <Bookmark size={12} />
        </button>
      </div>

      {/* meta row */}
      <div className="flex items-center justify-between">
        <span style={{ fontSize: "10px", color: "rgba(75,75,75,0.9)" }}>{event.time}</span>
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: "10px", color: "rgba(95,95,95,0.85)" }}>{getSourceName(event.sourceId)}</span>
          <SevBadge severity={event.severity} />
        </div>
      </div>
    </div>
  );
}

/* ─── Main export ─────────────────────────────────────────────── */
export function PoliticsPanel({ events }: { events: OsintEvent[] }) {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = events.filter((e) => {
    if (severityFilter !== "all" && e.severity !== severityFilter) return false;
    if (
      search.trim() &&
      !e.title.toLowerCase().includes(search.toLowerCase()) &&
      !e.summary.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div
      className="flex flex-1 min-h-0 overflow-hidden"
      style={{ background: "rgba(10,10,10,0.97)" }}
    >
      {/* Left panel area */}
      <div className="flex-1" />

      {/* ── Center column ───────────────────────────── */}
      <div
        className="flex flex-col flex-shrink-0 py-4 gap-3"
        style={{ width: "920px" }}
      >
        {/* TOP: Controls panel */}
        <div
          className="flex-shrink-0 px-4 py-3"
          style={{
            background: "rgba(12,12,12,0.97)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "10px",
          }}
        >
          {/* Title row */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Building2 size={13} style={{ color: "rgba(100,100,100,0.7)" }} />
              <span
                className="tracking-widest uppercase font-semibold"
                style={{ fontSize: "10px", color: "rgba(155,155,155,0.85)" }}
              >
                Politics Monitor
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="flex items-center gap-1 rounded px-2 py-1"
                style={{ fontSize: "10.5px", color: "rgba(120,120,120,0.9)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                All Sources <ChevronDown size={10} />
              </button>
              <button
                className="flex items-center justify-center rounded w-6 h-6"
                style={{ color: "rgba(80,80,80,0.85)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(160,160,160,0.9)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(80,80,80,0.85)")}
              >
                <SlidersHorizontal size={11} />
              </button>
            </div>
          </div>

          {/* Severity pills */}
          <div className="flex items-center gap-1 mb-2.5">
            {SEVERITY_PILLS.map((pill) => {
              const active = severityFilter === pill.key;
              const pa = active ? PILL_ACTIVE[pill.key] : null;
              return (
                <button
                  key={pill.key}
                  onClick={() => setSeverityFilter(pill.key)}
                  className="px-2.5 py-1 rounded transition-all duration-150"
                  style={{
                    fontSize: "10.5px",
                    fontWeight: active ? 600 : 400,
                    color: active ? pa!.text : "rgba(65,65,65,0.85)",
                    background: active ? pa!.bg : "transparent",
                    border: active ? `1px solid ${pa!.border}` : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div
            className="flex items-center gap-2 rounded px-2.5 py-1.5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <Search size={11} style={{ color: "rgba(65,65,65,0.8)", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search politics events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none"
              style={{ fontSize: "11px", color: "rgba(155,155,155,0.9)" }}
            />
          </div>
        </div>

        {/* BOTTOM: Event list panel */}
        <div
          className="flex flex-col flex-1 min-h-0"
          style={{
            background: "rgba(12,12,12,0.97)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >

        {/* Card list */}
        <div className="flex-1 min-h-0 overflow-y-auto" style={{ padding: "8px 10px" }}>
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full" style={{ fontSize: "11px", color: "rgba(60,60,60,0.85)" }}>
              No events match filters.
            </div>
          ) : (
            filtered.map((event) => (
              <ListCard
                key={event.id}
                event={event}
                selected={selectedId === event.id}
                onSelect={() => setSelectedId(event.id === selectedId ? null : event.id)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div
          className="flex-shrink-0 px-4 py-2 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <span style={{ fontSize: "10px", color: "rgba(60,60,60,0.85)" }}>
            {filtered.length} of {events.length} results
          </span>
          <button
            className="flex items-center gap-1 transition-colors duration-150"
            style={{ fontSize: "10.5px", color: "rgba(96,165,250,0.6)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(147,197,253,0.9)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(96,165,250,0.6)")}
          >
            View all <ArrowRight size={10} />
          </button>
        </div>
        </div>{/* end bottom event list panel */}
      </div>

      {/* Right panel area */}
      <div
        className="flex flex-col flex-shrink-0 gap-3 py-4 pl-3 pr-4"
        style={{ width: "268px" }}
      >
        <CompactMarketPanel title="Global Economics" rows={GLOBAL_ECON_ROWS} />
        <CompactMarketPanel title="TR-BIST Economics" rows={TR_BIST_ROWS} />
        <CompactMarketPanel title="Crypto Assets" rows={CRYPTO_ROWS} />
      </div>
    </div>
  );
}
