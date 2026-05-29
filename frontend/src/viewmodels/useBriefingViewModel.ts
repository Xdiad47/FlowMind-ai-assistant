// src/viewmodels/useBriefingViewModel.ts
import { useState, useEffect, useCallback } from 'react';
import type { DailyBriefing } from '@/models/Briefing';
import { getTodayBriefing } from '@/services/api/briefingService';

// Module-level cache: survives tab switches (component unmount/remount) for the session
let _cached: { data: DailyBriefing; at: number } | null = null;
const TTL = 60 * 60 * 1000; // 1 hour — briefing is daily data, no need to re-fetch constantly

export function useBriefingViewModel() {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(_cached?.data ?? null);
  const [isLoading, setIsLoading] = useState(_cached === null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    if (!force && _cached && Date.now() - _cached.at < TTL) {
      setBriefing(_cached.data);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    const result = await getTodayBriefing();
    if (result.success && result.data) {
      _cached = { data: result.data, at: Date.now() };
      setBriefing(result.data);
    } else {
      setError(result.error?.message ?? 'Failed to load your briefing.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { briefing, isLoading, error, refresh: () => load(true) };
}
