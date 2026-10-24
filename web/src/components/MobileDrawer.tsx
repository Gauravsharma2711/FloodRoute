"use client";

import React, { useState } from "react";
import {
  Scenario,
  PresetLocation,
  RouteResponse,
  RouteStatus,
} from "../types/api";
import { DecisionCard } from "./DecisionCard";

interface MobileDrawerProps {
  scenarios: Scenario[];
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
  presets: PresetLocation[];
  selectedPresetId?: string | null;
  onSelectPreset: (preset: PresetLocation) => void;
  patientLocation?: { lat: number; lon: number } | null;
  routeData?: RouteResponse | null;
  isRoutingLoading: boolean;
  onOpenReliability: () => void;
  shareOverride?: number | null;
}

export function MobileDrawer({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  presets,
  selectedPresetId,
  onSelectPreset,
  patientLocation,
  routeData,
  isRoutingLoading,
  onOpenReliability,
  shareOverride = null,
}: MobileDrawerProps) {
  const [activeStep, setActiveStep] = useState<"rain" | "patient" | "result">("result");

  const selectedScenario =
    scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  return (
    <div className="w-full bg-white border-t border-[#E5E7EB] shadow-2xl rounded-t-3xl flex flex-col z-30 select-none pb-safe max-h-[52vh] overflow-hidden">
      {/* Drawer Handle */}
      <div className="w-full flex justify-center py-2 shrink-0">
        <div className="w-12 h-1 bg-[#D1D5DB] rounded-full" />
      </div>

      {/* Step Switcher Tabs (≥48px tap target) */}
      <div className="grid grid-cols-3 border-b border-[#E5E7EB] px-3 gap-1 shrink-0">
        <button
          onClick={() => setActiveStep("rain")}
          className={`h-11 flex items-center justify-center gap-1.5 font-bold text-xs border-b-2 transition-all ${
            activeStep === "rain"
              ? "border-[#0B8A7E] text-[#0B8A7E]"
              : "border-transparent text-[#6B7280]"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">water_drop</span>
          <span>Rain Day</span>
        </button>
        <button
          onClick={() => setActiveStep("patient")}
          className={`h-11 flex items-center justify-center gap-1.5 font-bold text-xs border-b-2 transition-all ${
            activeStep === "patient"
              ? "border-[#0B8A7E] text-[#0B8A7E]"
              : "border-transparent text-[#6B7280]"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">person_pin_circle</span>
          <span>Patient</span>
        </button>
        <button
          onClick={() => setActiveStep("result")}
          className={`h-11 flex items-center justify-center gap-1.5 font-bold text-xs border-b-2 transition-all ${
            activeStep === "result"
              ? "border-[#0B8A7E] text-[#0B8A7E]"
              : "border-transparent text-[#6B7280]"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">navigation</span>
          <span>Route Result</span>
        </button>
      </div>

      {/* Drawer Content */}
      <div className="p-4 overflow-y-auto flex-1">
        {activeStep === "rain" && (
          <div className="flex flex-col gap-2">
            <div className="text-xs text-[#6B7280] mb-1 font-medium">
              Select heavy-rain replay scenario or forecast:
            </div>
            {scenarios.map((sc) => {
              const isSelected = sc.id === selectedScenarioId;
              return (
                <button
                  key={sc.id}
                  onClick={() => {
                    onSelectScenario(sc.id);
                    setActiveStep("result");
                  }}
                  type="button"
                  className={`w-full min-h-[48px] text-left p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                    isSelected
                      ? "bg-[#F0FDF4] border-[#0B8A7E] ring-1 ring-[#0B8A7E]"
                      : "bg-[#F9FAFB] border-[#E5E7EB]"
                  }`}
                >
                  <div>
                    <div className="font-bold text-[#111827] text-sm">{sc.label}</div>
                    <div className="text-[#6B7280] text-[11px] mt-0.5">
                      {sc.rain_mm} mm · Flagging {(sc.flag_share * 100).toFixed(0)}% roads
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#92400E]">
                    {sc.imd_category.replace("_", " ").toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {activeStep === "patient" && (
          <div>
            <div className="text-xs text-[#6B7280] mb-2 font-medium">
              Tap a preset location or tap anywhere on the map:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => {
                const isSelected = selectedPresetId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectPreset(p);
                      setActiveStep("result");
                    }}
                    type="button"
                    className={`min-h-[48px] px-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all ${
                      isSelected
                        ? "bg-[#0B8A7E] text-white border-[#0B8A7E]"
                        : "bg-[#F9FAFB] text-[#1F2937] border-[#E5E7EB]"
                    }`}
                  >
                    <span className="truncate">{p.name.split("/")[0]}</span>
                    {isSelected && (
                      <span className="material-symbols-outlined text-sm">check</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeStep === "result" && (
          <div>
            {isRoutingLoading ? (
              <div className="flex flex-col items-center justify-center py-6 text-xs text-[#6B7280]">
                <span className="material-symbols-outlined text-2xl animate-spin text-[#0B8A7E] mb-2">
                  sync
                </span>
                <span>Calculating safe ambulance route…</span>
              </div>
            ) : !patientLocation ? (
              <div className="text-center py-6 text-xs text-[#6B7280]">
                <p className="font-medium text-sm text-[#111827] mb-1">No Location Selected</p>
                <p>Tap a preset above or tap the map to find a safe ambulance route.</p>
                <button
                  onClick={() => setActiveStep("patient")}
                  className="mt-3 px-4 py-2 bg-[#0B8A7E] text-white text-xs font-bold rounded-xl"
                >
                  Choose Location
                </button>
              </div>
            ) : (
              <>
                <DecisionCard
                  routeData={routeData}
                  scenario={selectedScenario}
                  patientLocation={patientLocation}
                  shareOverride={shareOverride}
                  compact
                />
                <button
                  type="button"
                  onClick={onOpenReliability}
                  className="mt-2 w-full min-h-[44px] text-xs font-semibold text-[#0B8A7E] underline"
                >
                  How reliable is this?
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
