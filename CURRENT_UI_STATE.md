# BörüEyes — Current UI State Handoff

## Goal
Dark-themed, map-first OSINT situation dashboard. Full-screen, 16:9 desktop layout, no backend, mock data only.

---

## Layout (complete, do not restructure)

```
[ LeftRail 72px ] [ Map fills remaining width ] [ RightEventsPanel 372px ]
                         ↑ HeaderNav spans full width above map
```

- **`app/page.tsx`** — root layout, owns `selectedId` state, wires all panels together
- **`components/layout/AppShell.tsx`** — outer shell with left rail + content area
- **`components/layout/HeaderNav.tsx`** — top bar with logo, 7 nav tabs, right icon cluster
- **`components/layout/LeftRail.tsx`** — icon-only vertical nav, 72px wide
- **`components/events/RightEventsPanel.tsx`** — scrollable event card list, 372px wide
- **`components/events/EventCard.tsx`** — individual event card with selection state
- **`components/map/GlobeMap.tsx`** — MapLibre GL JS interactive map (see below)
- **`components/map/FloatingMonitoringCard.tsx`** — overlay card on map
- **`components/map/MapControls.tsx`** — zoom/bearing UI buttons on map
- **`components/map/LiveStatusPill.tsx`** — live indicator badge on map
- **`components/ui/StatusBadge.tsx`** — category/severity/source/verification badges

---

## Map (GlobeMap.tsx) — current implementation

- **MapLibre GL JS v5.24.0**, fully interactive (pan, zoom, globe rotation)
- Style: `https://demotiles.maplibre.org/style.json` with `applyDarkMapStyle()` override applied on `load`
- Globe projection: `map.setProjection({ type: 'globe' })` called after `load`
- Initial center: `[44, 27]` (Middle East), zoom `3.15`
- Dark overlay: subtle `radial-gradient` vignette (max ~0.56 opacity) — **do not increase**
- CSS import: `import "maplibre-gl/dist/maplibre-gl.css"` is in **`app/layout.tsx`**, not in the component — keep it there (Turbopack requirement)
- No `mountedRef` guard — correct pattern for React 19 Strict Mode
- Event markers: GeoJSON circle layers with per-category color palettes (conflict=red, politics=blue, maritime=cyan, energy=amber, humanitarian/intel=green)
- Selected marker: larger core dot + dashed ring layer + brighter glow
- Click-to-select: `EVENT_HIT_LAYER_ID` transparent circle layer handles clicks, fires `onSelectEvent`
- Selection sync: `updateEventSource()` called in a separate effect whenever `events` or `selectedId` changes

---

## Data model

- **`types/event.ts`** — `OsintEvent`, `EventCategory`, `EventSeverity`, `SourceType`, `VerificationStatus`
- **`data/mockEvents.ts`** — 8 events with `coordinates`, covering Middle East/Red Sea

---

## Design rules to preserve

- Color palette via CSS vars in `globals.css`: `--bg-base: #04080f`, `--accent-blue: #3b82f6`
- All text, borders, and backgrounds use `rgba()` with low opacity — no solid bright colors
- Font: Inter, fallback `-apple-system`
- `overflow: hidden` on `html` and `body` — no page scroll; map fills viewport
- Scrollbar: 3px, blue-tinted thumb

---

## Remaining tasks

1. **Map tile style** — `demotiles.maplibre.org` is a low-detail demo style. Could upgrade to CartoDB Dark Matter (`https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`) for higher visual quality. Note: CartoDB style has different layer names — `applyDarkMapStyle()` would need updating.
2. **Event count** — Header shows hardcoded "128 Results"; should reflect `events.length`.
3. **Nav tab switching** — tabs are rendered but clicking does nothing (no tab state or content switching).
4. **Map controls** — `MapControls.tsx` renders zoom buttons but they are not wired to the MapLibre map instance.

---

## Do not touch

- `app/layout.tsx` maplibre CSS import location
- `globals.css` color variables and scrollbar rules
- `StatusBadge.tsx` variant color mapping
- Overall 3-column layout proportions
