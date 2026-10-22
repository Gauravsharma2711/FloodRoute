"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  api,
  useMeta,
  useScenarios,
  useFlagged,
  useHospitals,
  useValidation,
  useEDA,
} from "../lib/api";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { Map } from "../components/Map";
import { MobileDrawer } from "../components/MobileDrawer";
import { ReliabilityModal } from "../components/ReliabilityModal";
import { PresetLocation, RouteResponse, Scenario } from "../types/api";

export default function Home() {
  const { data: meta } = useMeta();
  const { data: scenariosData } = useScenarios();
  const { data: hospitals } = useHospitals();
  const { data: validationData } = useValidation();
  const { data: edaData } = useEDA();

  // Combine replay days + forecast into flat array
  const allScenarios: Scenario[] = [];
  if (scenariosData?.forecast) {
    allScenarios.push(scenariosData.forecast);
  }
  if (scenariosData?.replay_days) {
    allScenarios.push(...scenariosData.replay_days);
  }

  // Active state
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("replay_2020_08_05");
  const [shareOverride, setShareOverride] = useState<number | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>("hindmata");
  const [patientLocation, setPatientLocation] = useState<{ lat: number; lon: number } | null>({
    lat: 19.0101,
    lon: 72.8421,
  });
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [isRoutingLoading, setIsRoutingLoading] = useState<boolean>(false);
  const [isReliabilityOpen, setIsReliabilityOpen] = useState<boolean>(false);

  // In-flight abort controller for routing requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch Flagged Roads for active scenario & share
  const { data: flaggedData } = useFlagged(selectedScenarioId, shareOverride);

  // Initialize defaults once meta/scenarios load
  useEffect(() => {
    if (scenariosData && scenariosData.replay_days.length > 0 && !selectedScenarioId) {
      setSelectedScenarioId(scenariosData.replay_days[0].id);
    }
  }, [scenariosData, selectedScenarioId]);

  // Handle Preset Selection
  const handleSelectPreset = (preset: PresetLocation) => {
    setSelectedPresetId(preset.id);
    setPatientLocation({ lat: preset.lat, lon: preset.lon });
  };

  // Handle Map Click Selection
  const handleSelectLocation = (lat: number, lon: number) => {
    setSelectedPresetId(null);
    setPatientLocation({ lat, lon });
  };

  // Compute Route on Location / Scenario / Share Change
  useEffect(() => {
    if (!patientLocation || !selectedScenarioId) {
      setRouteData(null);
      return;
    }

    // Cancel in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsRoutingLoading(true);

    api
      .route(
        patientLocation.lat,
        patientLocation.lon,
        selectedScenarioId,
        shareOverride,
        controller.signal
      )
      .then((res) => {
        setRouteData(res);
        setIsRoutingLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Routing error:", err);
          setIsRoutingLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [patientLocation, selectedScenarioId, shareOverride]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white text-[#111827]">
      {/* Top Header & Ribbon */}
      <Header meta={meta} onOpenReliability={() => setIsReliabilityOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        {/* Desktop Sidebar (visible on lg screens >= 1024px) */}
        <div className="hidden lg:block h-full">
          <Sidebar
            scenarios={allScenarios}
            selectedScenarioId={selectedScenarioId}
            onSelectScenario={(id) => setSelectedScenarioId(id)}
            presets={meta?.presets || []}
            selectedPresetId={selectedPresetId}
            onSelectPreset={handleSelectPreset}
            patientLocation={patientLocation}
            routeData={routeData}
            isRoutingLoading={isRoutingLoading}
            shareOverride={shareOverride}
            onChangeShareOverride={setShareOverride}
          />
        </div>

        {/* Map Viewport */}
        <main className="flex-1 h-full relative">
          <Map
            flaggedData={flaggedData}
            hospitals={hospitals}
            normalRoute={routeData?.normal}
            safeRoute={routeData?.safe}
            routeStatus={routeData?.status}
            patientLocation={patientLocation}
            onSelectLocation={handleSelectLocation}
            className="w-full h-full"
          />

          {/* Mobile Bottom Sheet (visible on mobile < 1024px) */}
          <div className="lg:hidden absolute bottom-0 left-0 right-0">
            <MobileDrawer
              scenarios={allScenarios}
              selectedScenarioId={selectedScenarioId}
              onSelectScenario={(id) => setSelectedScenarioId(id)}
              presets={meta?.presets || []}
              selectedPresetId={selectedPresetId}
              onSelectPreset={handleSelectPreset}
              patientLocation={patientLocation}
              routeData={routeData}
              isRoutingLoading={isRoutingLoading}
              onOpenReliability={() => setIsReliabilityOpen(true)}
            />
          </div>
        </main>
      </div>

      {/* Footer Attribution Bar */}
      <footer className="w-full bg-[#F9FAFB] border-t border-[#E5E7EB] px-4 py-1.5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#6B7280] select-none z-10">
        <div>
          <span>© OpenStreetMap contributors · Copernicus DEM GLO-30 · Open-Meteo · IMD</span>
        </div>
        <div className="text-[10px] text-[#9CA3AF] mt-0.5 sm:mt-0">
          Prototype for decision support — not an official warning system
        </div>
      </footer>

      {/* Reliability, Proof & Limits Modal */}
      <ReliabilityModal
        isOpen={isReliabilityOpen}
        onClose={() => setIsReliabilityOpen(false)}
        validationData={validationData}
        edaData={edaData}
        dataMode={meta?.data_mode}
      />
    </div>
  );
}
