export type EventCategory =
  | "politics"
  | "conflict"
  | "intel"
  | "maritime"
  | "humanitarian"
  | "energy"
  | "air";

export type EventSeverity = "low" | "medium" | "high" | "critical";

export type SourceType =
  | "official"
  | "media"
  | "specialist"
  | "unverified"
  | "ngo"
  | "maritime_source"
  | "intel_source";

export type VerificationStatus =
  | "confirmed"
  | "reported"
  | "single_source"
  | "unverified"
  | "disputed";

export type OsintEvent = {
  id: string;
  title: string;
  summary: string;
  category: EventCategory;
  severity: EventSeverity;
  location: string;
  time: string;
  sourceType: SourceType;
  verification: VerificationStatus;
  tags?: string[];
  coordinates?: { lat: number; lng: number };
};
