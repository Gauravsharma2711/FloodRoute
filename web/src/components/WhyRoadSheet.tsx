'use client';

import Link from 'next/link';
import { FlaggedRoadProperties } from '../types/api';

interface WhyRoadSheetProps {
  road: FlaggedRoadProperties | null;
  onClose: () => void;
  isDesktopCard?: boolean;
}

export function WhyRoadSheet({
  road,
  onClose,
  isDesktopCard = false,
}: WhyRoadSheetProps) {
  if (!road) return null;

  const relElev = Math.abs(road.rel_elev_m).toFixed(1);
  const creekDist = Math.round(road.water_dist_m);
  const isUnderpass = road.is_underpass;

  const content = (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
        <div className="flex flex-col">
          <span className="text-[12px] font-bold uppercase tracking-wider text-[#DC2626]">
            Risk Explanation
          </span>
          <h2 className="text-[18px] font-bold text-[#111827] mt-0.5">
            Why is this road marked?
          </h2>
          <div className="flex items-center gap-1.5 mt-1 text-[#0B8A7E]">
            <span className="material-symbols-outlined text-[18px]">location_on</span>
            <span className="text-[15px] font-semibold">{road.name}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close why marked panel"
          className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center text-[#4B5563] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Evidence Points */}
      <div className="flex flex-col gap-2.5 my-4">
        {/* Line 1: Elevation depression */}
        <div className="flex items-center gap-3 p-3 bg-[#F6F8FA] rounded-xl border border-[#E5E7EB]">
          <div className="w-9 h-9 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">trending_down</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-[#111827]">
              {relElev} m lower than the area around it
            </p>
            <span className="text-[11px] text-[#6B7280]">
              Relative to 300 m local terrain radius
            </span>
          </div>
        </div>

        {/* Line 2: Near water */}
        <div className="flex items-center gap-3 p-3 bg-[#F6F8FA] rounded-xl border border-[#E5E7EB]">
          <div className="w-9 h-9 rounded-full bg-[#E0E7FF] text-[#4F46E5] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">waves</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-[#111827]">
              {creekDist} m from a creek or drainage canal
            </p>
            <span className="text-[11px] text-[#6B7280]">
              Proximity to major open natural drainage channel
            </span>
          </div>
        </div>

        {/* Line 3: Structure / Underpass */}
        {isUnderpass && (
          <div className="flex items-center gap-3 p-3 bg-[#F6F8FA] rounded-xl border border-[#E5E7EB]">
            <div className="w-9 h-9 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">directions_subway</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-[#111827]">
                Underpass / Subway Depression
              </p>
              <span className="text-[11px] text-[#6B7280]">
                Vulnerable low point beneath rail or flyover
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Honest Disclaimer */}
      <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] flex items-start gap-2 text-[13px] text-[#6B7280] italic">
        <span className="material-symbols-outlined text-[16px] text-[#9CA3AF] shrink-0 mt-0.5">
          info
        </span>
        <p>This is an estimate based on terrain, not a live flood report.</p>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-col items-center gap-2.5">
        <Link
          href="/reliable"
          className="text-[14px] font-semibold text-[#0B8A7E] hover:underline flex items-center gap-1"
        >
          <span>How reliable is this?</span>
          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
        </Link>

        <button
          type="button"
          onClick={onClose}
          className="w-full h-12 rounded-xl bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] font-semibold text-[14px] transition-colors"
        >
          Return to Route
        </button>
      </div>
    </div>
  );

  if (isDesktopCard) {
    return (
      <div className="w-full bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-md mt-4">
        {content}
      </div>
    );
  }

  // Mobile Bottom Sheet modal
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs transition-opacity p-0">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-5 border-t border-[#E5E7EB] animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-[#D1D5DB] rounded-full mx-auto mb-3"></div>
        {content}
      </div>
    </div>
  );
}
