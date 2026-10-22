"use client";

import React, { useState } from "react";
import {
  Scenario,
  PresetLocation,
  RouteResponse,
  RouteStatus,
} from "../types/api";

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

  const selectedScenario =
    scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  const currentFlagShare =
    shareOverride !== null ? shareOverride : selectedScenario?.flag_share ?? 0.15;

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

  return (
    <aside className="w-[360px] shrink-0 h-full bg-white border-r border-[#E5E7EB] shadow-xs flex flex-col justify-between p-5 overflow-y-auto select-none z-20">
      <div className="flex flex-col gap-6">
        {/* STEP 1: Rain Day */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="font-bold text-base text-[#111827] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#0B8A7E] text-white text-xs flex items-center justify-center font-bold">
                1
              </span>
              Rain day
            </h2>
            <span className="text-xs text-[#6B7280]">Real Open-Meteo days</span>
          </div>

          <div className="flex flex-col gap-2">
            {scenarios.map((sc) => {
              const isSelected = sc.id === selectedScenarioId;
              return (
                <button
                  key={sc.id}
                  onClick={() => onSelectScenario(sc.id)}
                  type="button"
                  className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                    isSelected
                      ? "bg-[#F0FDF4] border-[#0B8A7E] ring-1 ring-[#0B8A7E] shadow-xs"
                      : "bg-[#F9FAFB] border-[#E5E7EB] hover:bg-[#F3F4F6]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#111827] text-sm">
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
                    <span>{sc.rain_mm} mm / day</span>
                    <span className="text-[11px] opacity-80">
                      {sc.source || "Historical Replay"}
                    </span>
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
                className="text-[#0B8A7E] font-semibold hover:underline"
              >
                {showWhatIf ? "Hide" : "What if?"}
              </button>
            </div>

            {showWhatIf && (
              <div className="mt-2.5 p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs">
                <div className="flex justify-between font-semibold mb-1">
                  <span>Simulate Flag Share</span>
                  <span className="text-[#0B8A7E]">
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
              <span className="w-5 h-5 rounded-full bg-[#0B8A7E] text-white text-xs flex items-center justify-center font-bold">
                2
              </span>
              Patient location
            </h2>
            <span className="text-xs text-[#6B7280]">or click the map</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {presets.map((p) => {
              const isSelected = selectedPresetId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectPreset(p)}
                  type="button"
                  className={`h-9 px-3 rounded-xl text-xs font-semibold truncate transition-all text-left flex items-center justify-between border ${
                    isSelected
                      ? "bg-[#0B8A7E] text-white border-[#0B8A7E] shadow-xs"
                      : "bg-[#F9FAFB] text-[#374151] border-[#E5E7EB] hover:bg-[#F3F4F6]"
                  }`}
                  title={p.description || p.name}
                >
                  <span className="truncate">{p.name.split("/")[0]}</span>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[14px]">
                      check
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {patientLocation && (
            <div className="mt-2 text-[11px] text-[#6B7280] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              <span>
                Coordinates: {patientLocation.lat.toFixed(4)},{" "}
                {patientLocation.lon.toFixed(4)}
              </span>
            </div>
          )}
        </section>
      </div>

      {/* STEP 3: Result Card */}
      <section className="pt-4 border-t border-[#E5E7EB] mt-4">
        <h2 className="font-bold text-base text-[#111827] flex items-center gap-2 mb-2">
          <span className="w-5 h-5 rounded-full bg-[#0B8A7E] text-white text-xs flex items-center justify-center font-bold">
            3
          </span>
          Routing result
        </h2>

        {isRoutingLoading ? (
          <div className="p-5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex flex-col items-center justify-center py-8 text-center text-xs text-[#6B7280]">
            <span className="material-symbols-outlined text-2xl animate-spin text-[#0B8A7E] mb-2">
              sync
            </span>
            <span>Calculating safe ambulance route…</span>
          </div>
        ) : !patientLocation ? (
          <div className="p-4 rounded-xl bg-[#F9FAFB] border border-dashed border-[#D1D5DB] text-center text-xs text-[#6B7280]">
            <span className="material-symbols-outlined text-xl text-[#9CA3AF] mb-1">
              touch_app
            </span>
            <p>Click the map or select a preset location to evaluate transit.</p>
          </div>
        ) : (
          <ResultCard routeData={routeData} />
        )}
      </section>
    </aside>
  );
}

function ResultCard({ routeData }: { routeData?: RouteResponse | null }) {
  if (!routeData) return null;

  const { status, normal, safe, added_minutes, blocked_on_normal, note } =
    routeData;

  if (status === "outside_area") {
    return (
      <div className="p-4 rounded-xl bg-[#F3F4F6] border border-[#D1D5DB] text-xs">
        <div className="flex items-center gap-1.5 text-[#374151] font-bold text-sm">
          <span className="material-symbols-outlined text-[#6B7280]">
            location_off
          </span>
          <span>Outside Study Area</span>
        </div>
        <p className="text-[#4B5563] mt-1 text-[11px] leading-relaxed">
          {note || "Please tap within the Mumbai metropolitan boundary."}
        </p>
      </div>
    );
  }

  if (status === "cut_off") {
    return (
      <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#EF4444]/40 text-xs shadow-xs">
        <div className="flex items-center gap-2 text-[#DC2626] font-bold text-sm">
          <span className="material-symbols-outlined text-[#DC2626]">
            crisis_alert
          </span>
          <span>Area Cut Off</span>
        </div>
        <div className="text-xl font-black text-[#991B1B] mt-1 tracking-tight">
          No Flood-Safe Route
        </div>
        <p className="text-[#7F1D1D] mt-1 text-xs leading-relaxed font-medium">
          {note}
        </p>
        {blocked_on_normal && blocked_on_normal.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-[#FCA5A5]/40 text-[11px] text-[#991B1B]">
            <span className="font-semibold">Submerged corridors:</span>
            <ul className="list-disc list-inside mt-0.5 opacity-90">
              {blocked_on_normal.slice(0, 2).map((b, i) => (
                <li key={i} className="truncate">
                  {b.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (status === "no_change") {
    return (
      <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#22C55E]/40 text-xs shadow-xs">
        <div className="flex items-center gap-2 text-[#16A34A] font-bold text-sm">
          <span className="material-symbols-outlined text-[#16A34A]">
            check_circle
          </span>
          <span>Route Unaffected</span>
        </div>
        <div className="text-xl font-black text-[#166534] mt-1">
          {normal?.minutes.toFixed(0)} min
        </div>
        <div className="text-xs text-[#15803D] font-semibold mt-0.5">
          Direct to {normal?.hospital}
        </div>
        <p className="text-[#166534] mt-1.5 text-[11px] leading-relaxed">
          {note}
        </p>
      </div>
    );
  }

  // Status: OK (with added delay)
  return (
    <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] shadow-xs text-xs">
      <div className="flex items-baseline justify-between">
        <div className="text-3xl font-black text-[#111827] tracking-tight">
          +{added_minutes?.toFixed(0) || "14"} min
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#92400E] font-bold">
          Detour Required
        </span>
      </div>

      <div className="font-bold text-sm text-[#0B8A7E] mt-1 flex items-center gap-1.5">
        <span className="material-symbols-outlined text-base">local_hospital</span>
        <span>Send to {safe?.hospital || "Hospital Y"}</span>
      </div>

      <div className="mt-2 space-y-1 text-[11px] bg-white p-2.5 rounded-lg border border-[#E5E7EB]">
        <div className="flex justify-between text-[#6B7280]">
          <span>Normal direct route:</span>
          <span className="font-medium text-[#111827]">
            {normal?.minutes.toFixed(0)} min ({normal?.km.toFixed(1)} km)
          </span>
        </div>
        <div className="flex justify-between text-[#065F46] font-semibold">
          <span>Flood-safe route:</span>
          <span>
            {safe?.minutes.toFixed(0)} min ({safe?.km.toFixed(1)} km)
          </span>
        </div>
      </div>

      {blocked_on_normal && blocked_on_normal.length > 0 && (
        <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-[#DC2626] font-medium bg-[#FEF2F2] p-2 rounded-lg border border-[#FCA5A5]/30">
          <span className="material-symbols-outlined text-[15px] shrink-0 mt-0.5">
            warning
          </span>
          <div className="truncate">
            <span className="font-bold">Avoid: </span>
            <span>{blocked_on_normal.map((b) => b.name).join(", ")}</span>
          </div>
        </div>
      )}

      {note && (
        <p className="mt-2 text-[11px] text-[#4B5563] leading-relaxed italic border-t border-[#F3F4F6] pt-1.5">
          {note}
        </p>
      )}
    </div>
  );
}
