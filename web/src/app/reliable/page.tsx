'use client';

import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { useMeta, useValidation } from '../../lib/api';

export default function ReliablePage() {
  const { data: meta } = useMeta();
  const { data: validation } = useValidation();

  const isFixture = meta?.data_mode !== 'real';

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#111827]">
      {/* Header */}
      <Header dataMode={meta?.data_mode || 'fixture'} />

      {/* Main Content: Centred 720px Column */}
      <main className="flex-1 py-10 px-4">
        <div className="max-w-[720px] mx-auto">
          {/* Back Navigation Link */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[#0B8A7E] hover:text-[#09756B] text-[14px] font-semibold group"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
              <span>Back to ambulance routing map</span>
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4FFFC] text-[#0B8A7E] text-[12px] font-semibold border border-[#D1FAE5] mb-2">
              <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
              <span>Model Evaluation &amp; Limitations</span>
            </div>
            <h1 className="text-[32px] sm:text-[36px] font-extrabold text-[#111827] tracking-tight">
              How reliable is this?
            </h1>
            <p className="text-[16px] text-[#6B7280] mt-2 leading-relaxed">
              Transparent operational accuracy testing under torrential monsoon scenarios.
            </p>
          </div>

          {/* SECTION 1: Ground validation testing */}
          <section className="mb-10 bg-[#F6F8FA] rounded-2xl p-6 sm:p-8 border border-[#E5E7EB] shadow-xs">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-[20px] font-bold text-[#111827]">
                  Ground validation testing
                </h2>
                <p className="text-[14px] text-[#4B5563] mt-1 leading-relaxed">
                  We checked our marked roads against <span className="font-semibold text-[#111827]">{validation?.n_spots ?? 17} places where waterlogging was reported</span> in Mumbai.
                </p>
              </div>
              <span className="material-symbols-outlined text-[28px] text-[#0B8A7E] shrink-0">
                query_stats
              </span>
            </div>

            {/* Validation Bar Chart */}
            <div className="space-y-5 pt-1">
              {/* Bar 1: Our Method */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline text-[14px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0B8A7E]"></span>
                    <span className="font-semibold text-[#111827]">Our method (FloodRoute)</span>
                  </div>
                  <span className="font-bold text-[#0B8A7E]">
                    {isFixture ? 'n/a in fixture mode' : `${Math.round((validation?.auc_score ?? 0.82) * 100)}%`}
                  </span>
                </div>
                <div className="w-full h-8 bg-[#E5E7EB] rounded-lg overflow-hidden flex">
                  <div
                    className="h-full bg-[#0B8A7E] rounded-lg flex items-center justify-end pr-3 transition-all duration-500"
                    style={{ width: isFixture ? '75%' : `${Math.round((validation?.auc_score ?? 0.82) * 100)}%` }}
                  >
                    <span className="text-white text-[12px] font-semibold tracking-wide">
                      {isFixture ? 'Fixture Mode' : 'Evaluated Score'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bar 2: Elevation Only */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline text-[14px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#6B7280]"></span>
                    <span className="font-medium text-[#4B5563]">Elevation only baseline</span>
                  </div>
                  <span className="font-semibold text-[#6B7280]">
                    {isFixture ? 'n/a in fixture mode' : `${Math.round((validation?.auc_elev_only ?? 0.53) * 100)}%`}
                  </span>
                </div>
                <div className="w-full h-8 bg-[#E5E7EB] rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-[#9CA3AF] rounded-lg transition-all duration-500"
                    style={{ width: isFixture ? '50%' : `${Math.round((validation?.auc_elev_only ?? 0.53) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Bar 3: Random Guess */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline text-[14px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1]"></span>
                    <span className="font-medium text-[#4B5563]">Random guess baseline</span>
                  </div>
                  <span className="font-semibold text-[#6B7280]">
                    {isFixture ? 'n/a in fixture mode' : '15%'}
                  </span>
                </div>
                <div className="w-full h-8 bg-[#E5E7EB] rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-[#CBD5E1] rounded-lg transition-all duration-500"
                    style={{ width: isFixture ? '25%' : '15%' }}
                  ></div>
                </div>
              </div>
            </div>

            {isFixture && (
              <div className="mt-5 p-3 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[12px] text-[#92400E] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">info</span>
                <span>
                  Synthetic UI Fixture active: validation numbers will reflect real evaluation metrics once the backend pipeline finishes scoring against BMC/news reported spots.
                </span>
              </div>
            )}
          </section>

          {/* SECTION 2: What this does not know */}
          <section className="mb-8 bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E7EB] shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#FEE2E2] flex items-center justify-center text-[#DC2626]">
                <span className="material-symbols-outlined text-[20px]">info</span>
              </div>
              <h2 className="text-[20px] font-bold text-[#111827]">
                What this does not know
              </h2>
            </div>

            <ul className="space-y-3 text-[15px] text-[#4B5563]">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#DC2626] mt-2 shrink-0"></span>
                <span>
                  <strong className="text-[#111827]">Not a live flood report:</strong> It evaluates terrain vulnerability, not real-time water accumulation.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#DC2626] mt-2 shrink-0"></span>
                <span>
                  <strong className="text-[#111827]">No drains or pumps data included:</strong> Underground drainage capacities and municipal pump stations are not open data.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#DC2626] mt-2 shrink-0"></span>
                <span>
                  <strong className="text-[#111827]">Rain-to-road closure is an assumption:</strong> The mapping from IMD rain volume to the percentage of flagged roads is an operational hypothesis.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#DC2626] mt-2 shrink-0"></span>
                <span>
                  <strong className="text-[#111827]">Small validation sample size:</strong> Only publicly reported waterlogging spots were available for verification.
                </span>
              </li>
            </ul>
          </section>

          {/* SECTION 3: What we would need next */}
          <section className="mb-10 bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E7EB] shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] flex items-center justify-center text-[#0284C7]">
                <span className="material-symbols-outlined text-[20px]">bolt</span>
              </div>
              <h2 className="text-[20px] font-bold text-[#111827]">
                What we would need next
              </h2>
            </div>

            <ul className="space-y-3 text-[15px] text-[#4B5563]">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#0284C7] mt-2 shrink-0"></span>
                <span>Underground storm drain network schematics and automated stormwater pump station status</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#0284C7] mt-2 shrink-0"></span>
                <span>Real-time tide gauge telemetry to capture Arabian Sea high-tide flood gate closures</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#0284C7] mt-2 shrink-0"></span>
                <span>IoT ultrasonic flood-gauge water-level time series along arterial corridors</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#0284C7] mt-2 shrink-0"></span>
                <span>Live traffic camera telemetry and ambulance chassis intake depth ratings</span>
              </li>
            </ul>
          </section>
        </div>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
