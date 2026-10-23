'use client';

export function Footer() {
  return (
    <footer className="w-full py-3 px-4 bg-white border-t border-[#E5E7EB] text-center text-[12px] text-[#6B7280] leading-relaxed select-none">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>
          Map data © <span className="font-medium text-[#4B5563]">OpenStreetMap</span> contributors · Elevation: <span className="font-medium text-[#4B5563]">Copernicus</span> · Rain: <span className="font-medium text-[#4B5563]">Open-Meteo</span> · Categories: <span className="font-medium text-[#4B5563]">IMD</span>
        </p>
        <p className="font-medium text-[#374151]">
          Prototype for decision support — not an official warning system.
        </p>
      </div>
    </footer>
  );
}
