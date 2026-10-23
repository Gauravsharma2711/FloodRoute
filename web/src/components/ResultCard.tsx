'use client';

import { RouteResponse } from '../types/api';

interface ResultCardProps {
  route: RouteResponse | null;
  isLoading: boolean;
  onShowWhy?: () => void;
  onResetLocation: () => void;
  isMobileSheet?: boolean;
}

export function ResultCard({
  route,
  isLoading,
  onShowWhy,
  onResetLocation,
  isMobileSheet = false,
}: ResultCardProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="w-10 h-10 border-3 border-[#0B8A7E] border-t-transparent rounded-full animate-spin mb-3"></div>
        <div className="text-[15px] font-semibold text-[#111827]">
          Finding flood-safe route...
        </div>
        <p className="text-[13px] text-[#6B7280] mt-1">
          Evaluating terrain depression scores and avoiding likely-to-flood roads.
        </p>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="p-4 bg-[#F6F8FA] rounded-xl border border-[#E5E7EB] text-center text-[14px] text-[#6B7280]">
        Place a patient on the map or pick a preset above to calculate routing.
      </div>
    );
  }

  // 1. OUTSIDE STUDY AREA STATE
  if (route.status === 'outside_area') {
    return (
      <div className="flex flex-col gap-3">
        <div className="p-4 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB] flex items-start gap-3">
          <span className="material-symbols-outlined text-[22px] text-[#6B7280] shrink-0 mt-0.5">
            location_off
          </span>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold text-[#1F2937]">
              Outside study area
            </span>
            <span className="text-[13px] text-[#4B5563] mt-0.5">
              {route.note || 'Click inside the highlighted study area (Mumbai Island & Suburbs).'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onResetLocation}
          className="w-full h-12 rounded-xl bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#374151] font-semibold text-[14px] flex items-center justify-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">my_location</span>
          <span>Pick preset inside Mumbai</span>
        </button>
      </div>
    );
  }

  // 2. CUT OFF STATE
  if (route.status === 'cut_off') {
    const hosp = route.nearest_hospital_straight_line?.name || 'Nearest Hospital';
    const dist = route.nearest_hospital_straight_line?.distance_km ?? 2.1;

    return (
      <div className="flex flex-col gap-3.5">
        {/* Soft Red Banner */}
        <div className="p-4 rounded-2xl bg-[#FEE2E2] border border-[#FECACA] flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F87171] text-white flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              wrong_location
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold text-[#991B1B] leading-snug">
              No flood-safe route. This area is cut off.
            </span>
            <span className="text-[13px] text-[#B91C1C] mt-0.5">
              All connecting arterial roads are likely to flood in this scenario.
            </span>
          </div>
        </div>

        {/* Straight line distance info */}
        <div className="p-3.5 rounded-xl bg-[#F6F8FA] border border-[#E5E7EB] flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-[#111827]">
            <span className="material-symbols-outlined text-[18px] text-[#0B8A7E]">near_me</span>
            <span>Nearest: {hosp}, {dist} km straight line</span>
          </div>
          <p className="text-[12px] text-[#6B7280] pl-6">
            Pre-position municipal high-clearance emergency assets or water rescue.
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onResetLocation}
          className="w-full h-13 rounded-xl bg-[#0B8A7E] hover:bg-[#09756B] active:scale-[0.99] transition-all text-white font-semibold text-[15px] flex items-center justify-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">map</span>
          <span>Choose another location</span>
        </button>
      </div>
    );
  }

  // 3. NO CHANGE STATE
  if (route.status === 'no_change') {
    const hosp = route.safe?.hospital || route.normal?.hospital || 'Hospital X';
    const minutes = route.safe?.minutes ?? route.normal?.minutes ?? 18;
    const km = route.safe?.km ?? route.normal?.km ?? 5.4;

    return (
      <div className="flex flex-col gap-3.5">
        {/* Soft Green Banner */}
        <div className="p-4 rounded-2xl bg-[#DCFCE7] border border-[#BBF7D0] flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#22C55E] text-white flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              check
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold text-[#166534] leading-snug">
              Your normal route is not affected.
            </span>
            <span className="text-[13px] text-[#15803D] mt-0.5">
              Normal road corridor remains clear of flagged flood-prone depressions.
            </span>
          </div>
        </div>

        {/* Route Details */}
        <div className="p-3.5 rounded-xl bg-[#F6F8FA] border border-[#E5E7EB] flex flex-col gap-1">
          <div className="text-[18px] font-bold text-[#111827]">
            {hosp} · {minutes} min
          </div>
          <div className="text-[13px] text-[#6B7280]">
            Distance: {km} km · Safe route is identical to normal route.
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onResetLocation}
          className="w-full h-13 rounded-xl bg-[#0B8A7E] hover:bg-[#09756B] active:scale-[0.99] transition-all text-white font-semibold text-[15px] flex items-center justify-center gap-2 shadow-sm"
        >
          <span>Done</span>
          <span className="material-symbols-outlined text-[18px]">check</span>
        </button>
      </div>
    );
  }

  // 4. OK STATE (Safe Detour Found)
  const addedMin = route.added_minutes ?? 14;
  const safeHosp = route.safe?.hospital || 'Hospital Y';
  const normalMin = route.normal?.minutes ?? 18;
  const safeMin = route.safe?.minutes ?? 32;
  const blockedRoad = route.blocked_on_normal?.[0]?.name || 'Hindmata Junction';

  return (
    <div className="flex flex-col">
      {/* Headline KPI: +14 min (56px) */}
      <div className="flex items-baseline justify-between mb-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[52px] sm:text-[56px] leading-none font-extrabold tracking-tight text-[#111827]">
            +{addedMin} min
          </span>
          <span className="text-[12px] font-bold text-[#DC2626] bg-[#FEE2E2] px-2.5 py-0.5 rounded-full border border-[#FECACA]">
            Flood Bypass
          </span>
        </div>
      </div>

      {/* Main Prescription Directive */}
      <h3 className="text-[20px] font-bold text-[#111827] mt-1 tracking-tight">
        Go to {safeHosp}
      </h3>

      {/* Comparative Breakdown */}
      <p className="text-[14px] text-[#6B7280] mt-1 font-medium">
        Normal route {normalMin} min · Safe route {safeMin} min
      </p>

      {/* Avoid Warning Card */}
      <div className="mt-3.5 p-3 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2] flex items-start gap-2.5">
        <div className="w-6 h-6 rounded-full bg-[#EF4444] text-white flex items-center justify-center shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            priority_high
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[14px] font-bold text-[#991B1B]">
            Avoid: {blockedRoad}
          </span>
          <span className="text-[12px] text-[#B91C1C] mt-0.5 leading-snug">
            High water-accumulation risk at natural depression bowl.
          </span>
        </div>
      </div>

      {/* Next Step / Directives Note */}
      {route.note && (
        <div className="mt-2.5 text-[12px] text-[#4B5563] italic flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-[#0B8A7E]">info</span>
          <span>{route.note}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 flex flex-col gap-2">
        {onShowWhy && (
          <button
            type="button"
            onClick={onShowWhy}
            className="w-full h-13 rounded-xl bg-[#0B8A7E] hover:bg-[#09756B] active:scale-[0.99] transition-all text-white font-semibold text-[15px] flex items-center justify-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">info</span>
            <span>Why these roads?</span>
          </button>
        )}

        <button
          type="button"
          onClick={onResetLocation}
          className="w-full py-2 text-[14px] font-medium text-[#6B7280] hover:text-[#111827] transition-colors flex items-center justify-center gap-1"
        >
          <span>Choose another location</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
