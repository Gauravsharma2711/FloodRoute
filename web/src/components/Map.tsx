'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import {
  FlaggedGeoJSON,
  Hospital,
  RouteResponse,
  FlaggedRoadProperties,
  BoundingBox,
} from '../types/api';

interface MapProps {
  bbox: BoundingBox;
  flaggedData?: FlaggedGeoJSON;
  hospitals?: Hospital[];
  patientCoords: [number, number] | null; // [lat, lon]
  route: RouteResponse | null;
  onMapClick?: (lat: number, lon: number) => void;
  onRoadClick?: (road: FlaggedRoadProperties) => void;
}

const CARTO_POSITRON_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

export function Map({
  bbox,
  flaggedData,
  hospitals = [],
  patientCoords,
  route,
  onMapClick,
  onRoadClick,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const patientMarker = useRef<MapLibreMarker | null>(null);
  const hospitalMarkers = useRef<MapLibreMarker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    let isMounted = true;

    async function initMap() {
      const maplibregl = (await import('maplibre-gl')).default;
      if (!isMounted || !mapContainer.current) return;

      const mapInstance = new maplibregl.Map({
        container: mapContainer.current,
        style: CARTO_POSITRON_STYLE,
        center: [72.845, 19.030], // Central Mumbai
        zoom: 12,
        minZoom: 10,
        maxZoom: 17,
        attributionControl: { compact: true },
      });

      mapInstance.on('load', () => {
        if (!isMounted) return;
        map.current = mapInstance;
        setMapLoaded(true);

        // 1. Study area boundary layer
        const boundaryGeoJSON = {
          type: 'Feature' as const,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [
              [
                [bbox.west, bbox.south],
                [bbox.east, bbox.south],
                [bbox.east, bbox.north],
                [bbox.west, bbox.north],
                [bbox.west, bbox.south],
              ],
            ],
          },
          properties: {},
        };

        mapInstance.addSource('study-boundary', {
          type: 'geojson',
          data: boundaryGeoJSON,
        });

        mapInstance.addLayer({
          id: 'study-boundary-line',
          type: 'line',
          source: 'study-boundary',
          paint: {
            'line-color': '#94A3B8',
            'line-width': 1.5,
            'line-dasharray': [3, 2],
          },
        });

        // 2. Flagged roads source & layer
        mapInstance.addSource('flagged-roads', {
          type: 'geojson',
          data: flaggedData || { type: 'FeatureCollection', features: [] },
        });

        mapInstance.addLayer({
          id: 'flagged-roads-glow',
          type: 'line',
          source: 'flagged-roads',
          paint: {
            'line-color': [
              'interpolate',
              ['linear'],
              ['get', 'score'],
              0.7, '#FEF08A',
              0.85, '#FED7AA',
              0.95, '#FECACA',
            ],
            'line-width': 8,
            'line-opacity': 0.5,
          },
        });

        mapInstance.addLayer({
          id: 'flagged-roads-line',
          type: 'line',
          source: 'flagged-roads',
          paint: {
            'line-color': [
              'interpolate',
              ['linear'],
              ['get', 'score'],
              0.7, '#F5B83D',  // Low / Caution
              0.85, '#F97316', // Medium
              0.95, '#DC2626', // Impassable / Severe
            ],
            'line-width': 4.5,
            'line-opacity': 0.95,
          },
        });

        // Road click & hover events
        mapInstance.on('click', 'flagged-roads-line', (e) => {
          if (e.features && e.features[0] && onRoadClick) {
            const props = e.features[0].properties as FlaggedRoadProperties;
            onRoadClick(props);
          }
        });

        mapInstance.on('mouseenter', 'flagged-roads-line', () => {
          mapInstance.getCanvas().style.cursor = 'pointer';
        });

        mapInstance.on('mouseleave', 'flagged-roads-line', () => {
          mapInstance.getCanvas().style.cursor = '';
        });

        // 3. Normal Route source & layer (dashed blue)
        mapInstance.addSource('normal-route', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });

        mapInstance.addLayer({
          id: 'normal-route-line',
          type: 'line',
          source: 'normal-route',
          paint: {
            'line-color': '#2563EB',
            'line-width': 4,
            'line-dasharray': [2, 2],
            'line-opacity': 0.85,
          },
        });

        // 4. Safe Detour Route source & layer (solid teal)
        mapInstance.addSource('safe-route', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });

        mapInstance.addLayer({
          id: 'safe-route-line-casing',
          type: 'line',
          source: 'safe-route',
          paint: {
            'line-color': '#003833',
            'line-width': 8,
            'line-opacity': 0.25,
          },
        });

        mapInstance.addLayer({
          id: 'safe-route-line',
          type: 'line',
          source: 'safe-route',
          paint: {
            'line-color': '#0B8A7E',
            'line-width': 5.5,
            'line-opacity': 0.95,
          },
        });

        // Map Click Event for patient placement
        mapInstance.on('click', (e) => {
          // If clicked a road feature, skip placing pin
          const features = mapInstance.queryRenderedFeatures(e.point, {
            layers: ['flagged-roads-line'],
          });
          if (features.length > 0) return;

          if (onMapClick) {
            onMapClick(e.lngLat.lat, e.lngLat.lng);
          }
        });
      });
    }

    initMap();

    return () => {
      isMounted = false;
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update Flagged Roads Layer
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const source = map.current.getSource('flagged-roads') as any;
    if (source && flaggedData) {
      source.setData(flaggedData);
    }
  }, [flaggedData, mapLoaded]);

  // Update Route Layers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const normalSource = map.current.getSource('normal-route') as any;
    const safeSource = map.current.getSource('safe-route') as any;

    if (normalSource) {
      if (route?.normal?.coords && route.normal.coords.length > 1) {
        normalSource.setData({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: route.normal.coords.map(([lat, lon]) => [lon, lat]),
          },
          properties: {},
        });
      } else {
        normalSource.setData({ type: 'FeatureCollection', features: [] });
      }
    }

    if (safeSource) {
      if (route?.safe?.coords && route.safe.coords.length > 1) {
        safeSource.setData({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: route.safe.coords.map(([lat, lon]) => [lon, lat]),
          },
          properties: {},
        });
      } else {
        safeSource.setData({ type: 'FeatureCollection', features: [] });
      }
    }
  }, [route, mapLoaded]);

  // Update Patient Marker
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    async function updatePatient() {
      const maplibregl = (await import('maplibre-gl')).default;
      if (!map.current) return;

      if (!patientCoords) {
        if (patientMarker.current) {
          patientMarker.current.remove();
          patientMarker.current = null;
        }
        return;
      }

      const [lat, lon] = patientCoords;

      if (!patientMarker.current) {
        // Create custom amber DOM pin with pulse
        const el = document.createElement('div');
        el.className = 'relative flex items-center justify-center cursor-pointer';
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-9 h-9 rounded-full bg-[#F59E0B]/30 animate-ping"></span>
            <div class="w-8 h-8 rounded-full bg-[#F59E0B] shadow-lg flex items-center justify-center text-white ring-2 ring-white">
              <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1;">person_pin_circle</span>
            </div>
          </div>
        `;

        patientMarker.current = new maplibregl.Marker({
          element: el,
          draggable: true,
        })
          .setLngLat([lon, lat])
          .addTo(map.current);

        patientMarker.current.on('dragend', () => {
          if (!patientMarker.current || !onMapClick) return;
          const pos = patientMarker.current.getLngLat();
          onMapClick(pos.lat, pos.lng);
        });
      } else {
        patientMarker.current.setLngLat([lon, lat]);
      }
    }

    updatePatient();
  }, [patientCoords, mapLoaded, onMapClick]);

  // Update Hospital Markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    async function updateHospitals() {
      const maplibregl = (await import('maplibre-gl')).default;
      if (!map.current) return;

      // Clear existing markers
      hospitalMarkers.current.forEach((m) => m.remove());
      hospitalMarkers.current = [];

      hospitals.forEach((hosp) => {
        const el = document.createElement('div');
        el.className = 'group relative flex flex-col items-center cursor-pointer';
        el.innerHTML = `
          <div class="w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-[#111827] text-[#111827] font-bold text-[12px] group-hover:scale-110 transition-transform">
            H
          </div>
          <div class="hidden group-hover:block absolute bottom-8 px-2 py-0.5 rounded bg-[#111827] text-white text-[10px] font-semibold shadow-md whitespace-nowrap z-30">
            ${hosp.name}
          </div>
        `;

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([hosp.lon, hosp.lat])
          .addTo(map.current!);

        hospitalMarkers.current.push(marker);
      });
    }

    updateHospitals();
  }, [hospitals, mapLoaded]);

  return (
    <div className="relative w-full h-full min-h-[350px] bg-[#EEF2F6] overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Map Control buttons (Recenter & Zoom) */}
      <div className="absolute right-3 top-3 flex flex-col gap-1.5 z-20">
        <button
          type="button"
          onClick={() => {
            if (map.current) {
              map.current.flyTo({ center: [72.845, 19.030], zoom: 12, speed: 1.2 });
            }
          }}
          title="Recenter Central Mumbai"
          aria-label="Recenter map"
          className="w-9 h-9 rounded-xl bg-white shadow-md flex items-center justify-center text-[#374151] hover:bg-[#F9FAFB] transition-colors border border-[#E5E7EB]"
        >
          <span className="material-symbols-outlined text-[19px]">my_location</span>
        </button>
        <button
          type="button"
          onClick={() => map.current?.zoomIn()}
          aria-label="Zoom in"
          className="w-9 h-9 rounded-xl bg-white shadow-md flex items-center justify-center text-[#374151] hover:bg-[#F9FAFB] transition-colors border border-[#E5E7EB]"
        >
          <span className="material-symbols-outlined text-[19px]">add</span>
        </button>
        <button
          type="button"
          onClick={() => map.current?.zoomOut()}
          aria-label="Zoom out"
          className="w-9 h-9 rounded-xl bg-white shadow-md flex items-center justify-center text-[#374151] hover:bg-[#F9FAFB] transition-colors border border-[#E5E7EB]"
        >
          <span className="material-symbols-outlined text-[19px]">remove</span>
        </button>
      </div>

      {/* Route & Hazard Legend */}
      <div className="absolute left-3 bottom-3 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-xl shadow-md border border-[#E5E7EB] flex flex-col gap-1.5 text-[11px] font-semibold text-[#4B5563] z-20 select-none">
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 rounded-full bg-[#0B8A7E]"></span>
          <span>Flood-Safe Route</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 border-t-2 border-dashed border-[#2563EB]"></span>
          <span>Normal Route</span>
        </div>
        <div className="flex items-center gap-2 pt-0.5 border-t border-[#F3F4F6]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] -ml-1"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#F5B83D] -ml-1"></span>
          <span>Likely to flood</span>
        </div>
      </div>
    </div>
  );
}
