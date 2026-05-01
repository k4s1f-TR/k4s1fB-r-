"use client";
import {
  EventCategory,
  EventSeverity,
  SourceType,
  VerificationStatus,
} from "@/types/event";

type BadgeVariant =
  | EventCategory
  | EventSeverity
  | SourceType
  | VerificationStatus;

// Each badge: [text color, background, border color]
const BADGE_STYLES: Record<string, [string, string, string]> = {
  // Category
  politics:       ["rgba(147,197,253,0.9)",  "rgba(29,78,216,0.15)",   "rgba(59,130,246,0.25)"],
  conflict:       ["rgba(252,165,165,0.9)",  "rgba(153,27,27,0.2)",    "rgba(239,68,68,0.25)"],
  intel:          ["rgba(196,181,253,0.9)",  "rgba(109,40,217,0.18)",  "rgba(139,92,246,0.25)"],
  maritime:       ["rgba(103,232,249,0.9)",  "rgba(14,116,144,0.2)",   "rgba(6,182,212,0.25)"],
  humanitarian:   ["rgba(110,231,183,0.9)",  "rgba(5,150,105,0.18)",   "rgba(16,185,129,0.25)"],
  energy:         ["rgba(252,211,77,0.9)",   "rgba(180,83,9,0.18)",    "rgba(245,158,11,0.25)"],
  air:            ["rgba(125,211,252,0.9)",  "rgba(3,105,161,0.18)",   "rgba(56,189,248,0.25)"],
  // Severity
  low:            ["rgba(74,222,128,0.9)",   "rgba(20,83,45,0.25)",    "rgba(34,197,94,0.25)"],
  medium:         ["rgba(252,211,77,0.9)",   "rgba(120,53,15,0.22)",   "rgba(245,158,11,0.25)"],
  high:           ["rgba(251,146,60,0.9)",   "rgba(154,52,18,0.22)",   "rgba(249,115,22,0.25)"],
  critical:       ["rgba(252,165,165,0.9)",  "rgba(153,27,27,0.25)",   "rgba(239,68,68,0.3)"],
  // Source
  official:       ["rgba(148,163,184,0.85)", "rgba(30,41,59,0.4)",     "rgba(100,116,139,0.25)"],
  media:          ["rgba(148,163,184,0.85)", "rgba(30,41,59,0.4)",     "rgba(100,116,139,0.25)"],
  specialist:     ["rgba(167,139,250,0.85)", "rgba(76,29,149,0.18)",   "rgba(139,92,246,0.22)"],
  unverified:     ["rgba(202,138,4,0.85)",   "rgba(113,63,18,0.2)",    "rgba(202,138,4,0.22)"],
  ngo:            ["rgba(110,231,183,0.85)", "rgba(6,78,59,0.2)",      "rgba(16,185,129,0.22)"],
  maritime_source:["rgba(103,232,249,0.85)", "rgba(8,70,84,0.2)",      "rgba(6,182,212,0.22)"],
  intel_source:   ["rgba(196,181,253,0.85)", "rgba(76,29,149,0.18)",   "rgba(139,92,246,0.22)"],
  // Verification
  confirmed:      ["rgba(74,222,128,0.9)",   "rgba(20,83,45,0.22)",    "rgba(34,197,94,0.25)"],
  reported:       ["rgba(252,211,77,0.9)",   "rgba(120,53,15,0.2)",    "rgba(245,158,11,0.25)"],
  single_source:  ["rgba(251,146,60,0.85)",  "rgba(154,52,18,0.18)",   "rgba(249,115,22,0.22)"],
  disputed:       ["rgba(252,165,165,0.85)", "rgba(153,27,27,0.2)",    "rgba(239,68,68,0.25)"],
};

const BADGE_LABELS: Record<string, string> = {
  politics: "POLITICS", conflict: "CONFLICT", intel: "INTEL",
  maritime: "MARITIME", humanitarian: "HUMANITARIAN", energy: "ENERGY", air: "AIR",
  low: "LOW", medium: "MEDIUM", high: "HIGH", critical: "CRITICAL",
  official: "OFFICIAL", media: "MEDIA", specialist: "SPECIALIST",
  unverified: "UNVERIFIED", ngo: "NGO",
  maritime_source: "MARITIME SOURCE", intel_source: "INTEL SOURCE",
  confirmed: "CONFIRMED", reported: "REPORTED",
  single_source: "SINGLE SOURCE", disputed: "DISPUTED",
};

const FALLBACK: [string, string, string] = [
  "rgba(148,163,184,0.85)",
  "rgba(30,41,59,0.4)",
  "rgba(100,116,139,0.25)",
];

export function StatusBadge({ variant }: { variant: BadgeVariant }) {
  const [color, bg, border] = BADGE_STYLES[variant] ?? FALLBACK;
  const label = BADGE_LABELS[variant] ?? variant.toUpperCase().replace(/_/g, " ");

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "1.5px 5px",
        borderRadius: "4px",
        fontSize: "9.5px",
        fontWeight: 600,
        letterSpacing: "0.06em",
        color,
        background: bg,
        border: `1px solid ${border}`,
        lineHeight: 1.4,
      }}
    >
      {label}
    </span>
  );
}
