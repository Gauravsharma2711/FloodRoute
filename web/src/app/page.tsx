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
import { ErrorBoundary } from "../components/ErrorBoundary";
import { PresetLocation, RouteResponse, Scenario } from "../types/api";

function playEmergencyTone() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(440, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // AudioContext blocked by browser policy or unavailable
  }
}

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
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState<number>(0);

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

  // Compute Route on Location / Scenario / Share / Retry Change
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
        setRouteError(null);
        setIsRoutingLoading(false);
        if (res.status === "cut_off") {
          playEmergencyTone();
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Routing error:", err);
          setRouteError("Unable to reach routing service. Retrying or using cached corridor data...");
          setIsRoutingLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [patientLocation, selectedScenarioId, shareOverride, retryTrigger]);

  return (
    <ErrorBoundary>
      <div className={`flex flex-col h-screen w-screen overflow-hidden transition-colors ${isDarkMode ? "bg-[#0B0F17] text-white" : "bg-white text-[#111827]"}`}>
        {/* Top Header & Ribbon */}
        <Header
          meta={meta}
          onOpenReliability={() => setIsReliabilityOpen(true)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />

        {/* Global Floating Error Toast */}
        {routeError && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#FEF2F2] border border-[#EF4444]/40 text-[#991B1B] px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium animate-fade-in">
            <span className="material-symbols-outlined text-[18px] text-[#DC2626]">warning</span>
            <span>{routeError}</span>
            <button
              onClick={() => setRetryTrigger((prev) => prev + 1)}
              className="ml-2 px-2.5 py-0.5 rounded bg-[#DC2626] text-white text-[11px] font-bold hover:bg-[#B91C1C] transition-colors shadow-xs"
            >
              Retry
            </button>
            <button
              onClick={() => setRouteError(null)}
              className="text-[#991B1B] hover:text-[#7F1D1D] ml-1 text-base leading-none p-0.5"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

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
              isDarkMode={isDarkMode}
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
        <footer className={`w-full border-t px-4 py-1.5 flex flex-col sm:flex-row items-center justify-between text-[11px] select-none z-10 transition-colors ${
          isDarkMode
            ? "bg-[#0F172A] border-[#1E293B] text-[#94A3B8]"
            : "bg-[#F9FAFB] border-[#E5E7EB] text-[#6B7280]"
        }`}>
          <div>
            <span>© OpenStreetMap contributors · Copernicus DEM GLO-30 · Open-Meteo · IMD</span>
          </div>
          <div className={`text-[10px] mt-0.5 sm:mt-0 ${isDarkMode ? "text-[#64748B]" : "text-[#9CA3AF]"}`}>
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
    </ErrorBoundary>
  );
}
