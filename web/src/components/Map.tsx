"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { BlockedRoad, FlaggedGeoJSON, Hospital, RouteLeg, RouteStatus } from "../types/api";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface MapProps {
  flaggedData?: FlaggedGeoJSON;
  hospitals?: Hospital[];
  normalRoute?: RouteLeg | null;
  safeRoute?: RouteLeg | null;
  routeStatus?: RouteStatus;
  blockedRoads?: BlockedRoad[];
  patientLocation?: { lat: number; lon: number } | null;
  onSelectLocation: (lat: number, lon: number) => void;
  className?: string;
  isDarkMode?: boolean;
}

export function Map({
  flaggedData,
  hospitals,
  normalRoute,
  safeRoute,
  routeStatus,
  blockedRoads,
  patientLocation,
  onSelectLocation,
  className = "",
  isDarkMode = false,
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const patientMarkerRef = useRef<maplibregl.Marker | null>(null);
  const hospitalMarkersRef = useRef<maplibregl.Marker[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const destinationMarkerRef = useRef<maplibregl.Marker | null>(null);
  const overlayMarkersRef = useRef<maplibregl.Marker[]>([]);

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Keep latest callback in a ref to avoid destroying the map when onSelectLocation changes
  const onSelectLocationRef = useRef(onSelectLocation);
  useEffect(() => {
    onSelectLocationRef.current = onSelectLocation;
  }, [onSelectLocation]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation unsupported");
      return;
    }
    setIsLocating(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        onSelectLocationRef.current(latitude, longitude);
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 13.5,
            essential: true,
          });
        }
      },
      (err) => {
        setIsLocating(false);
        setGpsError(err.code === 1 ? "Permission denied" : "Position unavailable");
        setTimeout(() => setGpsError(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Initialize Map ONCE on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [72.855, 19.015], // Central Mumbai
      zoom: 11.8,
      minZoom: 10,
      maxZoom: 18,
      maxBounds: [
        [72.65, 18.75], // Southwest
        [73.10, 19.30], // Northeast
      ],
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

    // Click handler registered directly on map instance
    map.on("click", (e) => {
      onSelectLocationRef.current(e.lngLat.lat, e.lngLat.lng);
    });

    map.on("load", () => {
      // Set crosshair cursor so user knows map is clickable to place patient
      map.getCanvas().style.cursor = "crosshair";

      // 1. Study Area Bounds Box Source & Layer
      map.addSource("study-bounds", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [72.80, 18.89],
                [72.93, 18.89],
                [72.93, 19.14],
                [72.80, 19.14],
                [72.80, 18.89],
              ],
            ],
          },
        },
      });

      map.addLayer({
        id: "study-bounds-line",
        type: "line",
        source: "study-bounds",
        paint: {
          "line-color": "#0B8A7E",
          "line-width": 1.5,
          "line-dasharray": [4, 4],
          "line-opacity": 0.45,
        },
      });

      // 2. Flagged Roads Source & Layers
      map.addSource("flagged-roads", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      // Glow halo layer for flagged roads
      map.addLayer({
        id: "flagged-roads-halo",
        type: "line",
        source: "flagged-roads",
        paint: {
          "line-color": "#DC2626",
          "line-width": [
            "interpolate",
            ["linear"],
            ["get", "score"],
            0.0, 5,
            0.5, 7,
            1.0, 11,
          ],
          "line-opacity": 0.15,
          "line-blur": 3,
        },
      });

      // Core flagged roads line
      map.addLayer({
        id: "flagged-roads-line",
        type: "line",
        source: "flagged-roads",
        paint: {
          "line-color": [
            "interpolate",
            ["linear"],
            ["get", "score"],
            0.0, "#F5B83D",
            0.4, "#F97316",
            0.8, "#DC2626",
            1.0, "#991B1B",
          ],
          "line-width": [
            "interpolate",
            ["linear"],
            ["get", "score"],
            0.0, 3,
            0.5, 4.5,
            1.0, 7,
          ],
          "line-opacity": 0.85,
        },
      });

      // 3. Normal Route Source & Layer (Dashed Blue #2563EB)
      map.addSource("normal-route", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "normal-route-line",
        type: "line",
        source: "normal-route",
        paint: {
          "line-color": "#2563EB",
          "line-width": 4.5,
          "line-dasharray": [3, 2],
          "line-opacity": 0.9,
        },
      });

      // 4. Safe Route Source & Layers (Solid Teal #0B8A7E with Halo)
      map.addSource("safe-route", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "safe-route-halo",
        type: "line",
        source: "safe-route",
        paint: {
          "line-color": "#0B8A7E",
          "line-width": 10,
          "line-opacity": 0.25,
          "line-blur": 2,
        },
      });

      map.addLayer({
        id: "safe-route-line",
        type: "line",
        source: "safe-route",
        paint: {
          "line-color": "#0B8A7E",
          "line-width": 5.5,
          "line-opacity": 0.95,
        },
      });

      // Road Hover Tooltip Events
      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 12,
      });
      popupRef.current = popup;

      map.on("mouseenter", "flagged-roads-line", (e) => {
        map.getCanvas().style.cursor = "pointer";
        if (e.features && e.features[0]) {
          const props = e.features[0].properties;
          const name = props.name || "Unnamed road segment";
          const score = props.score ? Number(props.score).toFixed(2) : "0.00";
          const why = props.why || "Low-lying road depression near water drainage";

          const safeName = escapeHtml(String(name));
          const safeScore = escapeHtml(String(score));
          const safeWhy = escapeHtml(String(why));
          const rankPct = (Number(score) * 100).toFixed(0);

          popup
            .setLngLat(e.lngLat)
            .setHTML(
              `<div class="p-0.5 text-xs select-none">
                <div class="font-bold text-[#111827] text-sm tracking-tight flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-[#DC2626]"></span>
                  <span>${safeName}</span>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FEE2E2] text-[#991B1B] border border-[#EF4444]/20">
                    Risk Rank: ${rankPct}%
                  </span>
                  <span class="text-[10px] text-[#6B7280]">Score: ${safeScore}</span>
                </div>
                <div class="text-[#374151] text-[11px] mt-1.5 bg-[#F9FAFB] p-2 rounded-lg border border-[#E5E7EB] leading-relaxed">
                  ${safeWhy}
                </div>
              </div>`
            )
            .addTo(map);
        }
      });

      map.on("mouseleave", "flagged-roads-line", () => {
        map.getCanvas().style.cursor = "crosshair";
        popup.remove();
      });

      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Sync Flagged Roads Data
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const source = map.getSource("flagged-roads") as maplibregl.GeoJSONSource | undefined;
    if (source) {
      if (flaggedData) {
        source.setData(flaggedData as unknown as GeoJSON.GeoJSON);
      } else {
        source.setData({ type: "FeatureCollection", features: [] });
      }
    }
  }, [flaggedData, mapLoaded]);

  // Sync Routes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Normal Route update
    const normalSource = map.getSource("normal-route") as maplibregl.GeoJSONSource | undefined;
    if (normalSource) {
      if (normalRoute && normalRoute.coords && normalRoute.coords.length > 0) {
        const coordinates = normalRoute.coords.map(([lat, lon]) => [lon, lat]);
        normalSource.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates,
          },
        });
      } else {
        normalSource.setData({ type: "FeatureCollection", features: [] });
      }
    }

    // Safe Route update
    const safeSource = map.getSource("safe-route") as maplibregl.GeoJSONSource | undefined;
    if (safeSource) {
      if (safeRoute && safeRoute.coords && safeRoute.coords.length > 0) {
        const coordinates = safeRoute.coords.map(([lat, lon]) => [lon, lat]);
        safeSource.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates,
          },
        });
      } else {
        safeSource.setData({ type: "FeatureCollection", features: [] });
      }
    }

    // Highlight the hospital the ambulance should go to (the flood-safe destination)
    destinationMarkerRef.current?.remove();
    destinationMarkerRef.current = null;
    const dest = routeStatus === "cut_off" ? null : safeRoute ?? normalRoute;
    if (dest && dest.hospital_lat !== undefined && dest.hospital_lon !== undefined) {
      const el = document.createElement("div");
      el.className = "flex flex-col items-center pointer-events-none";
      el.innerHTML = `
        <div class="px-2 py-1 mb-1 rounded-md bg-[#0B8A7E] text-white text-[11px] font-semibold shadow-md whitespace-nowrap">Go to: ${escapeHtml(dest.hospital)}</div>
        <div class="w-8 h-8 rounded-full bg-white border-[3px] border-[#0B8A7E] shadow-lg flex items-center justify-center text-[#0B8A7E] font-extrabold text-[13px]">H</div>`;
      destinationMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([dest.hospital_lon, dest.hospital_lat])
        .addTo(map);
    }

    // Google-Maps-style reading aids: route time bubbles, flooded stretches on the normal route,
    // the rejected normal hospital, and fading of flagged roads that are not on the route.
    overlayMarkersRef.current.forEach((m) => m.remove());
    overlayMarkersRef.current = [];
    const addMarker = (html: string, lat: number, lon: number, anchor: maplibregl.PositionAnchor = "bottom") => {
      const el = document.createElement("div");
      el.className = "pointer-events-none";
      el.innerHTML = html;
      overlayMarkersRef.current.push(new maplibregl.Marker({ element: el, anchor }).setLngLat([lon, lat]).addTo(map));
    };
    const pointAt = (leg: RouteLeg, frac: number) => leg.coords[Math.floor((leg.coords.length - 1) * frac)];
    const nBlocked = (blockedRoads ?? []).length;
    const sameRoute = routeStatus === "no_change";

    if (normalRoute && normalRoute.coords.length > 1) {
      const [la, lo] = pointAt(normalRoute, sameRoute ? 0.5 : 0.35);
      const warn = nBlocked > 0 && !sameRoute
        ? `<div class="text-[10px] font-semibold text-[#DC2626]">⚠ crosses ${nBlocked} road${nBlocked > 1 ? "s" : ""} likely to flood</div>` : "";
      const title = sameRoute ? "Route (not affected)" : "Normal route";
      addMarker(`<div class="px-2 py-1 rounded-lg bg-white border-2 ${sameRoute ? "border-[#0B8A7E]" : "border-dashed border-[#2563EB]"} shadow-md whitespace-nowrap">
        <div class="text-[11px] font-bold ${sameRoute ? "text-[#0B8A7E]" : "text-[#1D4ED8]"}">${title} · ${Math.round(normalRoute.minutes)} min</div>
        <div class="text-[10px] text-[#4B5563]">to ${escapeHtml(normalRoute.hospital)}</div>${warn}</div>`, la, lo);
    }
    if (safeRoute && safeRoute.coords.length > 1 && !sameRoute) {
      const [la, lo] = pointAt(safeRoute, 0.65);
      addMarker(`<div class="px-2 py-1 rounded-lg bg-[#0B8A7E] text-white shadow-md whitespace-nowrap">
        <div class="text-[11px] font-bold">Flood-safe · ${Math.round(safeRoute.minutes)} min</div>
        <div class="text-[10px] opacity-90">to ${escapeHtml(safeRoute.hospital)}</div></div>`, la, lo);
    }
    if (!sameRoute) {
      (blockedRoads ?? []).forEach((b) => {
        if (b.lat === undefined || b.lon === undefined) return;
        addMarker(`<div class="w-6 h-6 rounded-full bg-[#DC2626] text-white border-2 border-white shadow-md flex items-center justify-center text-[12px] font-black" title="${escapeHtml(b.name)}">!</div>`, b.lat, b.lon, "center");
      });
    }
    if (routeStatus === "ok" && normalRoute && safeRoute && normalRoute.hospital !== safeRoute.hospital
        && normalRoute.hospital_lat !== undefined && normalRoute.hospital_lon !== undefined) {
      addMarker(`<div class="flex flex-col items-center opacity-80">
        <div class="px-2 py-0.5 mb-1 rounded-md bg-[#6B7280] text-white text-[10px] font-semibold whitespace-nowrap">Normal choice: ${escapeHtml(normalRoute.hospital)} · approach likely to flood</div>
        <div class="w-6 h-6 rounded-full bg-white border-2 border-[#9CA3AF] flex items-center justify-center text-[#6B7280] font-bold text-[11px]">H</div></div>`,
        normalRoute.hospital_lat, normalRoute.hospital_lon);
    }
    const focus = Boolean(normalRoute && normalRoute.coords.length > 1);
    if (map.getLayer("flagged-roads-line")) map.setPaintProperty("flagged-roads-line", "line-opacity", focus ? 0.3 : 0.85);
    if (map.getLayer("flagged-roads-halo")) map.setPaintProperty("flagged-roads-halo", "line-opacity", focus ? 0.04 : 0.15);

    // Zoom to show the whole trip: patient, both routes and the destination
    const pts: [number, number][] = [
      ...(normalRoute?.coords ?? []),
      ...(safeRoute?.coords ?? []),
    ];
    if (pts.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      pts.forEach(([lat, lon]) => bounds.extend([lon, lat]));
      map.fitBounds(bounds, { padding: { top: 90, bottom: 90, left: 60, right: 60 }, maxZoom: 15.5, duration: 800 });
    }
  }, [normalRoute, safeRoute, routeStatus, blockedRoads, mapLoaded]);

  // Sync Patient Marker (Draggable & Clickable)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (patientLocation) {
      if (!patientMarkerRef.current) {
        const el = document.createElement("div");
        el.className = "flex flex-col items-center cursor-grab active:cursor-grabbing select-none group";

        const label = document.createElement("div");
        label.className = "px-2 py-0.5 mb-1 rounded bg-[#111827] text-white text-[10px] font-bold shadow-md tracking-wide pointer-events-none whitespace-nowrap transition-transform group-hover:scale-105";
        label.textContent = "📍 Patient (Drag to adjust)";

        const pinWrap = document.createElement("div");
        pinWrap.className = "relative flex items-center justify-center";

        const ping = document.createElement("span");
        ping.className = "animate-ping absolute inline-flex h-8 w-8 rounded-full bg-[#F59E0B] opacity-75";

        const pin = document.createElement("div");
        pin.className = "w-8 h-8 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white shadow-xl flex items-center justify-center border-2 border-white ring-2 ring-[#F59E0B]/30 hover:scale-110 transition-transform";

        const icon = document.createElement("span");
        icon.className = "material-symbols-outlined text-[18px]";
        icon.textContent = "person_pin_circle";

        pin.appendChild(icon);
        pinWrap.appendChild(ping);
        pinWrap.appendChild(pin);
        el.appendChild(label);
        el.appendChild(pinWrap);

        const marker = new maplibregl.Marker({
          element: el,
          draggable: true,
          anchor: "bottom",
        })
          .setLngLat([patientLocation.lon, patientLocation.lat])
          .addTo(map);

        // Handle marker drag end to update patient position
        marker.on("dragend", () => {
          const lngLat = marker.getLngLat();
          onSelectLocationRef.current(lngLat.lat, lngLat.lng);
        });

        // Click on marker directly
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          const lngLat = marker.getLngLat();
          onSelectLocationRef.current(lngLat.lat, lngLat.lng);
        });

        patientMarkerRef.current = marker;
      } else {
        patientMarkerRef.current.setLngLat([patientLocation.lon, patientLocation.lat]);
      }
    } else if (patientMarkerRef.current) {
      patientMarkerRef.current.remove();
      patientMarkerRef.current = null;
    }
  }, [patientLocation, mapLoaded]);

  // Smoothly pan map when patient location changes significantly (e.g. from preset)
  const prevLocRef = useRef<{ lat: number; lon: number } | null>(null);
  useEffect(() => {
    if (!patientLocation || !mapRef.current) return;
    const prev = prevLocRef.current;
    prevLocRef.current = patientLocation;

    if (!prev || Math.hypot(prev.lat - patientLocation.lat, prev.lon - patientLocation.lon) > 0.008) {
      mapRef.current.easeTo({
        center: [patientLocation.lon, patientLocation.lat],
        duration: 600,
      });
    }
  }, [patientLocation]);

  // Sync Hospital Markers (Interactive with Clickable Details)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Clear existing hospital markers
    hospitalMarkersRef.current.forEach((m) => m.remove());
    hospitalMarkersRef.current = [];

    if (!hospitals || hospitals.length === 0) return;

    const displayHospitals = hospitals.slice(0, 30);
    displayHospitals.forEach((h) => {
      const el = document.createElement("div");
      el.className = "group relative cursor-pointer select-none";

      const pin = document.createElement("div");
      pin.className =
        "w-7 h-7 rounded-full bg-white shadow-md border-2 border-[#0B8A7E] flex items-center justify-center text-[#0B8A7E] font-black text-xs hover:scale-115 transition-transform hover:z-20";
      pin.textContent = "H";

      const tooltip = document.createElement("div");
      tooltip.className =
        "opacity-0 group-hover:opacity-100 pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[#111827] text-white text-[10px] font-semibold rounded shadow-md whitespace-nowrap transition-opacity z-30";
      tooltip.textContent = h.name;

      el.appendChild(pin);
      el.appendChild(tooltip);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([h.lon, h.lat])
        .addTo(map);

      // Hospital Click Popup
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        new maplibregl.Popup({ offset: 15, closeButton: true })
          .setLngLat([h.lon, h.lat])
          .setHTML(
            `<div class="p-1 text-xs select-none">
              <div class="font-bold text-[#111827] text-sm flex items-center gap-1.5">
                <span class="w-4 h-4 rounded-full bg-[#0B8A7E] text-white flex items-center justify-center text-[10px] font-bold">H</span>
                <span>${escapeHtml(h.name)}</span>
              </div>
              <div class="text-[#6B7280] text-[11px] mt-1">
                Emergency Hospital Destination
              </div>
              <div class="text-[10px] text-[#0B8A7E] font-medium mt-1">
                Coordinates: ${h.lat.toFixed(4)}, ${h.lon.toFixed(4)}
              </div>
            </div>`
          )
          .addTo(map);
      });

      hospitalMarkersRef.current.push(marker);
    });
  }, [hospitals, mapLoaded]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Interactive Helper Banner */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#E5E7EB] shadow-sm text-xs font-medium text-[#374151]">
        <span className="material-symbols-outlined text-[16px] text-[#0B8A7E]">touch_app</span>
        <span>Click map or drag patient pin to set emergency origin</span>
      </div>

      {/* Floating GPS Locate Me Button */}
      <div className="absolute top-24 right-2.5 z-10 flex items-center">
        {gpsError && (
          <div className="mr-2 px-2.5 py-1 rounded-lg bg-[#FEE2E2] border border-[#EF4444]/40 text-[#991B1B] text-[10px] font-bold shadow-md whitespace-nowrap animate-fade-in flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">error</span>
            <span>{gpsError}</span>
          </div>
        )}
        <button
          onClick={handleLocateMe}
          disabled={isLocating}
          title="Use My Current Location (GPS)"
          aria-label="Locate patient using GPS"
          className={`w-9 h-9 rounded-xl shadow-md border flex items-center justify-center transition-all ${
            isLocating ? "animate-pulse" : ""
          } ${
            isDarkMode
              ? "bg-[#1E293B] border-[#334155] text-[#38BDF8] hover:bg-[#334155]"
              : "bg-white border-[#E5E7EB] text-[#0284C7] hover:bg-[#F0F9FF]"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {isLocating ? "autorenew" : "my_location"}
          </span>
        </button>
      </div>

      {/* Floating Legend */}
      <div
        className={`hidden sm:block absolute bottom-4 left-4 z-10 backdrop-blur-xs border rounded-xl shadow-md p-3 select-none text-xs transition-colors ${
          isDarkMode
            ? "bg-[#0F172A]/90 border-[#1E293B] text-white"
            : "bg-white/95 border-[#E5E7EB] text-[#111827]"
        }`}
      >
        <div
          className={`font-bold text-[11px] mb-2 uppercase tracking-wider ${
            isDarkMode ? "text-[#94A3B8]" : "text-[#111827]"
          }`}
        >
          Legend
        </div>
        <div className="flex flex-col gap-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-5 h-1 bg-[#DC2626] rounded-full" />
            <span className={isDarkMode ? "text-[#CBD5E1]" : "text-[#374151]"}>
              Likely to flood (proxy)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-0.5 border-t-2 border-dashed border-[#2563EB]" />
            <span className={isDarkMode ? "text-[#CBD5E1]" : "text-[#374151]"}>
              Normal route (direct)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-1.5 bg-[#0B8A7E] rounded-full" />
            <span
              className={
                isDarkMode ? "text-[#2DD4BF] font-semibold" : "text-[#065F46] font-semibold"
              }
            >
              Flood-safe route
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`w-4 h-4 rounded-full border flex items-center justify-center font-bold text-[9px] ${
                isDarkMode
                  ? "bg-[#1E293B] border-[#2DD4BF] text-[#2DD4BF]"
                  : "bg-white border-[#0B8A7E] text-[#0B8A7E]"
              }`}
            >
              H
            </span>
            <span className={isDarkMode ? "text-[#CBD5E1]" : "text-[#374151]"}>
              Hospital destination
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
