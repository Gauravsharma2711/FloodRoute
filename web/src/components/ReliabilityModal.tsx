"use client";

import React, { useState } from "react";
import { ValidationResponse, EDAResponse } from "../types/api";

interface ReliabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  validationData?: ValidationResponse | null;
  edaData?: EDAResponse | null;
  dataMode?: "real" | "fixture";
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

// AUC shown on a 0..1 bar with the 0.5 "random" line
function AucBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-semibold text-[#111827]">{label}</span>
        <span className="font-bold tabular-nums" style={{ color }}>{value.toFixed(2)}</span>
      </div>
      <div className="relative h-3 rounded-full bg-[#E5E7EB]">
        <div className="h-3 rounded-full" style={{ width: `${value * 100}%`, background: color }} />
        <div className="absolute top-[-3px] h-[18px] w-[2px] bg-[#111827]" style={{ left: "50%" }} title="0.5 = random" />
      </div>
    </div>
  );
}

export function ReliabilityModal({
  isOpen,
  onClose,
  validationData,
  edaData,
  dataMode = "fixture",
}: ReliabilityModalProps) {
  const [activeTab, setActiveTab] = useState<"proof" | "limits">("proof");

  if (!isOpen) return null;

  const v = validationData;
  const isFixture = dataMode === "fixture" || v?.data_mode === "fixture";
  const hasNumbers = !isFixture && v?.auc_score !== undefined && v?.auc_elev_only !== undefined;
  const top15 = v?.curves?.find((c) => Math.abs(c.flag_share - 0.15) < 1e-9);
  const spots = (v?.spots ?? []).filter((s) => s.snapped && s.rank_pct !== null);

  const tabBtn = (id: "proof" | "limits", icon: string, text: string) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
        activeTab === id ? "border-[#0B8A7E] text-[#0B8A7E]" : "border-transparent text-[#6B7280] hover:text-[#111827]"
      }`}
    >
      <span className="material-symbols-outlined text-base">{icon}</span>
      <span>{text}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0B8A7E]/10 text-[#0B8A7E] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-[#111827]">How reliable is this?</h3>
              <p className="text-xs text-[#6B7280]">Our score checked against places where waterlogging was reported</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB] flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex border-b border-[#E5E7EB] px-6 gap-6 text-xs font-semibold">
          {tabBtn("proof", "analytics", "Evidence")}
          {tabBtn("limits", "warning", "Limits & assumptions")}
        </div>

        <div className="p-6 overflow-y-auto flex-1 text-xs text-[#374151] space-y-4">
          {activeTab === "proof" && (
            <div className="space-y-5">
              {!hasNumbers ? (
                <div className="p-4 rounded-xl bg-[#FEF3C7] border border-[#F59E0B]/40 text-[#92400E]">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <span className="material-symbols-outlined text-base">info</span>
                    <span>Validation numbers: n/a in fixture mode</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed">
                    Real numbers appear only when the app runs on the real pipeline outputs.
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-3">
                    <p className="text-[13px] text-[#111827] leading-relaxed">
                      We matched <b>{v!.n_spots}</b> reported waterlogging spots (of {v!.n_spots_total}) to a road within{" "}
                      {v!.snap_m} m and asked: does our score rank these roads above the rest?
                    </p>
                    <AucBar label="Our score" value={v!.auc_score!} color="#0B8A7E" />
                    <AucBar label="Elevation only (baseline)" value={v!.auc_elev_only!} color="#6B7280" />
                    <p className="text-[11px] text-[#6B7280]">
                      AUC: 1.0 = every reported spot ranked above every other road · black line 0.5 = random guess.
                      {v!.ci && <> 95% interval for our score: {v!.ci.low.toFixed(2)}–{v!.ci.high.toFixed(2)}.</>}
                    </p>
                    {top15 && (
                      <p className="text-[13px] text-[#111827]">
                        On a very heavy day we flag the top 15% of roads: that catches <b>{top15.caught} of {top15.n}</b> spots
                        (random would catch about {(0.15 * (top15.n ?? 0)).toFixed(1)}).
                      </p>
                    )}
                    <p className="text-[13px] font-semibold text-[#991B1B]">
                      Verdict: on this small sample, terrain alone is not better than random overall. Read the spot list below
                      to see where it works and where it fails.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-[#111827] mb-2">Spot by spot (rank among all roads)</h4>
                    <div className="space-y-1">
                      {spots.map((s) => {
                        const caught = (s.rank_pct ?? 0) >= 0.5;
                        return (
                          <div key={s.name} className="flex items-center gap-2 p-2 rounded-lg border border-[#E5E7EB]">
                            <span className={`w-2 h-2 rounded-full ${caught ? "bg-[#0B8A7E]" : "bg-[#DC2626]"}`} />
                            <span className="flex-1 font-medium text-[#111827]">{s.name}</span>
                            <span className="text-[#6B7280]">
                              {s.rel_elev_m < 0 ? `${Math.abs(s.rel_elev_m).toFixed(1)} m below surroundings` : `${s.rel_elev_m.toFixed(1)} m above surroundings`}
                              {s.is_underpass ? " · underpass" : ""}
                            </span>
                            <span className="w-12 text-right font-bold tabular-nums">{pct(s.rank_pct ?? 0)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[11px] text-[#6B7280]">
                      Misses such as Milan Subway and Gandhi Market read as <i>higher</i> than their surroundings: the 30 m
                      elevation model is a surface model that sees rail embankments and flyovers, not the road beneath.
                    </p>
                  </div>

                  {v!.sensitivity?.auc_by_variant && (
                    <div>
                      <h4 className="font-bold text-sm text-[#111827] mb-2">Sensitivity: each signal on its own</h4>
                      <div className="grid grid-cols-2 gap-1.5">
                        {v!.sensitivity.auc_by_variant
                          .filter((x) => x.variant.endsWith(" only") || x.variant === "configured weights")
                          .map((x) => (
                            <div key={x.variant} className="flex justify-between p-2 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                              <span>{x.variant.replace(/_/g, " ")}</span>
                              <span className="font-bold tabular-nums">{x.auc.toFixed(2)}</span>
                            </div>
                          ))}
                      </div>
                      <p className="mt-2 text-[11px] text-[#6B7280]">
                        Weights were fixed before this test and were not changed after it. {v!.notes}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* EDA findings: computed by the pipeline (eda_summary.json) */}
              {!isFixture && edaData?.findings && edaData.findings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-[#111827]">What the data told us</h4>
                  {edaData.findings.map((f, i) => (
                    <div key={f.id} className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                      <div className="font-bold text-[#111827] text-xs">
                        {i + 1} · {f.title}
                      </div>
                      <p className="text-[#6B7280] text-[11px] mt-0.5 leading-relaxed">{f.caption}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "limits" && (
            <div className="space-y-3">
              {[
                ["shield", "#FEF2F2", "#991B1B", "Not a live flood sensor",
                  "FloodRoute ranks roads by terrain (lower than surroundings, low height, near water, underpasses). It does not know whether water is on a road right now."],
                ["water", "#FFFBEB", "#92400E", "No drains, pumps or tide",
                  "Underground drainage, pump status and tide levels drive much of Mumbai's waterlogging but are not open data, so they are not modelled."],
                ["tune", "#FFFBEB", "#92400E", "Two explicit assumptions",
                  "(1) How many roads count as likely to flood for each rain category (you can change it with \"What if?\"). (2) The list of 35 major hospitals we route to (BMC municipal and large general hospitals; Breach Candy and GT Hospital are not mapped in OpenStreetMap)."],
                ["route", "#F0F9FF", "#075985", "Main roads only, free-flow times",
                  "The road network has main roads only, so \"cut off\" means no flood-safe main-road route. Minutes are free-flow estimates from speed limits, without traffic."],
                ["science", "#F0FDF4", "#065F46", "What data would make it a real predictor",
                  "Bare-earth elevation (LiDAR), BMC drain and pump data, tide gauges, and dated waterlogging reports or flood-gauge time series."],
              ].map(([icon, bg, color, title, body]) => (
                <div key={title} className="flex gap-2.5 p-3 rounded-xl border border-[#E5E7EB]" style={{ background: bg }}>
                  <span className="material-symbols-outlined text-base shrink-0" style={{ color }}>{icon}</span>
                  <div>
                    <h5 className="font-bold text-xs" style={{ color }}>{title}</h5>
                    <p className="text-[11px] text-[#374151] mt-0.5 leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-[#E5E7EB] bg-[#F9FAFB] flex justify-between items-center text-xs text-[#6B7280]">
          <span>Prototype for decision support · Not an official warning system</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#0B8A7E] text-white font-semibold hover:bg-[#09756B] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
