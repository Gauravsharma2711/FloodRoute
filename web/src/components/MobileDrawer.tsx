"use client";

import React, { useState } from "react";
import {
  Scenario,
  PresetLocation,
  RouteResponse,
  RouteStatus,
} from "../types/api";

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
              <MobileResultCard routeData={routeData} onOpenReliability={onOpenReliability} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MobileResultCard({
  routeData,
  onOpenReliability,
}: {
  routeData?: RouteResponse | null;
  onOpenReliability: () => void;
}) {
  if (!routeData) return null;

  const { status, normal, safe, added_minutes, blocked_on_normal, note } = routeData;

  if (status === "cut_off") {
    return (
      <div className="space-y-3">
        <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#EF4444]/40">
          <div className="flex items-center gap-1.5 text-[#DC2626] font-bold text-xs uppercase tracking-wide">
            <span className="material-symbols-outlined text-base">crisis_alert</span>
            <span>No Flood-Safe Route</span>
          </div>
          <div className="text-2xl font-black text-[#991B1B] mt-1">Area Cut Off</div>
          <p className="text-[#7F1D1D] text-xs mt-1 leading-relaxed font-medium">
            {note}
          </p>
        </div>
      </div>
    );
  }

  if (status === "no_change") {
    return (
      <div className="space-y-3">
        <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#22C55E]/40">
          <div className="flex items-center gap-1.5 text-[#16A34A] font-bold text-xs uppercase tracking-wide">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>Route Unaffected</span>
          </div>
          <div className="text-2xl font-black text-[#166534] mt-1">
            {normal?.minutes.toFixed(0)} min
          </div>
          <p className="text-[#15803D] text-xs font-semibold mt-0.5">
            Direct to {normal?.hospital}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-4xl font-black text-[#111827] tracking-tight">
            +{added_minutes?.toFixed(0) || "14"} min
          </div>
          <div className="text-sm font-bold text-[#0B8A7E] mt-0.5">
            Go to {safe?.hospital}
          </div>
        </div>
        <div className="text-right text-xs text-[#6B7280]">
          <div>Normal: {normal?.minutes.toFixed(0)} min</div>
          <div className="font-semibold text-[#0B8A7E]">Safe: {safe?.minutes.toFixed(0)} min</div>
        </div>
      </div>

      {blocked_on_normal && blocked_on_normal.length > 0 && (
        <div className="p-2.5 rounded-xl bg-[#FEF2F2] text-[#DC2626] border border-[#EF4444]/20 text-xs font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-base shrink-0">warning</span>
          <span className="truncate">
            <strong>Avoid: </strong>
            {blocked_on_normal.map((b) => b.name).join(", ")}
          </span>
        </div>
      )}

      {/* Maneuver & Route Step Navigation Waypoints */}
      <div className="p-2 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-[11px] space-y-1.5">
        <div className="font-bold text-[#374151] flex items-center gap-1 text-[10px] uppercase tracking-wider">
          <span className="material-symbols-outlined text-[14px] text-[#0B8A7E]">alt_route</span>
          <span>Corridor Waypoints</span>
        </div>
        <div className="flex items-center gap-2 text-[#4B5563]">
          <span className="w-4 h-4 rounded-full bg-[#1F2937] text-white flex items-center justify-center font-bold text-[9px] shrink-0">1</span>
          <span className="truncate">Pickup Location → Avoid {blocked_on_normal?.[0]?.name || "waterlogged basin"}</span>
        </div>
        <div className="flex items-center gap-2 text-[#065F46] font-semibold">
          <span className="w-4 h-4 rounded-full bg-[#0B8A7E] text-white flex items-center justify-center font-bold text-[9px] shrink-0">2</span>
          <span className="truncate">Safe Elevated Bypass (+{added_minutes?.toFixed(0) || "14"} min)</span>
        </div>
        <div className="flex items-center gap-2 text-[#1E40AF] font-semibold">
          <span className="w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-[9px] shrink-0">3</span>
          <span className="truncate">Arrive: {safe?.hospital || "Hospital"}</span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-[#F3F4F6] text-xs">
        <button
          onClick={onOpenReliability}
          className="text-[#0B8A7E] font-semibold underline underline-offset-2"
        >
          Why these roads? · Proof & Limits
        </button>
      </div>
    </div>
  );
}
