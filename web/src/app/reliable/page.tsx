'use client';

import { useRouter } from 'next/navigation';
import { Header } from '../../components/Header';
import { ReliabilityModal } from '../../components/ReliabilityModal';
import { useEDA, useMeta, useValidation } from '../../lib/api';

// Stand-alone "How reliable is this?" page: same evidence as the in-app panel (one source of truth)
export default function ReliablePage() {
  const router = useRouter();
  const { data: meta } = useMeta();
  const { data: validation } = useValidation();
  const { data: eda } = useEDA();

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#111827]">
      <Header meta={meta} dataMode={meta?.data_mode} />
      <ReliabilityModal
        isOpen
        onClose={() => router.push('/')}
        validationData={validation}
        edaData={eda}
        dataMode={meta?.data_mode}
      />
    </div>
  );
}
