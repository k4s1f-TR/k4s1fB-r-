import type { RegionKey } from "./event";

export type SignalType = "source" | "electronic" | "early-warning";

export type OsintSignal = {
  id: string;
  type: SignalType;
  confidence: number; // 0–100
  source_label: string;
  raw_text: string;
  timestamp: string;
  region: RegionKey;
  coordinates: { lat: number; lng: number };
  linked_event_id?: string;
};

export const SIGNAL_TYPE_OPTIONS: { key: SignalType | "all"; label: string }[] = [
  { key: "all", label: "All Signals" },
  { key: "source", label: "Source" },
  { key: "electronic", label: "Electronic" },
  { key: "early-warning", label: "Early Warning" },
];
