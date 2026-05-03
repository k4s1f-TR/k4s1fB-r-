"use client";

import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import maplibregl from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";
import { OsintEvent } from "@/types/event";
import type { SocmintReport } from "@/types/socmint";
import { worldCapitals } from "@/data/worldCapitals";
import {
  type MapMode,
  type CameraPreset,
  type MapPadding,
  cameraForMode,
  paddingForMode,
  cameraEquals,
  paddingEquals,
} from "./cameraPresets";

const STYLE_URL = "https://demotiles.maplibre.org/style.json";
const CONTROL_ZOOM_DELTA = 0.5;
const MAP_OUTER_BACKGROUND_COLOR = "#000000";
const MAP_BACKGROUND_COLOR = "rgba(0, 0, 0, 0)";
const MAP_WATER_COLOR = "#0B0C0C";
const MAP_LAND_COLOR = "#8A8C82";
const MAP_LAND_OVERLAY_OPACITY = 0.5;
const MAP_BORDER_COLOR = "rgba(185, 189, 184, 0.46)";
const MAP_COASTLINE_COLOR = "rgba(170, 175, 171, 0.5)";
const MAP_ADMIN_LINE_COLOR = "rgba(144, 150, 146, 0.22)";
const COUNTRY_LABEL_COLOR = "rgba(232, 234, 230, 0.9)";
const COUNTRY_LABEL_HALO = "rgba(0, 0, 0, 0.92)";
const CAPITAL_LABEL_COLOR = "rgba(200, 204, 200, 0.74)";
const MAJOR_CITY_LABEL_COLOR = "rgba(164, 169, 166, 0.56)";
const SECONDARY_CITY_LABEL_COLOR = "rgba(145, 151, 148, 0.46)";
const WATER_LABEL_COLOR = "rgba(128, 133, 131, 0.38)";
const SECONDARY_WATER_LABEL_COLOR = "rgba(108, 114, 112, 0.3)";
const FIRST_STABLE_FRAME_FALLBACK_MS = 200;
const MAP_RESOURCE_ORIGIN = "https://demotiles.maplibre.org";
const CAPITAL_SOURCE_ID = "borueyes-world-capitals";
const PREMIUM_GLOBE_MAX_DPR = 2;
const EVENT_SOURCE_ID = "borueyes-events";
const EVENT_GLOW_LAYER_ID = "borueyes-event-glow";
const EVENT_RING_LAYER_ID = "borueyes-event-ring";
const EVENT_CORE_LAYER_ID = "borueyes-event-core";
const EVENT_POLITICS_ICON_LAYER_ID = "borueyes-event-politics-icon";
const EVENT_HIT_LAYER_ID = "borueyes-event-hit";
const EVENT_POLITICS_ICON_PREFIX = "borueyes-politics-globe";
const CITY_SOURCE_ID = "borueyes-major-cities";
const WATER_SOURCE_ID = "borueyes-water-labels";
const SIGNAL_SOURCE_ID = "borueyes-signals";
const SIGNAL_CORE_LAYER_ID = "borueyes-signal-core";
const SIGNAL_HIT_LAYER_ID = "borueyes-signal-hit";
const SIGNAL_ICON_PREFIX = "borueyes-socmint-source";
const DEG_TO_RAD = Math.PI / 180;
const SIGNAL_FRONT_HEMISPHERE_DOT_MIN = 0.08;

type MapContainerSize = {
  width: number;
  height: number;
};

const CITY_LABELS = [
  { name: "Istanbul", coordinates: [28.9784, 41.0082], minZoom: 3.8 },
  { name: "Dubai", coordinates: [55.2708, 25.2048], minZoom: 4.8 },
  { name: "Jeddah", coordinates: [39.1979, 21.4858], minZoom: 5.0 },
] as const;

const WATER_LABELS = [
  { name: "Mediterranean Sea", coordinates: [25.5, 35.4], minZoom: 3 },
  { name: "Black Sea", coordinates: [34, 43.2], minZoom: 3.2 },
  { name: "Red Sea", coordinates: [38.7, 20.7], minZoom: 3.1 },
  { name: "Persian Gulf", coordinates: [51.8, 26.8], minZoom: 3.2 },
  { name: "Gulf of Aden", coordinates: [47.8, 12.3], minZoom: 4.2 },
  { name: "Arabian Sea", coordinates: [61.5, 18.2], minZoom: 3.8 },
  { name: "Caspian Sea", coordinates: [51.2, 41.2], minZoom: 3.9 },
] as const;

const COUNTRY_CAPITAL_COORDINATES: { match: string[]; coordinates: [number, number] }[] = [
  { match: ["syria"], coordinates: [36.2765, 33.5138] },
  { match: ["jordan"], coordinates: [35.9106, 31.9539] },
  { match: ["iraq"], coordinates: [44.3661, 33.3152] },
  { match: ["iran"], coordinates: [51.389, 35.6892] },
  { match: ["lebanon"], coordinates: [35.5018, 33.8938] },
  { match: ["saudi arabia"], coordinates: [46.6753, 24.7136] },
  { match: ["yemen"], coordinates: [44.191, 15.3694] },
  { match: ["egypt"], coordinates: [31.2357, 30.0444] },
];

const AREA_COORDINATES: { match: string[]; coordinates: [number, number] }[] = [
  { match: ["gaza"], coordinates: [34.4668, 31.5017] },
  { match: ["strait of hormuz", "hormuz"], coordinates: [56.2833, 26.5667] },
  { match: ["red sea"], coordinates: [42.3768, 15.5527] },
];

type MarkerPalette = {
  fill: string;
  border: string;
  glow: string;
};

type MutableStyleLayer = {
  id?: string;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  [key: string]: unknown;
};

type MutableStyleJson = Omit<StyleSpecification, "layers"> & {
  layers: MutableStyleLayer[];
};

let darkStylePromise: Promise<StyleSpecification> | null = null;

const DEFAULT_MARKER_PALETTE: MarkerPalette = {
  fill: "#2EEB8F",
  border: "#7CFFC0",
  glow: "rgba(46, 235, 143, 0.22)",
};

type SocmintMarkerSource = "telegram" | "website" | "x";

const SOCMINT_MARKER_SOURCES: SocmintMarkerSource[] = ["telegram", "website", "x"];

const SOCMINT_MARKER_COLORS: Record<SocmintMarkerSource, string> = {
  telegram: "#F04438",
  website: "#C7CDD6",
  x: "#3B82F6",
};

const CATEGORY_MARKER_PALETTES: Partial<Record<OsintEvent["category"], MarkerPalette>> = {
  conflict: {
    fill: "#FF3B30",
    border: "#FF8A80",
    glow: "rgba(255, 59, 48, 0.30)",
  },
  politics: {
    fill: "#3B82F6",
    border: "#93C5FD",
    glow: "rgba(59, 130, 246, 0.24)",
  },
  intel: DEFAULT_MARKER_PALETTE,
  maritime: {
    fill: "#22D3EE",
    border: "#A5F3FC",
    glow: "rgba(34, 211, 238, 0.22)",
  },
  humanitarian: {
    fill: "#34D399",
    border: "#A7F3D0",
    glow: "rgba(52, 211, 153, 0.20)",
  },
  energy: {
    fill: "#F59E0B",
    border: "#FCD34D",
    glow: "rgba(245, 158, 11, 0.22)",
  },
};

const TURKEY_POLITICS_MARKER_PALETTE: MarkerPalette = {
  fill: "#EF4444",
  border: "#FCA5A5",
  glow: "rgba(239, 68, 68, 0.30)",
};

interface Props {
  mode: MapMode;
  events: OsintEvent[];
  selectedId: string | null;
  onSelectEvent?: (id: string) => void;
  signals?: SocmintReport[];
  selectedSignalId?: string | null;
  onSelectSignal?: (id: string) => void;
}

export interface GlobeMapHandle {
  centerView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

function setPaint(map: maplibregl.Map, layerId: string, property: string, value: unknown) {
  if (map.getLayer(layerId)) {
    map.setPaintProperty(layerId, property, value);
  }
}

function setLayout(map: maplibregl.Map, layerId: string, property: string, value: unknown) {
  if (map.getLayer(layerId)) {
    map.setLayoutProperty(layerId, property, value);
  }
}

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
  const width = Math.max(1, canvas.clientWidth);
  const height = Math.max(1, canvas.clientHeight);
  const dpr = Math.min(window.devicePixelRatio || 1, PREMIUM_GLOBE_MAX_DPR);
  const nextWidth = Math.round(width * dpr);
  const nextHeight = Math.round(height * dpr);

  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }

  return { width, height, dpr };
}

function drawPremiumGlobeBase(
  canvas: HTMLCanvasElement,
  globe: { centerX: number; centerY: number; radius: number } | null,
) {
  const context = canvas.getContext("2d");
  if (!context) return;

  const { width, height, dpr } = resizeCanvasToDisplaySize(canvas);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  context.fillStyle = MAP_OUTER_BACKGROUND_COLOR;
  context.fillRect(0, 0, width, height);

  if (!globe || globe.radius <= 0) return;

  const { centerX, centerY, radius } = globe;
  context.save();
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.clip();

  // Centered ocean fill — uniform dark base with no off-axis hotspot.
  const oceanGradient = context.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, radius * 1.02,
  );
  oceanGradient.addColorStop(0, "#131414");
  oceanGradient.addColorStop(0.55, MAP_WATER_COLOR);
  oceanGradient.addColorStop(1, "#020303");
  context.fillStyle = oceanGradient;
  context.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

  // Edge vignette — natural darkening toward the globe limb.
  const shadowGradient = context.createRadialGradient(
    centerX, centerY, radius * 0.38,
    centerX, centerY, radius * 1.02,
  );
  shadowGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  shadowGradient.addColorStop(1, "rgba(0, 0, 0, 0.62)");
  context.fillStyle = shadowGradient;
  context.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

  context.restore();

  // Thin globe limb ring.
  context.save();
  context.beginPath();
  context.arc(centerX, centerY, radius - 0.5, 0, Math.PI * 2);
  context.strokeStyle = "rgba(232, 236, 226, 0.08)";
  context.lineWidth = 1;
  context.stroke();
  context.restore();
}

function applyDarkMapStyle(map: maplibregl.Map) {
  setPaint(map, "background", "background-color", MAP_BACKGROUND_COLOR);
  setPaint(map, "background", "background-opacity", 0);
  setPaint(map, "countries-fill", "fill-color", MAP_LAND_COLOR);
  setPaint(map, "countries-fill", "fill-opacity", MAP_LAND_OVERLAY_OPACITY);
  setPaint(map, "countries-fill", "fill-outline-color", "rgba(172, 176, 171, 0.2)");
  setPaint(map, "crimea-fill", "fill-color", MAP_LAND_COLOR);
  setPaint(map, "crimea-fill", "fill-opacity", 0);
  setPaint(map, "crimea-fill", "fill-outline-color", "rgba(0, 0, 0, 0)");
  setPaint(map, "coastline", "line-color", MAP_COASTLINE_COLOR);
  setPaint(map, "coastline", "line-opacity", ["interpolate", ["linear"], ["zoom"], 1.5, 0.36, 5, 0.62]);
  setPaint(map, "coastline", "line-blur", 0.06);
  setPaint(map, "coastline", "line-width", ["interpolate", ["linear"], ["zoom"], 1, 0.46, 6, 1.28]);
  setPaint(map, "countries-boundary", "line-color", MAP_BORDER_COLOR);
  setPaint(map, "countries-boundary", "line-opacity", ["interpolate", ["linear"], ["zoom"], 2, 0.32, 5, 0.66]);
  setPaint(map, "countries-boundary", "line-width", ["interpolate", ["linear"], ["zoom"], 1, 0.28, 6, 0.82]);
  setPaint(map, "geolines", "line-color", MAP_ADMIN_LINE_COLOR);
  setPaint(map, "geolines", "line-opacity", 0.16);
  setPaint(map, "geolines-label", "text-color", "rgba(98, 102, 101, 0.34)");
  setPaint(map, "geolines-label", "text-halo-color", "rgba(0, 0, 0, 0.86)");
  setPaint(map, "geolines-label", "text-halo-width", 1);
  setPaint(map, "countries-label", "text-color", COUNTRY_LABEL_COLOR);
  setPaint(map, "countries-label", "text-halo-color", COUNTRY_LABEL_HALO);
  setPaint(map, "countries-label", "text-halo-width", 1.05);
  setPaint(map, "countries-label", "text-halo-blur", 0.05);
  setPaint(map, "countries-label", "text-opacity", ["interpolate", ["linear"], ["zoom"], 2, 0.58, 3, 0.78, 4, 0.9, 6, 0.96]);
  setLayout(map, "countries-label", "text-field", "{NAME}");
  setLayout(map, "countries-label", "text-transform", "none");
  setLayout(map, "countries-label", "text-size", ["interpolate", ["linear"], ["zoom"], 2, 8.8, 4, 10.8, 6, 12.5]);
  setLayout(map, "countries-label", "text-max-width", 7.5);
  setLayout(map, "countries-label", "text-padding", 8);
  setLayout(map, "countries-label", "text-letter-spacing", 0.012);
  setLayout(map, "countries-label", "text-allow-overlap", false);
  setLayout(map, "countries-label", "text-ignore-placement", false);
  setLayout(map, "countries-label", "symbol-avoid-edges", true);
  setLayout(map, "countries-label", "symbol-z-order", "viewport-y");
}

function applyGlobeAtmosphere(map: maplibregl.Map) {
  map.setSky({
    "sky-color": MAP_OUTER_BACKGROUND_COLOR,
    "horizon-color": "#080808",
    "sky-horizon-blend": 0.025,
    "atmosphere-blend": 0.055,
  });
}

function darkenStyleJson(base: StyleSpecification): StyleSpecification {
  const style = JSON.parse(JSON.stringify(base)) as MutableStyleJson;
  for (const layer of style.layers) {
    const p = layer.paint ?? {};
    const l = layer.layout ?? {};
    switch (layer.id) {
      case "background":
        layer.paint = { ...p, "background-color": MAP_BACKGROUND_COLOR, "background-opacity": 0 };
        break;
      case "countries-fill":
        layer.paint = {
          ...p,
          "fill-color": MAP_LAND_COLOR,
          "fill-opacity": MAP_LAND_OVERLAY_OPACITY,
          "fill-outline-color": "rgba(172, 176, 171, 0.19)",
        };
        break;
      case "crimea-fill":
        // countries-fill already renders Crimea at MAP_LAND_OVERLAY_OPACITY.
        // Rendering crimea-fill on top doubles the opacity (~0.75), creating a
        // bright peninsula patch against the Black Sea. Zero it out.
        layer.paint = {
          ...p,
          "fill-color": MAP_LAND_COLOR,
          "fill-opacity": 0,
          "fill-outline-color": "rgba(0, 0, 0, 0)",
        };
        break;
      case "coastline":
        layer.paint = {
          ...p,
          "line-color": MAP_COASTLINE_COLOR,
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 1.5, 0.36, 5, 0.62],
          "line-blur": 0.06,
          "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.46, 6, 1.28],
        };
        break;
      case "countries-boundary":
        layer.paint = {
          ...p,
          "line-color": MAP_BORDER_COLOR,
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 2, 0.32, 5, 0.66],
          "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.28, 6, 0.82],
        };
        break;
      case "geolines":
        layer.paint = { ...p, "line-color": MAP_ADMIN_LINE_COLOR, "line-opacity": 0.16 };
        break;
      case "geolines-label":
        layer.paint = {
          ...p,
          "text-color": "rgba(98, 102, 101, 0.34)",
          "text-halo-color": "rgba(0, 0, 0, 0.86)",
          "text-halo-width": 1,
        };
        break;
      case "countries-label":
        layer.paint = {
          ...p,
          "text-color": COUNTRY_LABEL_COLOR,
          "text-halo-color": COUNTRY_LABEL_HALO,
          "text-halo-width": 1.05,
          "text-halo-blur": 0.05,
          "text-opacity": ["interpolate", ["linear"], ["zoom"], 2, 0.58, 3, 0.78, 4, 0.9, 6, 0.96],
        };
        layer.layout = {
          ...l,
          "text-field": "{NAME}",
          "text-transform": "none",
          "text-size": ["interpolate", ["linear"], ["zoom"], 2, 8.8, 4, 10.8, 6, 12.5],
          "text-max-width": 7.5,
          "text-padding": 8,
          "text-letter-spacing": 0.012,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "symbol-avoid-edges": true,
          "symbol-z-order": "viewport-y",
        };
        break;
    }
  }
  return style as unknown as StyleSpecification;
}

function loadDarkStyleJson() {
  darkStylePromise ??= fetch(STYLE_URL)
    .then((res) => res.json() as Promise<StyleSpecification>)
    .then((base) => darkenStyleJson(base));

  return darkStylePromise;
}

if (typeof window !== "undefined") {
  void loadDarkStyleJson();
}

function hintMapResources() {
  ReactDOM.preconnect(MAP_RESOURCE_ORIGIN, { crossOrigin: "" });
  ReactDOM.prefetchDNS(MAP_RESOURCE_ORIGIN);
}

function cloneStyleJson(style: StyleSpecification): StyleSpecification {
  return JSON.parse(JSON.stringify(style)) as StyleSpecification;
}

function labelCollection(
  labels: readonly { name: string; coordinates: readonly number[]; minZoom: number }[],
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: labels.map((label) => ({
      type: "Feature",
      properties: {
        name: label.name,
        minZoom: label.minZoom,
      },
      geometry: {
        type: "Point",
        coordinates: [label.coordinates[0], label.coordinates[1]],
      },
    })),
  };
}

function capitalCollection(): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: worldCapitals.map((capital) => ({
      type: "Feature",
      properties: {
        name: capital.capital,
        country: capital.country,
        priority: capital.priority,
      },
      geometry: {
        type: "Point",
        coordinates: capital.coordinates,
      },
    })),
  };
}

function resolveEventCoordinates(event: OsintEvent): [number, number] | null {
  const searchText = `${event.title} ${event.location}`.toLowerCase();
  const capitalLocation = COUNTRY_CAPITAL_COORDINATES.find((location) =>
    location.match.some((needle) => searchText.includes(needle)),
  );

  if (capitalLocation) {
    return capitalLocation.coordinates;
  }

  const areaLocation = AREA_COORDINATES.find((location) =>
    location.match.some((needle) => searchText.includes(needle)),
  );

  if (areaLocation) {
    return areaLocation.coordinates;
  }

  if (event.coordinates) {
    return [event.coordinates.lng, event.coordinates.lat];
  }

  return null;
}

function markerPaletteFor(event: OsintEvent) {
  if (event.category === "politics" && event.markerVariant === "turkey-focus") {
    return TURKEY_POLITICS_MARKER_PALETTE;
  }

  return CATEGORY_MARKER_PALETTES[event.category] ?? DEFAULT_MARKER_PALETTE;
}

function politicsIconIdFor(event: OsintEvent) {
  return event.markerVariant === "turkey-focus"
    ? `${EVENT_POLITICS_ICON_PREFIX}-turkey`
    : `${EVENT_POLITICS_ICON_PREFIX}-default`;
}

function socmintMarkerSourceFor(report: SocmintReport): SocmintMarkerSource {
  const sourceText = [
    report.platform,
    report.sourceName,
    report.type,
    report.title,
    report.summary,
  ].join(" ").toLowerCase();

  if (
    sourceText.includes("telegram") ||
    /\btg\b/.test(sourceText) ||
    (report.platform === "telegram" && sourceText.includes("channel"))
  ) {
    return "telegram";
  }

  if (sourceText.includes("twitter") || /\bx\b/.test(sourceText)) {
    return "x";
  }

  return "website";
}

function eventsCollection(
  events: OsintEvent[],
  selectedId: string | null,
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: events.flatMap((event) => {
      const coordinates = resolveEventCoordinates(event);
      if (!coordinates) return [];
      const palette = markerPaletteFor(event);

      return [{
        type: "Feature",
        properties: {
          id: event.id,
          title: event.title,
          category: event.category,
          severity: event.severity,
          fillColor: palette.fill,
          borderColor: palette.border,
          glowColor: palette.glow,
          icon: politicsIconIdFor(event),
          markerVariant: event.markerVariant ?? "default",
          selected: event.id === selectedId,
        },
        geometry: {
          type: "Point",
          coordinates,
        },
      }];
    }),
  };
}

function signalsCollection(signals: SocmintReport[], selectedSignalId: string | null): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: signals.map((signal) => {
      return {
        type: "Feature",
        properties: {
          id: signal.id,
          type: signal.type,
          confidence: signal.confidenceScore ?? 0,
          icon: `${SIGNAL_ICON_PREFIX}-${socmintMarkerSourceFor(signal)}`,
          selected: signal.id === selectedSignalId,
        },
        geometry: {
          type: "Point",
          coordinates: signal.coordinates,
        },
      };
    }),
  };
}

function createPoliticsGlobeIconImage(palette: MarkerPalette) {
  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 48;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const cx = 24;
  const cy = 24;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = palette.fill;
  ctx.beginPath();
  ctx.arc(cx, cy, 16.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 16.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(248,250,252,0.96)";
  ctx.lineWidth = 1.75;
  ctx.beginPath();
  ctx.arc(cx, cy, 9.8, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(cx, cy, 4.2, 9.8, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - 9.2, cy);
  ctx.lineTo(cx + 9.2, cy);
  ctx.moveTo(cx - 7.2, cy - 5.7);
  ctx.quadraticCurveTo(cx, cy - 3.6, cx + 7.2, cy - 5.7);
  ctx.moveTo(cx - 7.2, cy + 5.7);
  ctx.quadraticCurveTo(cx, cy + 3.6, cx + 7.2, cy + 5.7);
  ctx.stroke();

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function addPoliticsEventIcons(map: maplibregl.Map) {
  const icons: [string, MarkerPalette][] = [
    [`${EVENT_POLITICS_ICON_PREFIX}-default`, CATEGORY_MARKER_PALETTES.politics!],
    [`${EVENT_POLITICS_ICON_PREFIX}-turkey`, TURKEY_POLITICS_MARKER_PALETTE],
  ];

  icons.forEach(([iconId, palette]) => {
    if (map.hasImage(iconId)) return;

    const image = createPoliticsGlobeIconImage(palette);
    if (image) {
      map.addImage(iconId, image, { pixelRatio: 2 });
    }
  });
}

function isSignalOnFrontHemisphere(centerLng: number, centerLat: number, signal: SocmintReport) {
  const centerLatRad = centerLat * DEG_TO_RAD;
  const signalLatRad = signal.coordinates[1] * DEG_TO_RAD;
  const lngDeltaRad = (signal.coordinates[0] - centerLng) * DEG_TO_RAD;

  const dot =
    Math.sin(centerLatRad) * Math.sin(signalLatRad) +
    Math.cos(centerLatRad) * Math.cos(signalLatRad) * Math.cos(lngDeltaRad);

  return dot > SIGNAL_FRONT_HEMISPHERE_DOT_MIN;
}

function visibleSignalsForGlobe(map: maplibregl.Map, signals: SocmintReport[]) {
  const center = map.getCenter();
  return signals.filter((signal) => isSignalOnFrontHemisphere(center.lng, center.lat, signal));
}

function drawTelegramSocmintIcon(ctx: CanvasRenderingContext2D, color: string) {
  ctx.save();
  ctx.lineJoin = "round";

  ctx.strokeStyle = "rgba(2,5,10,0.9)";
  ctx.lineWidth = 4.8;
  ctx.beginPath();
  ctx.moveTo(15.5, 31.5);
  ctx.lineTo(49.2, 16.8);
  ctx.lineTo(38.9, 48.2);
  ctx.lineTo(30.2, 37.8);
  ctx.lineTo(22.5, 43.5);
  ctx.lineTo(24.2, 34.8);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(15.5, 31.5);
  ctx.lineTo(49.2, 16.8);
  ctx.lineTo(38.9, 48.2);
  ctx.lineTo(30.2, 37.8);
  ctx.lineTo(22.5, 43.5);
  ctx.lineTo(24.2, 34.8);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(8,12,18,0.66)";
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(24.6, 34.7);
  ctx.lineTo(48.2, 17.5);
  ctx.lineTo(30.2, 37.8);
  ctx.stroke();

  ctx.restore();
}

function drawWebsiteSocmintIcon(ctx: CanvasRenderingContext2D, color: string) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = "rgba(2,5,10,0.9)";
  ctx.lineWidth = 5.6;
  ctx.beginPath();
  ctx.arc(32, 32, 17, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(16.9, 32);
  ctx.lineTo(47.1, 32);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(32, 32, 6.4, 17, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = 2.7;
  ctx.beginPath();
  ctx.arc(32, 32, 17, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(16.9, 32);
  ctx.lineTo(47.1, 32);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(32, 32, 6.4, 17, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = "700 9.4px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 3.2;
  ctx.strokeStyle = "rgba(2,5,10,0.92)";
  ctx.strokeText("WWW", 32, 32.3);
  ctx.fillText("WWW", 32, 32.3);

  ctx.restore();
}

function drawXSocmintIcon(ctx: CanvasRenderingContext2D, color: string) {
  ctx.save();
  ctx.lineCap = "square";
  ctx.lineJoin = "miter";
  ctx.miterLimit = 4;

  const drawRibbon = (points: [number, number][]) => {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  };

  const risingRibbon: [number, number][] = [
    [39.9, 15.6],
    [48.4, 15.6],
    [24.2, 48.4],
    [15.7, 48.4],
  ];
  const fallingRibbon: [number, number][] = [
    [15.9, 15.6],
    [25.1, 15.6],
    [48.1, 48.4],
    [38.9, 48.4],
  ];

  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(2,5,10,0.92)";
  ctx.lineWidth = 5;
  drawRibbon(risingRibbon);
  drawRibbon(fallingRibbon);

  ctx.strokeStyle = "rgba(191,219,254,0.28)";
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(20.8, 18.3);
  ctx.lineTo(42.7, 45.7);
  ctx.moveTo(43.1, 18.5);
  ctx.lineTo(21.1, 45.5);
  ctx.stroke();

  ctx.strokeStyle = "rgba(2,5,10,0.45)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(30.2, 31.3);
  ctx.lineTo(33.9, 36.1);
  ctx.stroke();

  ctx.restore();
}

function createFlatMarkerImage(drawIcon: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawIcon(ctx);

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function addSignalIcons(map: maplibregl.Map) {
  const drawBySource: Record<SocmintMarkerSource, (ctx: CanvasRenderingContext2D, color: string) => void> = {
    telegram: drawTelegramSocmintIcon,
    website: drawWebsiteSocmintIcon,
    x: drawXSocmintIcon,
  };

  SOCMINT_MARKER_SOURCES.forEach((source) => {
    const iconId = `${SIGNAL_ICON_PREFIX}-${source}`;
    if (map.hasImage(iconId)) return;

    const image = createFlatMarkerImage((ctx) => drawBySource[source](ctx, SOCMINT_MARKER_COLORS[source]));
    if (image) {
      map.addImage(iconId, image, { pixelRatio: 2 });
    }
  });
}

function addSignalLayers(map: maplibregl.Map) {
  if (!map.getSource(SIGNAL_SOURCE_ID)) {
    map.addSource(SIGNAL_SOURCE_ID, { type: "geojson", data: signalsCollection([], null) });
  }

  addSignalIcons(map);

  if (!map.getLayer(SIGNAL_CORE_LAYER_ID)) {
    map.addLayer({
      id: SIGNAL_CORE_LAYER_ID,
      type: "symbol",
      source: SIGNAL_SOURCE_ID,
      layout: {
        "icon-image": ["get", "icon"],
        "icon-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          3,
          ["case", ["==", ["get", "selected"], true], 0.76, 0.66],
          6,
          ["case", ["==", ["get", "selected"], true], 0.88, 0.78],
        ],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "icon-anchor": "center",
      },
      paint: {
        "icon-opacity": 1,
      },
    });
  }

  if (!map.getLayer(SIGNAL_HIT_LAYER_ID)) {
    map.addLayer({
      id: SIGNAL_HIT_LAYER_ID,
      type: "circle",
      source: SIGNAL_SOURCE_ID,
      paint: {
        "circle-radius": 16,
        "circle-color": "rgba(0,0,0,0)",
        "circle-opacity": 0.01,
      },
    });
  }
}

function updateSignalSource(map: maplibregl.Map, signals: SocmintReport[], selectedSignalId: string | null) {
  const source = map.getSource(SIGNAL_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  if (!source) return;

  const visibleSignals = visibleSignalsForGlobe(map, signals);
  const visibleSelectedId = visibleSignals.some((signal) => signal.id === selectedSignalId)
    ? selectedSignalId
    : null;

  source.setData(signalsCollection(visibleSignals, visibleSelectedId));
}

function addDetailLabelLayers(map: maplibregl.Map) {
  if (!map.getSource(CAPITAL_SOURCE_ID)) {
    map.addSource(CAPITAL_SOURCE_ID, {
      type: "geojson",
      data: capitalCollection(),
    });
  }

  if (!map.getLayer("borueyes-world-capital-labels")) {
    map.addLayer({
      id: "borueyes-world-capital-labels",
      type: "symbol",
      source: CAPITAL_SOURCE_ID,
      minzoom: 3.1,
      filter: ["==", ["get", "priority"], 1],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 3.1, 7.9, 6, 9.7],
        "text-offset": [0, 0.85],
        "text-anchor": "top",
        "text-letter-spacing": 0.01,
        "text-allow-overlap": false,
        "text-ignore-placement": true,
        "text-padding": 5,
        "symbol-avoid-edges": true,
      },
      paint: {
        "text-color": CAPITAL_LABEL_COLOR,
        "text-halo-color": COUNTRY_LABEL_HALO,
        "text-halo-width": 0.95,
        "text-halo-blur": 0.05,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 3.1, 0.52, 5.5, 0.78],
      },
    });
  }

  if (!map.getLayer("borueyes-world-capital-labels-mid")) {
    map.addLayer({
      id: "borueyes-world-capital-labels-mid",
      type: "symbol",
      source: CAPITAL_SOURCE_ID,
      minzoom: 4,
      filter: ["==", ["get", "priority"], 2],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 4, 7.5, 6, 9.0],
        "text-offset": [0, 0.85],
        "text-anchor": "top",
        "text-letter-spacing": 0.01,
        "text-allow-overlap": false,
        "text-ignore-placement": true,
        "text-padding": 5,
        "symbol-avoid-edges": true,
      },
      paint: {
        "text-color": "rgba(170, 175, 171, 0.58)",
        "text-halo-color": COUNTRY_LABEL_HALO,
        "text-halo-width": 0.9,
        "text-halo-blur": 0.05,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 4, 0.42, 6, 0.68],
      },
    });
  }

  if (!map.getLayer("borueyes-world-capital-labels-low")) {
    map.addLayer({
      id: "borueyes-world-capital-labels-low",
      type: "symbol",
      source: CAPITAL_SOURCE_ID,
      minzoom: 5.2,
      filter: ["==", ["get", "priority"], 3],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 5.2, 7.2, 7, 8.6],
        "text-offset": [0, 0.85],
        "text-anchor": "top",
        "text-letter-spacing": 0.01,
        "text-allow-overlap": false,
        "text-ignore-placement": true,
        "text-padding": 5,
        "symbol-avoid-edges": true,
      },
      paint: {
        "text-color": "rgba(150, 156, 153, 0.5)",
        "text-halo-color": COUNTRY_LABEL_HALO,
        "text-halo-width": 0.85,
        "text-halo-blur": 0.05,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 5.2, 0.34, 7, 0.56],
      },
    });
  }

  if (!map.getSource(CITY_SOURCE_ID)) {
    map.addSource(CITY_SOURCE_ID, {
      type: "geojson",
      data: labelCollection(CITY_LABELS),
    });
  }

  // Important non-capital cities stay below capitals in the visual hierarchy.
  if (!map.getLayer("borueyes-major-city-labels")) {
    map.addLayer({
      id: "borueyes-major-city-labels",
      type: "symbol",
      source: CITY_SOURCE_ID,
      minzoom: 3.8,
      filter: ["<=", ["get", "minZoom"], 4.2],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 3.8, 8.2, 6, 9.8],
        "text-offset": [0, 0.9],
        "text-anchor": "top",
        "text-letter-spacing": 0.01,
        "text-allow-overlap": false,
        "text-ignore-placement": true,
        "text-padding": 5,
        "symbol-avoid-edges": true,
      },
      paint: {
        "text-color": MAJOR_CITY_LABEL_COLOR,
        "text-halo-color": COUNTRY_LABEL_HALO,
        "text-halo-width": 0.9,
        "text-halo-blur": 0.05,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 3.8, 0.34, 5.5, 0.52],
      },
    });
  }

  if (!map.getLayer("borueyes-midtier-city-labels")) {
    map.addLayer({
      id: "borueyes-midtier-city-labels",
      type: "symbol",
      source: CITY_SOURCE_ID,
      minzoom: 4.8,
      filter: ["all",
        [">",  ["get", "minZoom"], 4.2],
        ["<=", ["get", "minZoom"], 4.9],
      ],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 4.8, 7.8, 6, 9.2],
        "text-offset": [0, 0.9],
        "text-anchor": "top",
        "text-allow-overlap": false,
        "text-ignore-placement": true,
        "text-padding": 5,
        "symbol-avoid-edges": true,
      },
      paint: {
        "text-color": MAJOR_CITY_LABEL_COLOR,
        "text-halo-color": COUNTRY_LABEL_HALO,
        "text-halo-width": 0.9,
        "text-halo-blur": 0.05,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 4.8, 0.28, 6, 0.46],
      },
    });
  }

  if (!map.getLayer("borueyes-secondary-city-labels")) {
    map.addLayer({
      id: "borueyes-secondary-city-labels",
      type: "symbol",
      source: CITY_SOURCE_ID,
      minzoom: 5,
      filter: [">", ["get", "minZoom"], 4.9],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 5, 7.6, 6.5, 8.8],
        "text-offset": [0, 0.9],
        "text-anchor": "top",
        "text-allow-overlap": false,
        "text-ignore-placement": true,
        "text-padding": 5,
        "symbol-avoid-edges": true,
      },
      paint: {
        "text-color": SECONDARY_CITY_LABEL_COLOR,
        "text-halo-color": COUNTRY_LABEL_HALO,
        "text-halo-width": 0.85,
        "text-halo-blur": 0.05,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0.22, 6.5, 0.4],
      },
    });
  }

  if (!map.getSource(WATER_SOURCE_ID)) {
    map.addSource(WATER_SOURCE_ID, {
      type: "geojson",
      data: labelCollection(WATER_LABELS),
    });
  }

  if (!map.getLayer("borueyes-water-labels")) {
    map.addLayer({
      id: "borueyes-water-labels",
      type: "symbol",
      source: WATER_SOURCE_ID,
      minzoom: 3,
      filter: ["<=", ["get", "minZoom"], 3.8],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 3, 9.2, 6, 11],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "symbol-avoid-edges": true,
      },
      paint: {
        "text-color": WATER_LABEL_COLOR,
        "text-halo-color": "rgba(0, 0, 0, 0.86)",
        "text-halo-width": 1,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0.26, 5, 0.44],
      },
    });
  }

  if (!map.getLayer("borueyes-secondary-water-labels")) {
    map.addLayer({
      id: "borueyes-secondary-water-labels",
      type: "symbol",
      source: WATER_SOURCE_ID,
      minzoom: 3.9,
      filter: [">", ["get", "minZoom"], 3.8],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 3.9, 8.6, 6, 10.6],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "symbol-avoid-edges": true,
      },
      paint: {
        "text-color": SECONDARY_WATER_LABEL_COLOR,
        "text-halo-color": "rgba(0, 0, 0, 0.86)",
        "text-halo-width": 1,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 3.9, 0.2, 5.2, 0.38],
      },
    });
  }
}

function addEventLayers(map: maplibregl.Map) {
  if (!map.getSource(EVENT_SOURCE_ID)) {
    map.addSource(EVENT_SOURCE_ID, {
      type: "geojson",
      data: eventsCollection([], null),
    });
  }

  addPoliticsEventIcons(map);

  if (!map.getLayer(EVENT_GLOW_LAYER_ID)) {
    map.addLayer({
      id: EVENT_GLOW_LAYER_ID,
      type: "circle",
      source: EVENT_SOURCE_ID,
      filter: ["!=", ["get", "category"], "politics"],
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 10, 6, 16],
        "circle-color": [
          "case",
          ["==", ["get", "selected"], true],
          "rgba(143, 211, 255, 0.20)",
          ["to-color", ["get", "glowColor"]],
        ],
        "circle-opacity": 1,
        "circle-blur": 0.5,
      },
    });
  }

  if (!map.getLayer(EVENT_RING_LAYER_ID)) {
    map.addLayer({
      id: EVENT_RING_LAYER_ID,
      type: "circle",
      source: EVENT_SOURCE_ID,
      filter: ["==", ["get", "selected"], true],
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 7.8, 6, 10.5],
        "circle-color": "rgba(0, 0, 0, 0)",
        "circle-stroke-color": "#8FD3FF",
        "circle-stroke-width": 1.35,
        "circle-opacity": 1,
      },
    });
  }

  if (!map.getLayer(EVENT_CORE_LAYER_ID)) {
    map.addLayer({
      id: EVENT_CORE_LAYER_ID,
      type: "circle",
      source: EVENT_SOURCE_ID,
      filter: ["!=", ["get", "category"], "politics"],
      paint: {
        "circle-radius": ["case", ["==", ["get", "selected"], true], 5.4, 4.2],
        "circle-color": ["to-color", ["get", "fillColor"]],
        "circle-opacity": [
          "case",
          ["==", ["get", "selected"], true],
          0.96,
          0.88,
        ],
        "circle-stroke-color": ["to-color", ["get", "borderColor"]],
        "circle-stroke-width": ["case", ["==", ["get", "selected"], true], 1, 0.75],
      },
    });
  }

  if (!map.getLayer(EVENT_POLITICS_ICON_LAYER_ID)) {
    map.addLayer({
      id: EVENT_POLITICS_ICON_LAYER_ID,
      type: "symbol",
      source: EVENT_SOURCE_ID,
      filter: ["==", ["get", "category"], "politics"],
      layout: {
        "icon-image": ["get", "icon"],
        "icon-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          3,
          [
            "case",
            ["==", ["get", "markerVariant"], "turkey-focus"],
            0.7,
            ["==", ["get", "selected"], true],
            0.62,
            0.56,
          ],
          6,
          [
            "case",
            ["==", ["get", "markerVariant"], "turkey-focus"],
            0.84,
            ["==", ["get", "selected"], true],
            0.76,
            0.68,
          ],
        ],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "icon-anchor": "center",
      },
      paint: {
        "icon-opacity": ["case", ["==", ["get", "selected"], true], 1, 0.95],
      },
    });
  }

  if (!map.getLayer(EVENT_HIT_LAYER_ID)) {
    map.addLayer({
      id: EVENT_HIT_LAYER_ID,
      type: "circle",
      source: EVENT_SOURCE_ID,
      paint: {
        "circle-radius": 14,
        "circle-color": "rgba(0, 0, 0, 0)",
        "circle-opacity": 0.01,
      },
    });
  }
}

function updateEventSource(map: maplibregl.Map, events: OsintEvent[], selectedId: string | null) {
  const source = map.getSource(EVENT_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  source?.setData(eventsCollection(events, selectedId));
}

function isAtCamera(map: maplibregl.Map, camera: CameraPreset) {
  const center = map.getCenter();
  return cameraEquals(
    {
      lng: center.lng,
      lat: center.lat,
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
    },
    camera,
  );
}

function isAtPadding(map: maplibregl.Map, padding: MapPadding) {
  return paddingEquals(map.getPadding(), padding);
}

function validContainerSize(element: HTMLDivElement): MapContainerSize | null {
  const rect = element.getBoundingClientRect();
  const width = Math.floor(rect.width);
  const height = Math.floor(rect.height);

  if (width <= 0 || height <= 0) return null;
  return { width, height };
}

function globeScreenFrame(map: maplibregl.Map) {
  const center = map.getCenter();
  const centerPoint = map.project(center);
  const horizonPoint = map.project([center.lng + 90, 0]);
  const radius = Math.max(0, Math.hypot(horizonPoint.x - centerPoint.x, horizonPoint.y - centerPoint.y) - 1);

  return {
    centerX: centerPoint.x,
    centerY: centerPoint.y,
    radius,
  };
}

export const GlobeMap = forwardRef<GlobeMapHandle, Props>(function GlobeMap({
  mode,
  events,
  selectedId,
  onSelectEvent,
  signals = [],
  selectedSignalId = null,
  onSelectSignal,
}: Props, ref) {
  hintMapResources();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onSelectEventRef = useRef(onSelectEvent);
  const onSelectSignalRef = useRef(onSelectSignal);
  const signalsRef = useRef(signals);
  const selectedSignalIdRef = useRef(selectedSignalId);
  const modeRef = useRef(mode);
  const [styleReady, setStyleReady] = useState(false);
  const [containerReady, setContainerReady] = useState(false);
  const hasAppliedFirstModeRef = useRef(false);

  useImperativeHandle(ref, () => ({
    centerView: () => {
      const map = mapRef.current;
      if (!map) return;
      const camera = cameraForMode(modeRef.current);
      const padding = paddingForMode(modeRef.current);
      if (isAtCamera(map, camera) && isAtPadding(map, padding)) return;
      map.stop();
      map.easeTo({ ...camera, padding, duration: 550 });
    },
    zoomIn: () => {
      const map = mapRef.current;
      if (!map) return;
      map.stop();
      map.easeTo({ zoom: map.getZoom() + CONTROL_ZOOM_DELTA, duration: 250 });
    },
    zoomOut: () => {
      const map = mapRef.current;
      if (!map) return;
      map.stop();
      map.easeTo({ zoom: map.getZoom() - CONTROL_ZOOM_DELTA, duration: 250 });
    },
  }), []);

  useEffect(() => {
    modeRef.current = mode;
    const map = mapRef.current;
    if (!map || !styleReady) return;
    const camera = cameraForMode(mode);
    const padding = paddingForMode(mode);
    const isFirstApply = !hasAppliedFirstModeRef.current;
    hasAppliedFirstModeRef.current = true;
    map.stop();
    if (isFirstApply) {
      map.jumpTo({ ...camera, padding });
    } else {
      map.easeTo({ ...camera, padding, duration: 320 });
    }
  }, [mode, styleReady]);

  useEffect(() => {
    onSelectEventRef.current = onSelectEvent;
  }, [onSelectEvent]);

  useEffect(() => {
    onSelectSignalRef.current = onSelectSignal;
  }, [onSelectSignal]);

  useEffect(() => {
    signalsRef.current = signals;
    selectedSignalIdRef.current = selectedSignalId;
  }, [signals, selectedSignalId]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // The container is absolute inset-0 — valid dimensions are available immediately
    // at mount time. Read size directly; only fall back to ResizeObserver if the
    // initial measurement is somehow zero (shouldn't happen in normal layout).
    if (validContainerSize(container)) {
      setContainerReady(true);
      return;
    }

    const observer = new ResizeObserver(() => {
      if (validContainerSize(container)) {
        observer.disconnect();
        setContainerReady(true);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!containerReady || !containerRef.current) return;
    const rafIds: number[] = [];
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];
    let map: maplibregl.Map | null = null;
    let cancelled = false;
    let firstStableFrameRevealed = false;

    async function init() {
      const darkStyle = cloneStyleJson(await loadDarkStyleJson());

      if (cancelled || !containerRef.current) return;

      const initialCamera = cameraForMode(modeRef.current);
      const initialPadding = paddingForMode(modeRef.current);

      map = new maplibregl.Map({
        container: containerRef.current,
        style: darkStyle,
        center: initialCamera.center,
        zoom: initialCamera.zoom,
        minZoom: 1.0,
        maxZoom: 8,
        pitch: initialCamera.pitch,
        bearing: initialCamera.bearing,
        attributionControl: false,
        renderWorldCopies: false,
        canvasContextAttributes: {
          alpha: true,
          antialias: true,
        },
      });

      mapRef.current = map;
      map.getCanvas().style.background = "transparent";

      const prepareInitialFrame = () => {
        map!.setProjection({ type: "globe" });
        applyGlobeAtmosphere(map!);
        applyDarkMapStyle(map!);
        addDetailLabelLayers(map!);
        addEventLayers(map!);
        addSignalLayers(map!);
        map!.resize();
        map!.jumpTo({ ...initialCamera, padding: initialPadding });
        hasAppliedFirstModeRef.current = true;

        // Clip the MapLibre canvas to the visible globe sphere so labels near the
        // horizon cannot bleed into the surrounding black canvas area.
        //
        // Geometry: a point 90° east (great-circle) from the camera center lies
        // exactly on the visible hemisphere boundary at any center latitude:
        //   sin(lat)·sin(0) + cos(lat)·cos(0)·cos(90°) = 0
        // Projecting that point gives a screen-space coordinate on the sphere edge;
        // the distance from the projected center is the sphere radius in pixels.
        const canvas = map!.getCanvas();
        let lastGlobeClip = "";
        const drawHybridBase = () => {
          const baseCanvas = baseCanvasRef.current;
          if (!baseCanvas || !map) return;
          drawPremiumGlobeBase(baseCanvas, globeScreenFrame(map));
        };
        const updateGlobeClip = () => {
          if (!map) return;
          const globe = globeScreenFrame(map);
          const clip = `circle(${Math.round(globe.radius)}px at ${Math.round(globe.centerX)}px ${Math.round(globe.centerY)}px)`;
          if (clip !== lastGlobeClip) {
            lastGlobeClip = clip;
            canvas.style.clipPath = clip;
          }
          drawHybridBase();
        };
        drawHybridBase();
        map!.on("render", updateGlobeClip);

        const revealFirstStableFrame = () => {
          if (firstStableFrameRevealed) return;
          firstStableFrameRevealed = true;
          if (cancelled || !map) return;
          // One RAF to land in the post-render tick, then reveal.
          const revealFrame = requestAnimationFrame(() => {
            if (cancelled || !map) return;
            setStyleReady(true);
          });
          rafIds.push(revealFrame);
        };

        // "render" fires on the first painted frame — the dark background layer
        // covers the globe sphere without tile data, so no partial-fragment risk.
        // "idle" (all tiles loaded) would add hundreds of ms of unnecessary wait.
        map!.once("render", revealFirstStableFrame);
        map!.triggerRepaint();
        const fallbackId = setTimeout(revealFirstStableFrame, FIRST_STABLE_FRAME_FALLBACK_MS);
        timeoutIds.push(fallbackId);
      };

      if (map.isStyleLoaded()) {
        prepareInitialFrame();
      } else {
        map.once("style.load", prepareInitialFrame);
      }

      map.on("click", EVENT_HIT_LAYER_ID, (event) => {
        const id = event.features?.[0]?.properties?.id;
        if (typeof id === "string") {
          onSelectEventRef.current?.(id);
        }
      });

      map.on("mouseenter", EVENT_HIT_LAYER_ID, () => {
        map!.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", EVENT_HIT_LAYER_ID, () => {
        map!.getCanvas().style.cursor = "";
      });

      map.on("click", SIGNAL_HIT_LAYER_ID, (event) => {
        const id = event.features?.[0]?.properties?.id;
        if (typeof id === "string") {
          onSelectSignalRef.current?.(id);
        }
      });

      map.on("mouseenter", SIGNAL_HIT_LAYER_ID, () => {
        map!.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", SIGNAL_HIT_LAYER_ID, () => {
        map!.getCanvas().style.cursor = "";
      });

      map.on("move", () => {
        updateSignalSource(map!, signalsRef.current, selectedSignalIdRef.current ?? null);
      });
    }

    init();

    return () => {
      cancelled = true;
      rafIds.forEach((id) => cancelAnimationFrame(id));
      timeoutIds.forEach((id) => clearTimeout(id));
      if (map) {
        map.remove();
        mapRef.current = null;
      }
    };
  }, [containerReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    updateEventSource(map, events, selectedId);
  }, [events, selectedId, styleReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    signalsRef.current = signals;
    selectedSignalIdRef.current = selectedSignalId;
    updateSignalSource(map, signals, selectedSignalId ?? null);
  }, [signals, selectedSignalId, styleReady]);

  return (
    <div className="absolute inset-0" style={{ background: MAP_OUTER_BACKGROUND_COLOR }}>
      <canvas
        ref={baseCanvasRef}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      />
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full"
        style={{
          opacity: styleReady ? 1 : 0,
          transition: "opacity 80ms ease",
        }}
      />
    </div>
  );
});
