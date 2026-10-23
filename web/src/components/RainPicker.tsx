'use client';

import { useState } from 'react';
import { Scenario, IMDCategory } from '../types/api';

interface RainPickerProps {
  scenarios: Scenario[];
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
  shareOverride: number | null;
  onShareChange: (share: number | null) => void;
  onNext?: () => void;
  isMobileFlow?: boolean;
}

const CATEGORY_COLORS: Record<IMDCategory, { badge: string; text: string }> = {
  light: { badge: 'bg-blue-100 text-blue-800', text: 'Light' },
  moderate: { badge: 'bg-emerald-100 text-emerald-800', text: 'Moderate' },
  heavy: { badge: 'bg-amber-100 text-amber-800', text: 'Heavy' },
  very_heavy: { badge: 'bg-orange-100 text-orange-800', text: 'Very heavy' },
  extremely_heavy: { badge: 'bg-red-100 text-red-800', text: 'Extremely heavy' },
};

export function RainPicker({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  shareOverride,
  onShareChange,
  onNext,
  isMobileFlow = false,
}: RainPickerProps) {
  const [showWhatIf, setShowWhatIf] = useState(false);

  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];
  const effectiveShare = shareOverride ?? (selectedScenario ? selectedScenario.flag_share : 0.08);
  const sharePct = Math.round(effectiveShare * 100);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[18px] font-bold text-[#111827] tracking-tight">
          1 · Rain day
        </h2>
        {selectedScenario && (
          <span className="text-[12px] font-semibold text-[#0B8A7E] bg-[#F4FFFC] px-2.5 py-0.5 rounded-full border border-[#D1FAE5]">
            ~{selectedScenario.rain_mm} mm
          </span>
        )}
      </div>

      <p className="text-[13px] text-[#6B7280] mb-3.5">
        Choose a forecast or historical monsoon burst to simulate likely-to-flood roads.
      </p>

      {/* Scenario Selection Cards */}
      <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Rain intensity scenarios">
        {scenarios.slice(0, 3).map((scenario) => {
          const isSelected = scenario.id === selectedScenarioId;
          const cat = CATEGORY_COLORS[scenario.imd_category] || CATEGORY_COLORS.heavy;

          return (
            <div
              key={scenario.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => onSelectScenario(scenario.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectScenario(scenario.id);
                }
              }}
              className={`relative cursor-pointer rounded-xl p-3.5 transition-all duration-150 text-left select-none ${
                isSelected
                  ? 'border-2 border-[#0B8A7E] bg-[#F4FFFC] shadow-sm'
                  : 'border border-[#E5E7EB] bg-[#F6F8FA] hover:bg-[#F0F3F6]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-medium text-[#4B5563]">
                      {scenario.date}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cat.badge}`}>
                      {cat.text}
                    </span>
                  </div>
                  <div className="text-[15px] font-bold text-[#111827] flex items-baseline gap-2">
                    {scenario.label.split('·')[0].trim()}
                    <span className="text-[13px] font-semibold text-[#0B8A7E]">
                      {scenario.rain_mm} mm
                    </span>
                  </div>
                  {scenario.description && (
                    <p className="text-[12px] text-[#6B7280] mt-1 line-clamp-1">
                      {scenario.description}
                    </p>
                  )}
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isSelected
                      ? 'bg-[#0B8A7E] text-white shadow-sm'
                      : 'border-2 border-[#D1D5DB] bg-white'
                  }`}
                >
                  {isSelected && (
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assumption Line */}
      <div className="mt-3.5 px-1 flex flex-col gap-1 text-[13px] text-[#6B7280]">
        <div className="flex items-start gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-[#0B8A7E] shrink-0 mt-0.5">
            info
          </span>
          <p className="leading-snug">
            Flagging the top <span className="font-semibold text-[#111827]">{sharePct}%</span> most flood-prone roads <span className="italic">(assumption)</span>.
          </p>
        </div>

        {/* What if expander */}
        <div className="mt-1">
          <button
            type="button"
            onClick={() => setShowWhatIf(!showWhatIf)}
            className="text-[12px] font-semibold text-[#0B8A7E] hover:underline flex items-center gap-1 focus:outline-none"
          >
            <span>{showWhatIf ? 'Hide "What if?" slider' : 'Adjust "What if?" road share'}</span>
            <span className="material-symbols-outlined text-[16px]">
              {showWhatIf ? 'expand_less' : 'tune'}
            </span>
          </button>

          {showWhatIf && (
            <div className="mt-2 p-3 bg-[#F6F8FA] border border-[#E5E7EB] rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between text-[12px] font-medium text-[#374151]">
                <span>Road share to avoid:</span>
                <span className="font-bold text-[#0B8A7E]">{sharePct}%</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.35"
                step="0.01"
                value={effectiveShare}
                onChange={(e) => onShareChange(parseFloat(e.target.value))}
                className="w-full accent-[#0B8A7E] cursor-pointer h-2 bg-[#E5E7EB] rounded-lg"
              />
              <div className="flex items-center justify-between text-[10px] text-[#9CA3AF]">
                <span>1% (mild)</span>
                <button
                  type="button"
                  onClick={() => onShareChange(null)}
                  className="text-[11px] text-[#0B8A7E] underline"
                >
                  Reset default
                </button>
                <span>35% (severe)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Flow Next Action Button */}
      {isMobileFlow && onNext && (
        <div className="mt-6 pt-2">
          <button
            type="button"
            onClick={onNext}
            className="w-full h-14 rounded-2xl bg-[#0B8A7E] hover:bg-[#09756B] active:scale-[0.99] transition-all text-white text-[16px] font-semibold flex items-center justify-center gap-2 shadow-sm focus:outline-none"
          >
            <span>Set patient location</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
      )}
    </div>
  );
}
