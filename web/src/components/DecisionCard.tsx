"use client";

import React, { useState } from "react";
import { RouteResponse, Scenario } from "../types/api";
import { driverMessage, smsUrl, whatsappUrl } from "../lib/dispatch";

interface DecisionCardProps {
  routeData?: RouteResponse | null;
  scenario?: Scenario;
  patientLocation?: { lat: number; lon: number } | null;
  shareOverride?: number | null;
  compact?: boolean;
}

// The routing result read as a decision: where to send, the cost, what to avoid, then hand it to the driver.
export function DecisionCard({ routeData, scenario, patientLocation, shareOverride, compact = false }: DecisionCardProps) {
  const [copied, setCopied] = useState(false);
  if (!routeData) return null;

  const { status, normal, safe, added_minutes, blocked_on_normal, note } = routeData;
  const avoid = (blocked_on_normal ?? []).map((b) => b.name).filter((n) => n !== "Unnamed road");

  if (status === "outside_area") {
    return (
      <div className="p-4 rounded-xl bg-[#F3F4F6] border border-[#D1D5DB] text-xs">
        <div className="flex items-center gap-1.5 text-[#374151] font-bold text-sm">
          <span className="material-symbols-outlined text-[#6B7280]">location_off</span>
          <span>Outside the study area</span>
        </div>
        <p className="text-[#4B5563] mt-1 text-[12px] leading-relaxed">{note}</p>
      </div>
    );
  }

  const message = patientLocation
    ? driverMessage({ route: routeData, scenario, patient: patientLocation, share: shareOverride })
    : "";

  const sendButtons = patientLocation && (
    <div className="pt-3 mt-3 border-t border-[#E5E7EB]">
      <div className="text-[11px] font-semibold text-[#6B7280] mb-1.5">Send to driver</div>
      <div className="grid gap-1.5 min-w-0" style={{ gridTemplateColumns: "1.35fr 1fr 1fr" }}>
        <a
          href={whatsappUrl(message)}
          target="_blank"
          rel="noopener noreferrer"
          className="h-10 min-w-0 px-1 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-[12px] font-semibold flex items-center justify-center gap-1 whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[15px]">chat</span>WhatsApp
        </a>
        <a
          href={smsUrl(message)}
          className="h-10 min-w-0 px-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[12px] font-semibold flex items-center justify-center gap-1 whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[15px]">sms</span>SMS
        </a>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(message).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
          className="h-10 min-w-0 px-1 rounded-lg bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] text-[12px] font-semibold flex items-center justify-center gap-1 whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[15px]">{copied ? "check" : "content_copy"}</span>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );

  if (status === "cut_off") {
    return (
      <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#EF4444]/40 text-xs">
        <div className="flex items-center gap-2 text-[#DC2626] font-bold text-sm">
          <span className="material-symbols-outlined">crisis_alert</span>
          <span>No flood-safe route</span>
        </div>
        <p className="text-[#7F1D1D] mt-1 text-[12px] leading-relaxed font-medium">
          Every main road out of this area is likely to flood in this scenario. Send a different resource or hold and
          coordinate with control.
        </p>
        {routeData.nearest_hospital_straight_line && (
          <p className="mt-2 text-[12px] text-[#111827]">
            Nearest major hospital: <b>{routeData.nearest_hospital_straight_line.name}</b>,{" "}
            {routeData.nearest_hospital_straight_line.distance_km} km in a straight line
          </p>
        )}
        {avoid.length > 0 && (
          <p className="mt-1.5 text-[11px] text-[#991B1B]">Likely to flood on the normal route: {avoid.slice(0, 3).join(", ")}</p>
        )}
        {sendButtons}
      </div>
    );
  }

  const changedHospital = status === "ok" && normal && safe && normal.hospital !== safe.hospital;

  return (
    <div className={`rounded-xl bg-white border border-[#E5E7EB] shadow-xs text-xs ${compact ? "p-3" : "p-4"}`}>
      {/* Line 1: where to send */}
      <div className="text-[11px] font-semibold text-[#6B7280]">Send the ambulance to</div>
      <div className="mt-0.5 flex items-start gap-1.5 text-[#0B8A7E]">
        <span className="material-symbols-outlined text-[20px] shrink-0">local_hospital</span>
        <span className="text-[17px] font-extrabold leading-tight">{safe?.hospital ?? normal?.hospital}</span>
      </div>

      {/* Line 2: the cost */}
      <div className="mt-2 flex items-baseline gap-2 whitespace-nowrap">
        <span className="text-2xl font-black text-[#111827] tabular-nums">{Math.round((safe ?? normal)!.minutes)} min</span>
        <span className="text-[12px] text-[#6B7280]">· {(safe ?? normal)!.km} km</span>
      </div>
      <div className="mt-1.5">
        {status === "ok" ? (
          <span className="inline-block px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] font-bold border border-[#F59E0B]/30">
            +{(added_minutes ?? 0).toFixed(1)} min vs normal
          </span>
        ) : (
          <span className="inline-block px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534] font-bold border border-[#22C55E]/30">
            Normal route not affected
          </span>
        )}
      </div>
      {changedHospital && (
        <p className="mt-1.5 text-[12px] text-[#92400E]">
          Normal choice <b>{normal!.hospital}</b> ({Math.round(normal!.minutes)} min) — its approach is likely to flood.
        </p>
      )}

      {/* Line 3: what to avoid */}
      {avoid.length > 0 && (
        <div className="mt-2 flex items-start gap-1.5 text-[12px] text-[#DC2626] font-medium bg-[#FEF2F2] p-2 rounded-lg border border-[#FCA5A5]/30">
          <span className="material-symbols-outlined text-[15px] shrink-0 mt-0.5">warning</span>
          <span>
            <b>Avoid:</b> {avoid.slice(0, 3).join(", ")}
          </span>
        </div>
      )}
      <p className="mt-2 text-[10px] text-[#9CA3AF]">Free-flow estimate from speed limits, no traffic. Main roads only.</p>
      {sendButtons}
    </div>
  );
}
