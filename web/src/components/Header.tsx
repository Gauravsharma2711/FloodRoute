"use client";

import React from "react";
import { MetaResponse } from "../types/api";

interface HeaderProps {
  meta?: MetaResponse;
  onOpenReliability: () => void;
}

export function Header({ meta, onOpenReliability }: HeaderProps) {
  const isFixture = meta?.data_mode !== "real";

  return (
    <div className="w-full select-none z-30">
      {/* Top Banner Ribbon */}
      {isFixture ? (
        <div className="w-full bg-[#FEF3C7] border-b border-[#F59E0B]/30 text-[#92400E] px-4 py-1.5 flex items-center justify-between text-xs font-semibold tracking-wide">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D97706] animate-ping" />
            <span className="font-bold">SYNTHETIC UI FIXTURE — not real data</span>
          </div>
          <span className="text-[11px] opacity-90 hidden sm:inline">
            Connects to RealBackend via FLOODROUTE_BACKEND=real
          </span>
        </div>
      ) : (
        <div className="w-full bg-[#ECFDF5] border-b border-[#059669]/20 text-[#065F46] px-4 py-1 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#059669]" />
            <span>Data: REAL · Copernicus GLO-30 + Overpass OSM + Open-Meteo</span>
          </div>
          <span className="text-[11px] opacity-80 hidden sm:inline">Mumbai Study Area</span>
        </div>
      )}

      {/* Main Navbar */}
      <header className="w-full h-14 bg-white border-b border-[#E5E7EB] shadow-xs px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#0B8A7E] flex items-center justify-center text-white shadow-xs">
            <span className="material-symbols-outlined text-[19px]">emergency</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-[#111827] tracking-tight">FloodRoute</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#F3F4F6] text-[#4B5563]">
                Mumbai
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onOpenReliability}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#0B8A7E] hover:text-[#09756B] transition-colors py-1 px-2.5 rounded-lg hover:bg-[#F0FDF4]"
          >
            <span className="material-symbols-outlined text-[17px]">verified</span>
            <span>How reliable is this?</span>
          </button>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isFixture
                ? "bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/40"
                : "bg-[#CCFBF1] text-[#0F766E] border border-[#0F766E]/30"
            }`}
          >
            {isFixture ? "Fixture Mode" : "Real Data"}
          </span>
        </div>
      </header>
    </div>
  );
}
