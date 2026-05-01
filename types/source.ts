import type { EventCategory, RegionKey } from "./event";

export type OsintSourceType =
  | "OFFICIAL"
  | "MEDIA"
  | "SPECIALIST"
  | "NGO"
  | "UNVERIFIED"
  | "MARITIME_SOURCE"
  | "INTEL_SOURCE"
  | "SIGNAL_SOURCE"
  | "OPEN_DATA";

export type SourceStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "FUTURE";

export type OsintSource = {
  id: string;
  name: string;
  type: OsintSourceType;
  status: SourceStatus;
  categories: EventCategory[];
  regions: RegionKey[];
  lastChecked: string;
  description: string;
  url?: string;
  eventCount?: number;
};
