"use client";

import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { FlaggedGeoJSON, Hospital, RouteLeg, RouteStatus } from "../types/api";

interface MapProps {
  flaggedData?: FlaggedGeoJSON;
  hospitals?: Hospital[];
  normalRoute?: RouteLeg | null;
  safeRoute?: RouteLeg | null;
  routeStatus?: RouteStatus;
  patientLocation?: { lat: number; lon: number } | null;
  onSelectLocation: (lat: number, lon: number) => void;
  className?: string;
}

export function Map({
  flaggedData,
  hospitals,
  normalRoute,
  safeRoute,
  routeStatus,
  patientLocation,
  onSelectLocation,
  className = "",
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const patientMarkerRef = useRef<maplibregl.Marker | null>(null);
  const hospitalMarkersRef = useRef<maplibregl.Marker[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  // Initialize Map
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

    map.on("load", () => {
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

          popup
            .setLngLat(e.lngLat)
            .setHTML(
              `<div class="text-xs">
                <div class="font-bold text-[#111827] text-sm">${name}</div>
                <div class="text-[#DC2626] font-semibold text-[11px] mt-0.5">Flood-prone score: ${score} · High Risk</div>
                <div class="text-[#4B5563] text-[11px] mt-1 bg-[#F3F4F6] p-1.5 rounded">${why}</div>
              </div>`
            )
            .addTo(map);
        }
      });

      map.on("mouseleave", "flagged-roads-line", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });

      // Map Click Handler for Patient Placement
      map.on("click", (e) => {
        onSelectLocation(e.lngLat.lat, e.lngLat.lng);
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onSelectLocation]);

  // Update Flagged Roads Data
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource("flagged-roads") as maplibregl.GeoJSONSource | undefined;
    if (source && flaggedData) {
      source.setData(flaggedData as unknown as GeoJSON.GeoJSON);
    }
  }, [flaggedData]);

  // Update Routes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // Normal Route update
    const normalSource = map.getSource("normal-route") as maplibregl.GeoJSONSource | undefined;
    if (normalSource) {
      if (normalRoute && normalRoute.coords && normalRoute.coords.length > 0) {
        // coords are [[lat, lon], ...] -> MapLibre wants [[lon, lat], ...]
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
  }, [normalRoute, safeRoute, routeStatus]);

  // Update Patient Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (patientLocation) {
      if (!patientMarkerRef.current) {
        const el = document.createElement("div");
        el.className = "flex flex-col items-center cursor-pointer select-none group";
        el.innerHTML = `
          <div class="px-2 py-0.5 mb-1 rounded bg-[#1F2937] text-white text-[10px] font-bold shadow-md tracking-wide">
            Patient
          </div>
          <div class="w-8 h-8 rounded-full bg-[#F59E0B] shadow-lg flex items-center justify-center text-white ring-3 ring-white transition-transform group-hover:scale-110">
            <span class="material-symbols-outlined text-[18px]">person_pin_circle</span>
          </div>
        `;
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([patientLocation.lon, patientLocation.lat])
          .addTo(map);
        patientMarkerRef.current = marker;
      } else {
        patientMarkerRef.current.setLngLat([patientLocation.lon, patientLocation.lat]);
      }
    } else if (patientMarkerRef.current) {
      patientMarkerRef.current.remove();
      patientMarkerRef.current = null;
    }
  }, [patientLocation]);

  // Update Hospital Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing hospital markers
    hospitalMarkersRef.current.forEach((m) => m.remove());
    hospitalMarkersRef.current = [];

    if (!hospitals || hospitals.length === 0) return;

    // Add up to ~30 major hospitals as styled clean pins
    const displayHospitals = hospitals.slice(0, 30);
    displayHospitals.forEach((h) => {
      const el = document.createElement("div");
      el.className = "group relative cursor-pointer select-none";
      el.innerHTML = `
        <div class="w-7 h-7 rounded-full bg-white shadow-md border-2 border-[#0B8A7E] flex items-center justify-center text-[#0B8A7E] font-black text-xs hover:scale-115 transition-transform hover:z-20">
          H
        </div>
        <div class="opacity-0 group-hover:opacity-100 pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[#111827] text-white text-[10px] font-semibold rounded shadow-md whitespace-nowrap transition-opacity z-30">
          ${h.name}
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([h.lon, h.lat])
        .addTo(map);

      hospitalMarkersRef.current.push(marker);
    });
  }, [hospitals]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Legend */}
      <div className="hidden sm:block absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-xs border border-[#E5E7EB] rounded-xl shadow-md p-3 select-none text-xs">
        <div className="font-bold text-[#111827] text-[11px] mb-2 uppercase tracking-wider">
          Legend
        </div>
        <div className="flex flex-col gap-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-5 h-1 bg-[#DC2626] rounded-full" />
            <span className="text-[#374151]">Likely to flood (proxy)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-0.5 border-t-2 border-dashed border-[#2563EB]" />
            <span className="text-[#374151]">Normal route (direct)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-1.5 bg-[#0B8A7E] rounded-full" />
            <span className="text-[#065F46] font-semibold">Flood-safe route</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-4 h-4 rounded-full bg-white border border-[#0B8A7E] flex items-center justify-center font-bold text-[9px] text-[#0B8A7E]">
              H
            </span>
            <span className="text-[#374151]">Hospital destination</span>
          </div>
        </div>
      </div>
    </div>
  );
}
