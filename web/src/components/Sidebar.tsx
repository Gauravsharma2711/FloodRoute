"use client";

import React, { useState } from "react";
import {
  Scenario,
  PresetLocation,
  RouteResponse,
  RouteStatus,
} from "../types/api";
import { DecisionCard } from "./DecisionCard";

interface SidebarProps {
  scenarios: Scenario[];
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
  presets: PresetLocation[];
  selectedPresetId?: string | null;
  onSelectPreset: (preset: PresetLocation) => void;
  patientLocation?: { lat: number; lon: number } | null;
  routeData?: RouteResponse | null;
  isRoutingLoading: boolean;
  shareOverride: number | null;
  onChangeShareOverride: (share: number | null) => void;
}

export function Sidebar({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  presets,
  selectedPresetId,
  onSelectPreset,
  patientLocation,
  routeData,
  isRoutingLoading,
  shareOverride,
  onChangeShareOverride,
}: SidebarProps) {
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [presetCategory, setPresetCategory] = useState<"all" | "basins" | "corridors">("all");

  const selectedScenario =
    scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  const currentFlagShare =
    shareOverride !== null ? shareOverride : selectedScenario?.flag_share ?? 0;

  const imdChipStyle = (cat: string) => {
    switch (cat) {
      case "extremely_heavy":
        return "bg-[#FEE2E2] text-[#991B1B] border-[#EF4444]/30";
      case "very_heavy":
        return "bg-[#FFEDD5] text-[#C2410C] border-[#F97316]/30";
      case "heavy":
        return "bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]/30";
      default:
        return "bg-[#F3F4F6] text-[#374151] border-[#D1D5DB]";
    }
  };

  const formatIMDCat = (cat: string) => {
    return cat.replace("_", " ").toUpperCase();
  };

  const filteredPresets = presets.filter((p) => {
    if (presetCategory === "basins") {
      return ["hindmata", "sion", "milan_subway", "kurla"].includes(p.id);
    }
    if (presetCategory === "corridors") {
      return ["chembur", "colaba", "andheri", "bandra"].includes(p.id);
    }
    return true;
  });

  return (
    <aside className="w-[360px] shrink-0 h-full bg-white/95 backdrop-blur-md border-r border-[#E5E7EB] shadow-xs flex flex-col justify-between p-5 overflow-y-auto select-none z-20 relative bg-[radial-gradient(#f3f4f6_1px,transparent_1px)] [background-size:16px_16px]">
      <div className="flex flex-col gap-6">
        {/* STEP 1: Rain Day */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="font-bold text-base text-[#111827] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#0B8A7E] text-white text-xs flex items-center justify-center font-bold shadow-xs">
                1
              </span>
              Rain day
            </h2>
            <span className="text-xs text-[#6B7280]">Real Open-Meteo days</span>
          </div>

          <div className="flex flex-col gap-2">
            {scenarios.map((sc) => {
              const isSelected = sc.id === selectedScenarioId;
              const rainPct = Math.min(100, Math.round((sc.rain_mm / 250) * 100));
              return (
                <button
                  key={sc.id}
                  onClick={() => onSelectScenario(sc.id)}
                  type="button"
                  className={`w-full text-left p-3 rounded-xl border transition-all text-xs relative overflow-hidden group ${
                    isSelected
                      ? "bg-[#F0FDF4] border-[#0B8A7E] ring-1 ring-[#0B8A7E] shadow-sm"
                      : "bg-[#F9FAFB] border-[#E5E7EB] hover:bg-white hover:border-[#D1D5DB] hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#111827] text-sm group-hover:text-[#0B8A7E] transition-colors">
                      {sc.label}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${imdChipStyle(
                        sc.imd_category
                      )}`}
                    >
                      {formatIMDCat(sc.imd_category)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[#6B7280]">
                    <span className="font-medium text-[#374151]">{sc.rain_mm} mm / day</span>
                    <span className="text-[11px] opacity-80">
                      {sc.source || "Historical Replay"}
                    </span>
                  </div>

                  {/* Micro Precipitation Bar Texture */}
                  <div className="w-full bg-[#E5E7EB] h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        sc.rain_mm > 200
                          ? "bg-gradient-to-r from-[#F97316] to-[#DC2626]"
                          : sc.rain_mm > 100
                          ? "bg-gradient-to-r from-[#F59E0B] to-[#F97316]"
                          : "bg-gradient-to-r from-[#0B8A7E] to-[#2563EB]"
                      }`}
                      style={{ width: `${rainPct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Assumption Note & What-if expander */}
          <div className="mt-2.5 pt-2 border-t border-[#F3F4F6]">
            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span>
                Flagging top{" "}
                <strong className="text-[#111827]">
                  {(currentFlagShare * 100).toFixed(0)}%
                </strong>{" "}
                most flood-prone roads{" "}
                <span className="text-[11px] text-[#9CA3AF]">(assumption)</span>
              </span>
              <button
                type="button"
                onClick={() => setShowWhatIf(!showWhatIf)}
                className="text-[#0B8A7E] font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>{showWhatIf ? "Hide" : "What if?"}</span>
                <span className="material-symbols-outlined text-[14px]">tune</span>
              </button>
            </div>

            {showWhatIf && (
              <div className="mt-2.5 p-3 rounded-xl bg-white border border-[#E5E7EB] shadow-xs text-xs">
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-[#374151]">Simulate Flag Share</span>
                  <span className="text-[#0B8A7E] font-bold">
                    {(currentFlagShare * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.03"
                  max="0.25"
                  step="0.01"
                  value={currentFlagShare}
                  onChange={(e) =>
                    onChangeShareOverride(parseFloat(e.target.value))
                  }
                  className="w-full accent-[#0B8A7E] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-1">
                  <span>3% (Light)</span>
                  <span>15% (Heavy)</span>
                  <span>25% (Deluge)</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* STEP 2: Patient Location */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-base text-[#111827] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#0B8A7E] text-white text-xs flex items-center justify-center font-bold shadow-xs">
                2
              </span>
              Patient location
            </h2>
            <span className="text-xs text-[#6B7280]">or click the map</span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 mb-2.5 text-[11px]">
            <button
              onClick={() => setPresetCategory("all")}
              type="button"
              className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                presetCategory === "all"
                  ? "bg-[#111827] text-white shadow-xs"
                  : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setPresetCategory("basins")}
              type="button"
              className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                presetCategory === "basins"
                  ? "bg-[#DC2626] text-white shadow-xs"
                  : "bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FCA5A5]/40"
              }`}
            >
              Chronic Basins
            </button>
            <button
              onClick={() => setPresetCategory("corridors")}
              type="button"
              className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                presetCategory === "corridors"
                  ? "bg-[#0B8A7E] text-white shadow-xs"
                  : "bg-[#CCFBF1] text-[#0F766E] hover:bg-[#99F6E4]/40"
              }`}
            >
              Corridors
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {filteredPresets.map((p) => {
              const isSelected = selectedPresetId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectPreset(p)}
                  type="button"
                  className={`h-9 px-3 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all text-left ${
                    isSelected
                      ? "bg-[#0B8A7E] text-white border-[#0B8A7E] shadow-sm"
                      : "bg-[#F9FAFB] text-[#1F2937] border-[#E5E7EB] hover:bg-white hover:border-[#D1D5DB]"
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[16px] ml-1 shrink-0">
                      check
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {patientLocation && (
            <div className="mt-2 text-[11px] text-[#6B7280] flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] ring-2 ring-[#F59E0B]/20" />
              <span>
                Coordinates: {patientLocation.lat.toFixed(4)},{" "}
                {patientLocation.lon.toFixed(4)}
              </span>
            </div>
          )}
        </section>
      </div>

      {/* STEP 3: Routing Result */}
      <section className="pt-4 border-t border-[#E5E7EB] mt-4">
        <h2 className="font-bold text-base text-[#111827] flex items-center gap-2 mb-2">
          <span className="w-5 h-5 rounded-full bg-[#0B8A7E] text-white text-xs flex items-center justify-center font-bold shadow-xs">
            3
          </span>
          Decision
        </h2>

        {isRoutingLoading ? (
          <div className="p-6 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex flex-col items-center justify-center gap-2 text-xs text-[#6B7280]">
            <div className="w-5 h-5 border-2 border-[#0B8A7E] border-t-transparent rounded-full animate-spin" />
            <span>Finding safe hospital route...</span>
          </div>
        ) : !patientLocation ? (
          <div className="p-4 rounded-xl bg-[#F9FAFB] border border-dashed border-[#D1D5DB] text-center text-xs text-[#6B7280]">
            <span className="material-symbols-outlined text-xl text-[#9CA3AF] mb-1">
              touch_app
            </span>
            <p>Click the map or select a preset location to evaluate transit.</p>
          </div>
        ) : (
          <DecisionCard
            routeData={routeData}
            scenario={selectedScenario}
            patientLocation={patientLocation}
            shareOverride={shareOverride}
          />
        )}
      </section>
    </aside>
  );
}
