'use client';

import Link from 'next/link';

interface HeaderProps {
  dataMode?: 'real' | 'fixture';
}

export function Header({ dataMode = 'fixture' }: HeaderProps) {
  return (
    <header className="w-full shrink-0 z-40 bg-white border-b border-[#E5E7EB]">
      {/* Top Banner Ribbon */}
      {dataMode === 'fixture' ? (
        <div
          role="status"
          aria-label="Synthetic UI fixture ribbon"
          className="w-full bg-[#FEF3C7] text-[#92400E] px-4 py-1.5 flex items-center justify-between text-xs font-medium border-b border-[#FDE68A]"
        >
          <div className="flex items-center gap-2 mx-auto">
            <span className="material-symbols-outlined text-[16px] text-[#D97706]">warning</span>
            <span className="font-semibold tracking-wide uppercase">
              SYNTHETIC UI FIXTURE — not real data
            </span>
          </div>
          <span className="hidden sm:inline-block text-[11px] opacity-75">Central Mumbai Study Area</span>
        </div>
      ) : (
        <div className="w-full bg-[#F0FDF4] text-[#166534] px-4 py-1 flex items-center justify-end text-xs font-medium border-b border-[#DCFCE7]">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
            Data: REAL
          </span>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#0B8A7E] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              water_drop
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[19px] font-bold text-[#111827] tracking-tight leading-none">
              FloodRoute
            </span>
            <span className="text-[11px] font-medium text-[#6B7280] leading-tight">
              Mumbai Ambulance Routing
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/reliable"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0B8A7E] hover:text-[#09756B] hover:underline transition-colors py-1 px-2 rounded-lg"
          >
            <span className="material-symbols-outlined text-[18px]">help_outline</span>
            <span>How reliable is this?</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
