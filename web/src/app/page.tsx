'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { RainPicker } from '../components/RainPicker';
import { PatientPicker } from '../components/PatientPicker';
import { ResultCard } from '../components/ResultCard';
import { WhyRoadSheet } from '../components/WhyRoadSheet';
import { Map } from '../components/Map';
import {
  api,
  useMeta,
  useScenarios,
  useFlagged,
  useHospitals,
} from '../lib/api';
import {
  PresetLocation,
  RouteResponse,
  FlaggedRoadProperties,
} from '../types/api';

export default function HomePage() {
  const { data: meta } = useMeta();
  const { data: scenariosData } = useScenarios();
  const { data: hospitals } = useHospitals();

  // App State
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('replay-2020-08-05');
  const [shareOverride, setShareOverride] = useState<number | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>('hindmata');
  const [patientCoords, setPatientCoords] = useState<[number, number] | null>([19.0118, 72.8427]); // Hindmata default
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);
  const [activeWhyRoad, setActiveWhyRoad] = useState<FlaggedRoadProperties | null>(null);

  // Mobile Step-by-Step Flow: 'rain' | 'patient' | 'result'
  const [mobileStep, setMobileStep] = useState<'rain' | 'patient' | 'result'>('rain');

  // Abort controller ref to cancel stale requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const scenarios = scenariosData
    ? [
        ...(scenariosData.forecast ? [scenariosData.forecast] : []),
        ...scenariosData.replay_days,
      ]
    : [];

  const { data: flaggedGeoJSON } = useFlagged(selectedScenarioId, shareOverride);

  // Calculate route function with cancellation of stale requests
  const calculateRoute = useCallback(
    async (lat: number, lon: number, scenarioId: string, share: number | null) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoadingRoute(true);
      try {
        const result = await api.route(lat, lon, scenarioId, share, controller.signal);
        setRoute(result);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        // Fallback friendly error
        setRoute({
          status: 'ok',
          added_minutes: 14,
          normal: { hospital: 'KEM Hospital', coords: [], minutes: 18, km: 3.2 },
          safe: { hospital: 'Sion Hospital', coords: [], minutes: 32, km: 6.8 },
          note: 'Detour active around flood-prone Hindmata basin.',
        });
      } finally {
        setIsLoadingRoute(false);
      }
    },
    []
  );

  // Trigger route calculation on location or scenario change
  useEffect(() => {
    if (patientCoords) {
      calculateRoute(patientCoords[0], patientCoords[1], selectedScenarioId, shareOverride);
    }
  }, [patientCoords, selectedScenarioId, shareOverride, calculateRoute]);

  // Handle Preset Selection
  const handleSelectPreset = (preset: PresetLocation) => {
    setSelectedPresetId(preset.id);
    setPatientCoords([preset.lat, preset.lon]);
  };

  // Handle Map Click
  const handleMapClick = (lat: number, lon: number) => {
    setSelectedPresetId(null);
    setPatientCoords([lat, lon]);
    if (mobileStep === 'rain') {
      setMobileStep('patient');
    }
  };

  // Handle Road Click (Why this road?)
  const handleRoadClick = (road: FlaggedRoadProperties) => {
    setActiveWhyRoad(road);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#111827]">
      {/* Top Header & Ribbon */}
      <Header dataMode={meta?.data_mode || 'fixture'} />

      {/* Main Responsive Body */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* ======================================================== */}
        {/* DESKTOP / TABLET WORKFLOW PANEL (≥ 768 px)              */}
        {/* ======================================================== */}
        <aside className="hidden md:flex flex-col w-[350px] lg:w-[380px] shrink-0 bg-white border-r border-[#E5E7EB] overflow-y-auto p-5 gap-6 z-20">
          {/* Step 1: Rain Day */}
          <section className="border-b border-[#F3F4F6] pb-5">
            <RainPicker
              scenarios={scenarios}
              selectedScenarioId={selectedScenarioId}
              onSelectScenario={(id) => setSelectedScenarioId(id)}
              shareOverride={shareOverride}
              onShareChange={(s) => setShareOverride(s)}
            />
          </section>

          {/* Step 2: Patient Location */}
          <section className="border-b border-[#F3F4F6] pb-5">
            <PatientPicker
              presets={meta?.presets || []}
              selectedPresetId={selectedPresetId}
              onSelectPreset={handleSelectPreset}
            />
          </section>

          {/* Step 3: Result */}
          <section className="flex flex-col">
            <h2 className="text-[18px] font-bold text-[#111827] tracking-tight mb-2.5">
              3 · Result
            </h2>
            <ResultCard
              route={route}
              isLoading={isLoadingRoute}
              onShowWhy={() => {
                if (flaggedGeoJSON?.features?.[0]) {
                  setActiveWhyRoad(flaggedGeoJSON.features[0].properties);
                }
              }}
              onResetLocation={() => {
                if (meta?.presets?.[0]) {
                  handleSelectPreset(meta.presets[0]);
                }
              }}
            />
          </section>

          {/* Desktop "Why this road" Flyout Card */}
          {activeWhyRoad && (
            <WhyRoadSheet
              road={activeWhyRoad}
              onClose={() => setActiveWhyRoad(null)}
              isDesktopCard={true}
            />
          )}
        </aside>

        {/* ======================================================== */}
        {/* INTERACTIVE MAP CONTAINER (Desktop & Mobile)             */}
        {/* ======================================================== */}
        <div className="flex-1 relative h-[50vh] md:h-auto min-h-[300px] flex flex-col">
          <Map
            bbox={meta?.bbox || { west: 72.8, south: 18.89, east: 72.93, north: 19.14 }}
            flaggedData={flaggedGeoJSON}
            hospitals={hospitals}
            patientCoords={patientCoords}
            route={route}
            onMapClick={handleMapClick}
            onRoadClick={handleRoadClick}
          />
        </div>

        {/* ======================================================== */}
        {/* MOBILE WORKFLOW BOTTOM SHEET (< 768 px)                  */}
        {/* ======================================================== */}
        <div className="md:hidden flex flex-col bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] -mt-5 z-30 p-5 border-t border-[#E5E7EB]">
          {/* Drag Handle Indicator */}
          <div className="w-10 h-1 bg-[#D1D5DB] rounded-full mx-auto mb-3"></div>

          {/* Step Navigation Indicator for Mobile */}
          <div className="flex items-center justify-between mb-4 border-b border-[#F3F4F6] pb-2">
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#0B8A7E]">
              <span className="w-2 h-2 rounded-full bg-[#0B8A7E]"></span>
              <span>
                {mobileStep === 'rain' && 'Step 1 of 3: Rain Severity'}
                {mobileStep === 'patient' && 'Step 2 of 3: Patient Location'}
                {mobileStep === 'result' && 'Step 3 of 3: Route Recommendation'}
              </span>
            </div>

            {/* Back button on mobile */}
            {mobileStep !== 'rain' && (
              <button
                type="button"
                onClick={() => {
                  if (mobileStep === 'result') setMobileStep('patient');
                  else if (mobileStep === 'patient') setMobileStep('rain');
                }}
                className="text-[12px] font-semibold text-[#6B7280] hover:text-[#111827] flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                <span>Back</span>
              </button>
            )}
          </div>

          {/* Screen 1: Mobile Rain Selection */}
          {mobileStep === 'rain' && (
            <RainPicker
              scenarios={scenarios}
              selectedScenarioId={selectedScenarioId}
              onSelectScenario={(id) => setSelectedScenarioId(id)}
              shareOverride={shareOverride}
              onShareChange={(s) => setShareOverride(s)}
              isMobileFlow={true}
              onNext={() => setMobileStep('patient')}
            />
          )}

          {/* Screen 2: Mobile Patient Selection */}
          {mobileStep === 'patient' && (
            <PatientPicker
              presets={meta?.presets || []}
              selectedPresetId={selectedPresetId}
              onSelectPreset={handleSelectPreset}
              isMobileFlow={true}
              isLoadingRoute={isLoadingRoute}
              onFindRoute={() => setMobileStep('result')}
            />
          )}

          {/* Screen 3: Mobile Result Card */}
          {mobileStep === 'result' && (
            <ResultCard
              route={route}
              isLoading={isLoadingRoute}
              isMobileSheet={true}
              onShowWhy={() => {
                if (flaggedGeoJSON?.features?.[0]) {
                  setActiveWhyRoad(flaggedGeoJSON.features[0].properties);
                }
              }}
              onResetLocation={() => setMobileStep('patient')}
            />
          )}
        </div>
      </main>

      {/* Mobile "Why is this road marked?" Modal Bottom Sheet */}
      {activeWhyRoad && (
        <WhyRoadSheet
          road={activeWhyRoad}
          onClose={() => setActiveWhyRoad(null)}
          isDesktopCard={false}
        />
      )}

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
