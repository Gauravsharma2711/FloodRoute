'use client';

import { PresetLocation } from '../types/api';

interface PatientPickerProps {
  presets: PresetLocation[];
  selectedPresetId: string | null;
  onSelectPreset: (preset: PresetLocation) => void;
  onFindRoute?: () => void;
  isMobileFlow?: boolean;
  isLoadingRoute?: boolean;
}

export function PatientPicker({
  presets,
  selectedPresetId,
  onSelectPreset,
  onFindRoute,
  isMobileFlow = false,
  isLoadingRoute = false,
}: PatientPickerProps) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-1.5">
        <h2 className="text-[18px] font-bold text-[#111827] tracking-tight">
          2 · Patient location
        </h2>
        <span className="text-[12px] text-[#6B7280]">
          or click the map
        </span>
      </div>

      <p className="text-[13px] text-[#6B7280] mb-3">
        Select a known low-lying hotspot preset or tap any point in Mumbai:
      </p>

      {/* Preset Chips */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Patient location presets">
        {presets.map((preset) => {
          const isSelected = preset.id === selectedPresetId;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className={`h-9 px-3 rounded-xl text-[13px] font-medium transition-all duration-150 flex items-center gap-1.5 active:scale-95 ${
                isSelected
                  ? 'bg-[#0B8A7E] text-white shadow-sm font-semibold'
                  : 'bg-[#F6F8FA] text-[#374151] hover:bg-[#E5E7EB] border border-[#E5E7EB]'
              }`}
            >
              {isSelected && (
                <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check
                </span>
              )}
              <span>{preset.name}</span>
            </button>
          );
        })}
      </div>

      {isMobileFlow && onFindRoute && (
        <div className="mt-5">
          <button
            type="button"
            disabled={isLoadingRoute}
            onClick={onFindRoute}
            className="w-full h-14 rounded-2xl bg-[#0B8A7E] hover:bg-[#09756B] active:scale-[0.99] disabled:opacity-60 transition-all text-white text-[16px] font-semibold flex items-center justify-center gap-2 shadow-sm focus:outline-none"
          >
            {isLoadingRoute ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">
                  progress_activity
                </span>
                <span>Calculating safe corridor...</span>
              </>
            ) : (
              <>
                <span>Find safe route</span>
                <span className="material-symbols-outlined text-[20px]">directions</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
