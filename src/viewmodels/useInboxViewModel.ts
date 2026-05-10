// src/viewmodels/useInboxViewModel.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getThreads, getInboxThreads, deleteThreads, archiveThreads, markAsRead } from '@/services/api/gmailService';
import { useAuthStore } from '@/stores/authStore';
import type { EmailThread } from '@/models/Email';

export function useInboxViewModel() {
  const { user } = useAuthStore();
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedThreadIds, setSelectedThreadIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInboxThreads = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    const res = await getInboxThreads(30);
    if (res.success && res.data) {
      setThreads(res.data);
    } else if (res.error) {
      setError(res.error.message);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchInboxThreads();
  }, [fetchInboxThreads]);

  const fetchThreads = async (query?: string) => {
    setIsLoading(true);
    setError(null);
    const res = await getThreads(query);
    if (res.success && res.data) {
      setThreads(res.data);
    } else if (res.error) {
      setError(res.error.message);
    }
    setIsLoading(false);
  };

  const unreadCount = useMemo(() => {
    return threads.filter((t) => !t.isRead).length;
  }, [threads]);

  const selectThread = (id: string) => {
    setSelectedThreadIds((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedThreadIds(threads.map((t) => t.id));
  const clearSelection = () => setSelectedThreadIds([]);

  const deleteSelected = async () => {
    if (selectedThreadIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedThreadIds.length} email(s)?`)) {
      setIsLoading(true);
      await deleteThreads(selectedThreadIds);
      clearSelection();
      await fetchInboxThreads();
    }
  };

  const archiveSelected = async () => {
    if (selectedThreadIds.length === 0) return;
    setIsLoading(true);
    await archiveThreads(selectedThreadIds);
    clearSelection();
    await fetchInboxThreads();
  };

  const markSelectedAsRead = async () => {
    if (selectedThreadIds.length === 0) return;
    setIsLoading(true);
    await markAsRead(selectedThreadIds);
    clearSelection();
    await fetchInboxThreads();
  };

  return {
    threads,
    isLoading,
    error,
    selectedThreadIds,
    searchQuery,
    unreadCount,
    fetchThreads,
    fetchInboxThreads,
    selectThread,
    selectAll,
    clearSelection,
    deleteSelected,
    archiveSelected,
    markSelectedAsRead,
    setSearchQuery,
  };
}
