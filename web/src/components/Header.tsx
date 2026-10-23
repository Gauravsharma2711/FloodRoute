"use client";

import React, { useEffect, useState } from "react";
import { MetaResponse } from "../types/api";

interface HeaderProps {
  meta?: MetaResponse;
  onOpenReliability: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export function Header({
  meta,
  onOpenReliability,
  isDarkMode = false,
  onToggleDarkMode,
}: HeaderProps) {
  const isFixture = meta?.data_mode !== "real";
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`w-full select-none z-30 transition-colors ${isDarkMode ? "bg-[#0F172A] text-white" : "bg-white text-[#111827]"}`}>
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
        <div className="w-full bg-[#ECFDF5] border-b border-[#059669]/20 text-[#065F46] px-4 py-1.5 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
            <span>Data: REAL · Copernicus GLO-30 + Overpass OSM + Open-Meteo</span>
          </div>
          <span className="text-[11px] opacity-80 hidden sm:inline">Mumbai Study Area</span>
        </div>
      )}

      {/* Main Navbar with subtle tactile texture */}
      <header className={`w-full h-14 backdrop-blur-md border-b px-4 sm:px-6 flex items-center justify-between relative overflow-hidden transition-colors ${
        isDarkMode
          ? "bg-[#0F172A]/95 border-[#1E293B] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]"
          : "bg-white/95 border-[#E5E7EB] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]"
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B8A7E] to-[#08635B] flex items-center justify-center text-white shadow-sm ring-1 ring-black/5">
            <span className="material-symbols-outlined text-[20px]">emergency</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-bold text-lg tracking-tight ${isDarkMode ? "text-white" : "text-[#111827]"}`}>
                FloodRoute
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                isDarkMode ? "bg-[#1E293B] text-[#94A3B8] border-[#334155]" : "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]"
              }`}>
                Mumbai
              </span>
            </div>
            <div className={`text-[10px] flex items-center gap-1 font-medium -mt-0.5 ${isDarkMode ? "text-[#94A3B8]" : "text-[#6B7280]"}`}>
              <span>Ambulance Flood Decision Support</span>
              <span className="text-[#64748B]">·</span>
              <span className="text-[#14B8A6] font-semibold">{timeStr ? `${timeStr} IST` : "IST"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Monsoon Watch indicator */}
          <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${
            isDarkMode ? "bg-[#1E293B] border-[#334155] text-[#94A3B8]" : "bg-[#F3F4F6] border-[#E5E7EB] text-[#4B5563]"
          }`}>
            <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
            <span>Monsoon Watch Active</span>
          </div>

          {/* Night / Console Mode Toggle */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Night / Console Mode"}
              aria-label="Toggle Night Console Mode"
              className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center ${
                isDarkMode
                  ? "bg-[#1E293B] border-[#334155] text-[#FBBF24] hover:bg-[#334155]"
                  : "bg-[#F3F4F6] border-[#E5E7EB] text-[#4B5563] hover:bg-[#E5E7EB]"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isDarkMode ? "light_mode" : "dark_mode"}
              </span>
            </button>
          )}

          <button
            onClick={onOpenReliability}
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-colors py-1 px-2.5 rounded-lg border ${
              isDarkMode
                ? "text-[#2DD4BF] hover:text-[#5EEAD4] border-transparent hover:border-[#2DD4BF]/20 hover:bg-[#134E4A]/30"
                : "text-[#0B8A7E] hover:text-[#09756B] border-transparent hover:border-[#0B8A7E]/20 hover:bg-[#F0FDF4]"
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">verified</span>
            <span className="hidden xs:inline">How reliable?</span>
          </button>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isFixture
                ? "bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/40 shadow-xs"
                : "bg-[#CCFBF1] text-[#0F766E] border border-[#0F766E]/30 shadow-xs"
            }`}
          >
            {isFixture ? "Fixture" : "Real"}
          </span>
        </div>
      </header>
    </div>
  );
}
