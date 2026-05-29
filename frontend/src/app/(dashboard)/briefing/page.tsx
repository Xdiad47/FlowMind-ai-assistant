// src/app/(dashboard)/briefing/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useBriefingViewModel } from '@/viewmodels/useBriefingViewModel';
import { DailyBriefingCard } from '@/components/briefing/DailyBriefingCard';

export default function BriefingPage() {
  const router = useRouter();
  const { briefing, isLoading, error, refresh } = useBriefingViewModel();

  return (
    <div className="h-full flex flex-col bg-base">
      <DailyBriefingCard
        briefing={briefing}
        isLoading={isLoading}
        error={error}
        onRefresh={refresh}
        onNavigate={router.push}
      />
    </div>
  );
}
