"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";
import { OsintEvent } from "@/types/event";
import type { OsintSignal } from "@/types/signal";
import { radarSites } from "@/data/signals/radarSites";
import type { RadarSite } from "@/data/signals/radarSites";

const STYLE_URL = "https://demotiles.maplibre.org/style.json";
const MAP_CENTER: [number, number] = [44, 27];
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
const SIGNAL_GLOW_LAYER_ID = "borueyes-signal-glow";
const SIGNAL_RING_LAYER_ID = "borueyes-signal-ring";
const SIGNAL_CORE_LAYER_ID = "borueyes-signal-core";
const SIGNAL_HIT_LAYER_ID = "borueyes-signal-hit";
const SIGNAL_ICON_PREFIX = "borueyes-signal-antenna";
const RADAR_SOURCE_ID = "borueyes-radar-sites";
const RADAR_GLOW_LAYER_ID = "borueyes-radar-glow";
const RADAR_RING_LAYER_ID = "borueyes-radar-ring";
const RADAR_CORE_LAYER_ID = "borueyes-radar-core";
const RADAR_HIT_LAYER_ID = "borueyes-radar-hit";
const RADAR_FALLBACK_CATEGORY = "Strategic Radar Infrastructure";
const RADAR_FALLBACK_DESCRIPTION =
  "Publicly mapped radar infrastructure site from the ClimateViewer radar infrastructure dataset.";
const RADAR_SITE_PALETTE = {
  fill: "#A78BFA",
  border: "#C4B5FD",
  glow: "rgba(167,139,250,0.16)",
};
const DEG_TO_RAD = Math.PI / 180;
const SIGNAL_FRONT_HEMISPHERE_DOT_MIN = 0.08;

const CITY_LABELS = [
  { name: "Istanbul", coordinates: [28.9784, 41.0082], minZoom: 3 },
  { name: "Cairo", coordinates: [31.2357, 30.0444], minZoom: 3 },
  { name: "Amman", coordinates: [35.9106, 31.9539], minZoom: 3 },
  { name: "Damascus", coordinates: [36.2765, 33.5138], minZoom: 3.1 },
  { name: "Baghdad", coordinates: [44.3661, 33.3152], minZoom: 3 },
  { name: "Tehran", coordinates: [51.389, 35.6892], minZoom: 3 },
  { name: "Riyadh", coordinates: [46.6753, 24.7136], minZoom: 3.2 },
  { name: "Beirut", coordinates: [35.5018, 33.8938], minZoom: 3.4 },
  { name: "Ankara", coordinates: [32.8597, 39.9334], minZoom: 4.5 },
  { name: "Jeddah", coordinates: [39.1979, 21.4858], minZoom: 5 },
  { name: "Kuwait City", coordinates: [47.9774, 29.3759], minZoom: 4.8 },
  { name: "Doha", coordinates: [51.531, 25.2854], minZoom: 5 },
  { name: "Dubai", coordinates: [55.2708, 25.2048], minZoom: 4.8 },
  { name: "Baku", coordinates: [49.8671, 40.4093], minZoom: 4.8 },
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

const DEFAULT_MARKER_PALETTE: MarkerPalette = {
  fill: "#2EEB8F",
  border: "#7CFFC0",
  glow: "rgba(46, 235, 143, 0.22)",
};

const SIGNAL_TYPE_PALETTES: Record<OsintSignal["type"], MarkerPalette> = {
  source: { fill: "#60A5FA", border: "#93C5FD", glow: "rgba(96,165,250,0.20)" },
  electronic: { fill: "#4ADE80", border: "#86EFAC", glow: "rgba(74,222,128,0.22)" },
  "early-warning": { fill: "#FBBF24", border: "#FCD34D", glow: "rgba(251,191,36,0.20)" },
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
  events: OsintEvent[];
  selectedId: string | null;
  onSelectEvent?: (id: string) => void;
  signals?: OsintSignal[];
  selectedSignalId?: string | null;
  onSelectSignal?: (id: string) => void;
  isSignalsMode?: boolean;
  showRadarSites?: boolean;
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

function applyDarkMapStyle(map: maplibregl.Map) {
  setPaint(map, "background", "background-color", "#060606");
  setPaint(map, "countries-fill", "fill-color", "#111111");
  setPaint(map, "countries-fill", "fill-opacity", 0.96);
  setPaint(map, "crimea-fill", "fill-color", "#111111");
  setPaint(map, "crimea-fill", "fill-opacity", 0.96);
  setPaint(map, "coastline", "line-color", "rgba(75, 75, 75, 0.38)");
  setPaint(map, "coastline", "line-blur", 0.7);
  setPaint(map, "coastline", "line-width", ["interpolate", ["linear"], ["zoom"], 1, 0.7, 6, 2.4]);
  setPaint(map, "countries-boundary", "line-color", "rgba(95, 95, 95, 0.5)");
  setPaint(map, "countries-boundary", "line-opacity", ["interpolate", ["linear"], ["zoom"], 2, 0.2, 5, 0.52]);
  setPaint(map, "countries-boundary", "line-width", ["interpolate", ["linear"], ["zoom"], 1, 0.35, 6, 1.1]);
  setPaint(map, "geolines", "line-color", "rgba(75, 75, 75, 0.42)");
  setPaint(map, "geolines", "line-opacity", 0.28);
  setPaint(map, "geolines-label", "text-color", "rgba(100, 100, 100, 0.55)");
  setPaint(map, "geolines-label", "text-halo-color", "rgba(6, 6, 6, 0.78)");
  setPaint(map, "geolines-label", "text-halo-width", 1);
  setPaint(map, "countries-label", "text-color", "rgba(130, 130, 130, 0.66)");
  setPaint(map, "countries-label", "text-halo-color", "rgba(6, 6, 6, 0.86)");
  setPaint(map, "countries-label", "text-halo-width", 1.1);
  setPaint(map, "countries-label", "text-opacity", ["interpolate", ["linear"], ["zoom"], 2, 0.48, 4, 0.72, 6, 0.86]);
  setLayout(map, "countries-label", "text-field", "{NAME}");
  setLayout(map, "countries-label", "text-transform", "none");
  setLayout(map, "countries-label", "text-size", ["interpolate", ["linear"], ["zoom"], 2, 8.5, 4, 10.5, 6, 13]);
}

function applySignalMapStyle(map: maplibregl.Map) {
  setPaint(map, "background", "background-color", "#010d06");
  setPaint(map, "countries-fill", "fill-color", "#061209");
  setPaint(map, "countries-fill", "fill-opacity", 0.97);
  setPaint(map, "crimea-fill", "fill-color", "#061209");
  setPaint(map, "crimea-fill", "fill-opacity", 0.97);
  setPaint(map, "coastline", "line-color", "rgba(32,160,96,0.30)");
  setPaint(map, "coastline", "line-blur", 0.7);
  setPaint(map, "coastline", "line-width", ["interpolate", ["linear"], ["zoom"], 1, 0.7, 6, 2.4]);
  setPaint(map, "countries-boundary", "line-color", "rgba(40,180,100,0.36)");
  setPaint(map, "countries-boundary", "line-opacity", ["interpolate", ["linear"], ["zoom"], 2, 0.22, 5, 0.52]);
  setPaint(map, "countries-boundary", "line-width", ["interpolate", ["linear"], ["zoom"], 1, 0.35, 6, 1.1]);
  setPaint(map, "geolines", "line-color", "rgba(28,140,80,0.34)");
  setPaint(map, "geolines", "line-opacity", 0.28);
  setPaint(map, "geolines-label", "text-color", "rgba(60,180,110,0.46)");
  setPaint(map, "geolines-label", "text-halo-color", "rgba(1,13,6,0.82)");
  setPaint(map, "geolines-label", "text-halo-width", 1);
  setPaint(map, "countries-label", "text-color", "rgba(80,200,130,0.55)");
  setPaint(map, "countries-label", "text-halo-color", "rgba(1,13,6,0.86)");
  setPaint(map, "countries-label", "text-halo-width", 1.1);
  setPaint(map, "countries-label", "text-opacity", ["interpolate", ["linear"], ["zoom"], 2, 0.48, 4, 0.72, 6, 0.86]);
}

function darkenStyleJson(base: StyleSpecification): StyleSpecification {
  const style = JSON.parse(JSON.stringify(base)) as MutableStyleJson;
  for (const layer of style.layers) {
    const p = layer.paint ?? {};
    const l = layer.layout ?? {};
    switch (layer.id) {
      case "background":
        layer.paint = { ...p, "background-color": "#060606" };
        break;
      case "countries-fill":
      case "crimea-fill":
        layer.paint = { ...p, "fill-color": "#111111", "fill-opacity": 0.96 };
        break;
      case "coastline":
        layer.paint = {
          ...p,
          "line-color": "rgba(75, 75, 75, 0.38)",
          "line-blur": 0.7,
          "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.7, 6, 2.4],
        };
        break;
      case "countries-boundary":
        layer.paint = {
          ...p,
          "line-color": "rgba(95, 95, 95, 0.5)",
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 2, 0.2, 5, 0.52],
          "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.35, 6, 1.1],
        };
        break;
      case "geolines":
        layer.paint = { ...p, "line-color": "rgba(75, 75, 75, 0.42)", "line-opacity": 0.28 };
        break;
      case "geolines-label":
        layer.paint = {
          ...p,
          "text-color": "rgba(100, 100, 100, 0.55)",
          "text-halo-color": "rgba(6, 6, 6, 0.78)",
          "text-halo-width": 1,
        };
        break;
      case "countries-label":
        layer.paint = {
          ...p,
          "text-color": "rgba(130, 130, 130, 0.66)",
          "text-halo-color": "rgba(6, 6, 6, 0.86)",
          "text-halo-width": 1.1,
          "text-opacity": ["interpolate", ["linear"], ["zoom"], 2, 0.48, 4, 0.72, 6, 0.86],
        };
        layer.layout = {
          ...l,
          "text-field": "{NAME}",
          "text-transform": "none",
          "text-size": ["interpolate", ["linear"], ["zoom"], 2, 8.5, 4, 10.5, 6, 13],
        };
        break;
    }
  }
  return style as unknown as StyleSpecification;
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

function signalsCollection(signals: OsintSignal[], selectedSignalId: string | null): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: signals.map((signal) => {
      const palette = SIGNAL_TYPE_PALETTES[signal.type];
      return {
        type: "Feature",
        properties: {
          id: signal.id,
          type: signal.type,
          confidence: signal.confidence,
          fillColor: palette.fill,
          borderColor: palette.border,
          glowColor: palette.glow,
          icon: `${SIGNAL_ICON_PREFIX}-${signal.type}`,
          selected: signal.id === selectedSignalId,
        },
        geometry: {
          type: "Point",
          coordinates: [signal.coordinates.lng, signal.coordinates.lat],
        },
      };
    }),
  };
}

function createPoliticsGlobeIconImage(palette: MarkerPalette) {
  const canvas = document.createElement("canvas");
  canvas.width = 44;
  canvas.height = 44;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const cx = 22;
  const cy = 22;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.shadowColor = palette.glow;
  ctx.shadowBlur = 7;
  ctx.fillStyle = palette.fill;
  ctx.beginPath();
  ctx.arc(cx, cy, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(cx, cy, 15, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = 1.45;
  ctx.beginPath();
  ctx.arc(cx, cy, 8.7, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(cx, cy, 3.7, 8.7, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - 8.2, cy);
  ctx.lineTo(cx + 8.2, cy);
  ctx.moveTo(cx - 6.4, cy - 5.1);
  ctx.quadraticCurveTo(cx, cy - 3.2, cx + 6.4, cy - 5.1);
  ctx.moveTo(cx - 6.4, cy + 5.1);
  ctx.quadraticCurveTo(cx, cy + 3.2, cx + 6.4, cy + 5.1);
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

function isSignalOnFrontHemisphere(centerLng: number, centerLat: number, signal: OsintSignal) {
  const centerLatRad = centerLat * DEG_TO_RAD;
  const signalLatRad = signal.coordinates.lat * DEG_TO_RAD;
  const lngDeltaRad = (signal.coordinates.lng - centerLng) * DEG_TO_RAD;

  const dot =
    Math.sin(centerLatRad) * Math.sin(signalLatRad) +
    Math.cos(centerLatRad) * Math.cos(signalLatRad) * Math.cos(lngDeltaRad);

  return dot > SIGNAL_FRONT_HEMISPHERE_DOT_MIN;
}

function visibleSignalsForGlobe(map: maplibregl.Map, signals: OsintSignal[]) {
  const center = map.getCenter();
  return signals.filter((signal) => isSignalOnFrontHemisphere(center.lng, center.lat, signal));
}

function drawAntenna(ctx: CanvasRenderingContext2D, color: string, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.lineWidth = 5.4;
  ctx.beginPath();
  ctx.moveTo(29, 25.5);
  ctx.lineTo(18, 58);
  ctx.moveTo(35, 25.5);
  ctx.lineTo(46, 58);
  ctx.stroke();

  ctx.lineWidth = 3.8;
  ctx.beginPath();
  ctx.moveTo(26, 36);
  ctx.lineTo(39, 48);
  ctx.moveTo(38, 36);
  ctx.lineTo(25, 48);
  ctx.moveTo(22, 51);
  ctx.lineTo(42, 60);
  ctx.moveTo(42, 51);
  ctx.lineTo(22, 60);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(32, 20, 8.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 4.4;
  [14, 21, 28].forEach((radius) => {
    ctx.beginPath();
    ctx.arc(32, 20, radius, -0.82, 0.82);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(32, 20, radius, Math.PI - 0.82, Math.PI + 0.82);
    ctx.stroke();
  });

  ctx.restore();
}

function createSignalAntennaImage(color: string, glow: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.shadowColor = glow;
  ctx.shadowBlur = 2;
  drawAntenna(ctx, color, 1);

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function addSignalIcons(map: maplibregl.Map) {
  (Object.entries(SIGNAL_TYPE_PALETTES) as [OsintSignal["type"], MarkerPalette][]).forEach(([type, palette]) => {
    const iconId = `${SIGNAL_ICON_PREFIX}-${type}`;
    if (map.hasImage(iconId)) return;

    const image = createSignalAntennaImage(palette.fill, palette.glow);
    if (image) {
      map.addImage(iconId, image, { pixelRatio: 2 });
    }
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildRadarPopupHTML(
  name: string,
  category: string | null,
  description: string | null,
  lngLat: maplibregl.LngLat,
): string {
  const cat = escapeHtml(category || RADAR_FALLBACK_CATEGORY);
  const desc = escapeHtml(description || RADAR_FALLBACK_DESCRIPTION);
  const lat = lngLat.lat.toFixed(4);
  const lng = lngLat.lng.toFixed(4);
  const title = escapeHtml(name);

  const labelStyle =
    "font-size:7px;color:rgba(100,100,100,0.72);font-weight:700;letter-spacing:0.1em;" +
    "text-transform:uppercase;display:block;margin-bottom:2px;";
  const sectionStyle = "border-top:1px solid rgba(255,255,255,0.055);padding-top:7px;margin-bottom:7px;";

  return `
    <div style="padding:11px 13px;width:100%;box-sizing:border-box;">
      <div style="font-size:10.5px;font-weight:700;color:rgba(215,215,215,0.97);
                  margin-bottom:9px;line-height:1.35;padding-right:14px;">
        ${title}
      </div>
      <div style="${sectionStyle}">
        <span style="${labelStyle}">Type</span>
        <span style="font-size:10px;color:rgba(167,139,250,0.9);">${cat}</span>
      </div>
      <div style="${sectionStyle}">
        <span style="${labelStyle}">Description</span>
        <p style="font-size:9.5px;color:rgba(145,145,145,0.9);line-height:1.45;margin:0;
                  max-height:72px;overflow:hidden;">${desc}</p>
      </div>
      <div style="${sectionStyle}margin-bottom:5px;">
        <span style="${labelStyle}">Coordinates</span>
        <span style="font-size:9px;color:rgba(105,105,105,0.9);font-family:monospace;">${lat}°, ${lng}°</span>
      </div>
      <div style="border-top:1px solid rgba(255,255,255,0.04);padding-top:6px;">
        <span style="font-size:7px;color:rgba(85,85,85,0.9);line-height:1.5;display:block;">
          ClimateViewer Maps / Jim Lee · CC BY-NC-SA 4.0
        </span>
      </div>
    </div>`;
}

function radarSitesCollection(sites: RadarSite[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: sites.map((site) => ({
      type: "Feature",
      properties: {
        id: site.id,
        name: site.name,
        category: site.category ?? null,
        description: site.description ?? null,
      },
      geometry: { type: "Point", coordinates: site.coordinates },
    })),
  };
}

function addRadarSiteLayers(map: maplibregl.Map) {
  if (!map.getSource(RADAR_SOURCE_ID)) {
    map.addSource(RADAR_SOURCE_ID, {
      type: "geojson",
      data: radarSitesCollection(radarSites),
    });
  }

  if (!map.getLayer(RADAR_GLOW_LAYER_ID)) {
    map.addLayer({
      id: RADAR_GLOW_LAYER_ID,
      type: "circle",
      source: RADAR_SOURCE_ID,
      layout: { visibility: "none" },
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 10, 6, 15],
        "circle-color": RADAR_SITE_PALETTE.glow,
        "circle-opacity": 1,
        "circle-blur": 0.72,
      },
    });
  }

  if (!map.getLayer(RADAR_RING_LAYER_ID)) {
    map.addLayer({
      id: RADAR_RING_LAYER_ID,
      type: "circle",
      source: RADAR_SOURCE_ID,
      layout: { visibility: "none" },
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 6, 6, 9],
        "circle-color": "rgba(0,0,0,0)",
        "circle-stroke-color": RADAR_SITE_PALETTE.border,
        "circle-stroke-width": 0.9,
        "circle-stroke-opacity": 0.5,
        "circle-opacity": 0,
      },
    });
  }

  if (!map.getLayer(RADAR_CORE_LAYER_ID)) {
    map.addLayer({
      id: RADAR_CORE_LAYER_ID,
      type: "circle",
      source: RADAR_SOURCE_ID,
      layout: { visibility: "none" },
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 2.2, 6, 3.2],
        "circle-color": RADAR_SITE_PALETTE.fill,
        "circle-opacity": 0.78,
      },
    });
  }

  if (!map.getLayer(RADAR_HIT_LAYER_ID)) {
    map.addLayer({
      id: RADAR_HIT_LAYER_ID,
      type: "circle",
      source: RADAR_SOURCE_ID,
      layout: { visibility: "none" },
      paint: {
        "circle-radius": 14,
        "circle-color": "rgba(0,0,0,0)",
        "circle-opacity": 0.01,
      },
    });
  }
}

function setRadarSitesVisibility(map: maplibregl.Map, visible: boolean) {
  const v = visible ? "visible" : "none";
  [RADAR_GLOW_LAYER_ID, RADAR_RING_LAYER_ID, RADAR_CORE_LAYER_ID, RADAR_HIT_LAYER_ID].forEach(
    (id) => setLayout(map, id, "visibility", v),
  );
}

function addSignalLayers(map: maplibregl.Map) {
  if (!map.getSource(SIGNAL_SOURCE_ID)) {
    map.addSource(SIGNAL_SOURCE_ID, { type: "geojson", data: signalsCollection([], null) });
  }

  addSignalIcons(map);

  if (!map.getLayer(SIGNAL_GLOW_LAYER_ID)) {
    map.addLayer({
      id: SIGNAL_GLOW_LAYER_ID,
      type: "circle",
      source: SIGNAL_SOURCE_ID,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 13, 6, 20],
        "circle-color": ["to-color", ["get", "glowColor"]],
        "circle-opacity": 1,
        "circle-blur": 0.65,
      },
    });
  }

  if (!map.getLayer(SIGNAL_RING_LAYER_ID)) {
    map.addLayer({
      id: SIGNAL_RING_LAYER_ID,
      type: "circle",
      source: SIGNAL_SOURCE_ID,
      filter: ["==", ["get", "selected"], true],
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 9, 6, 12.5],
        "circle-color": "rgba(0,0,0,0)",
        "circle-stroke-color": "rgba(74,222,128,0.8)",
        "circle-stroke-width": 1.2,
        "circle-opacity": 1,
      },
    });
  }

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
          ["case", ["==", ["get", "selected"], true], 0.48, 0.4],
          6,
          ["case", ["==", ["get", "selected"], true], 0.58, 0.5],
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

function updateSignalSource(map: maplibregl.Map, signals: OsintSignal[], selectedSignalId: string | null) {
  const source = map.getSource(SIGNAL_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  source?.setData(signalsCollection(visibleSignalsForGlobe(map, signals), selectedSignalId));
}

function addDetailLabelLayers(map: maplibregl.Map) {
  if (!map.getSource(CITY_SOURCE_ID)) {
    map.addSource(CITY_SOURCE_ID, {
      type: "geojson",
      data: labelCollection(CITY_LABELS),
    });
  }

  if (!map.getLayer("borueyes-major-city-labels")) {
    map.addLayer({
      id: "borueyes-major-city-labels",
      type: "symbol",
      source: CITY_SOURCE_ID,
      minzoom: 3,
      filter: ["<=", ["get", "minZoom"], 3.4],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 3, 9.4, 6, 11.4],
        "text-offset": [0, 0.8],
        "text-anchor": "top",
        "text-allow-overlap": false,
        "text-ignore-placement": false,
      },
      paint: {
        "text-color": "rgba(175, 175, 175, 0.8)",
        "text-halo-color": "rgba(8, 8, 8, 0.88)",
        "text-halo-width": 1.25,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0.68, 5.5, 0.86],
      },
    });
  }

  if (!map.getLayer("borueyes-secondary-city-labels")) {
    map.addLayer({
      id: "borueyes-secondary-city-labels",
      type: "symbol",
      source: CITY_SOURCE_ID,
      minzoom: 4.4,
      filter: [">", ["get", "minZoom"], 3.4],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 4.4, 8.8, 6, 10.8],
        "text-offset": [0, 0.8],
        "text-anchor": "top",
        "text-allow-overlap": false,
        "text-ignore-placement": false,
      },
      paint: {
        "text-color": "rgba(165, 165, 165, 0.68)",
        "text-halo-color": "rgba(8, 8, 8, 0.88)",
        "text-halo-width": 1,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 4.4, 0.42, 6, 0.74],
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
        "text-size": ["interpolate", ["linear"], ["zoom"], 3, 9.8, 6, 12],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
      },
      paint: {
        "text-color": "rgba(100, 100, 100, 0.56)",
        "text-halo-color": "rgba(8, 8, 8, 0.82)",
        "text-halo-width": 1,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0.42, 5, 0.66],
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
        "text-size": ["interpolate", ["linear"], ["zoom"], 3.9, 9, 6, 11.5],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
      },
      paint: {
        "text-color": "rgba(90, 90, 90, 0.46)",
        "text-halo-color": "rgba(8, 8, 8, 0.82)",
        "text-halo-width": 1,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 3.9, 0.28, 5.2, 0.58],
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
            0.64,
            ["==", ["get", "selected"], true],
            0.58,
            0.5,
          ],
          6,
          [
            "case",
            ["==", ["get", "markerVariant"], "turkey-focus"],
            0.78,
            ["==", ["get", "selected"], true],
            0.7,
            0.6,
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

export function GlobeMap({ events, selectedId, onSelectEvent, signals = [], selectedSignalId = null, onSelectSignal, isSignalsMode = false, showRadarSites = false }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onSelectEventRef = useRef(onSelectEvent);
  const onSelectSignalRef = useRef(onSelectSignal);
  const signalsRef = useRef(signals);
  const selectedSignalIdRef = useRef(selectedSignalId);
  const radarPopupRef = useRef<maplibregl.Popup | null>(null);
  const [styleReady, setStyleReady] = useState(false);

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

  useEffect(() => {
    if (!containerRef.current) return;
    let rafId: number | undefined;
    let map: maplibregl.Map | null = null;
    let cancelled = false;

    async function init() {
      const res = await fetch(STYLE_URL);
      const base = await res.json() as StyleSpecification;
      const darkStyle = darkenStyleJson(base);

      if (cancelled || !containerRef.current) return;

      map = new maplibregl.Map({
        container: containerRef.current,
        style: darkStyle,
        center: MAP_CENTER,
        zoom: 2.2,
        minZoom: 1.0,
        maxZoom: 8,
        pitch: 0,
        bearing: 0,
        attributionControl: false,
        renderWorldCopies: false,
      });

      mapRef.current = map;

      map.on("load", () => {
        map!.setProjection({ type: "globe" });
        applyDarkMapStyle(map!);
        addDetailLabelLayers(map!);
        addEventLayers(map!);
        addSignalLayers(map!);
        addRadarSiteLayers(map!);
        map!.resize();
        // "render" fires from MapLibre's own GL draw loop — first dark frame is on canvas
        map!.once("render", () => {
          rafId = requestAnimationFrame(() => setStyleReady(true));
        });
      });

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

      map.on("click", RADAR_HIT_LAYER_ID, (event) => {
        const props = event.features?.[0]?.properties;
        if (!props) return;
        radarPopupRef.current?.remove();
        radarPopupRef.current = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: "252px",
          className: "borueyes-radar-popup",
          offset: 10,
        })
          .setLngLat(event.lngLat)
          .setHTML(
            buildRadarPopupHTML(
              String(props.name ?? "Unknown Site"),
              props.category ? String(props.category) : null,
              props.description ? String(props.description) : null,
              event.lngLat,
            ),
          )
          .addTo(map!);
      });

      map.on("mouseenter", RADAR_HIT_LAYER_ID, () => {
        map!.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", RADAR_HIT_LAYER_ID, () => {
        map!.getCanvas().style.cursor = "";
      });

      map.on("move", () => {
        updateSignalSource(map!, signalsRef.current, selectedSignalIdRef.current ?? null);
      });
    }

    init();

    return () => {
      cancelled = true;
      if (rafId !== undefined) cancelAnimationFrame(rafId);
      if (map) {
        map.remove();
        mapRef.current = null;
      }
    };
  }, []);

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

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    if (isSignalsMode) {
      applySignalMapStyle(map);
    } else {
      applyDarkMapStyle(map);
    }
  }, [isSignalsMode, styleReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    setRadarSitesVisibility(map, showRadarSites);
    if (!showRadarSites) {
      radarPopupRef.current?.remove();
      radarPopupRef.current = null;
    }
  }, [showRadarSites, styleReady]);

  return (
    <div className="absolute inset-0 bg-[#080808]">
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: isSignalsMode
            ? "radial-gradient(circle at 50% 45%, rgba(74,222,128,0.05) 0%, rgba(1,13,6,0) 42%, rgba(0,8,4,0.56) 100%)"
            : "radial-gradient(circle at 50% 45%, rgba(59,130,246,0.04) 0%, rgba(8,8,8,0) 42%, rgba(4,4,4,0.56) 100%)",
          transition: "background 0.6s ease",
        }}
      />
      {/* Dark mask above the canvas — fades out only after idle + rAF confirms dark frame is painted */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "#080808",
          opacity: styleReady ? 0 : 1,
          transition: "opacity 0.1s ease",
          zIndex: 5,
        }}
      />
    </div>
  );
}
