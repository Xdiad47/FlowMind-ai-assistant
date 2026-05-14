// src/viewmodels/useInboxViewModel.ts
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getThreads, getInboxThreads, deleteThreads, archiveThreads, markAsRead } from '@/services/api/gmailService';
import { getOutlookInbox, searchOutlook } from '@/services/api/outlookService';
import { useAuthStore } from '@/stores/authStore';
import { useIntegrationStore } from '@/stores/integrationStore';
import type { EmailThread } from '@/models/Email';

export function useInboxViewModel() {
  const { user } = useAuthStore();
  const { outlookConnected } = useIntegrationStore();
  const [activeSource, setActiveSourceState] = useState<'gmail' | 'outlook'>('gmail');
  const [gmailThreads, setGmailThreads] = useState<EmailThread[]>([]);
  const [outlookThreads, setOutlookThreads] = useState<EmailThread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedThreadIds, setSelectedThreadIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const threads = activeSource === 'gmail' ? gmailThreads : outlookThreads;

  const fetchGmailInbox = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    const res = await getInboxThreads(30);
    if (res.success && res.data) setGmailThreads(res.data);
    else if (res.error) setError(res.error.message);
    setIsLoading(false);
  }, [user]);

  const fetchOutlookInbox = useCallback(async () => {
    if (!user || !outlookConnected) return;
    setIsLoading(true);
    setError(null);
    const res = await getOutlookInbox(30);
    if (res.success && res.data) setOutlookThreads(res.data);
    else if (res.error) setError(res.error.message);
    setIsLoading(false);
  }, [user, outlookConnected]);

  // Initial Gmail load
  useEffect(() => {
    fetchGmailInbox();
  }, [fetchGmailInbox]);

  // Load Outlook when switching to it
  const setActiveSource = useCallback((source: 'gmail' | 'outlook') => {
    setActiveSourceState(source);
    setSearchQuery('');
    setSelectedThreadIds([]);
    if (source === 'outlook' && outlookThreads.length === 0) {
      fetchOutlookInbox();
    }
  }, [outlookThreads.length, fetchOutlookInbox]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!user) return;
      const q = searchQuery.trim();
      if (!q) {
        if (activeSource === 'gmail') fetchGmailInbox();
        else fetchOutlookInbox();
        return;
      }
      setIsLoading(true);
      setError(null);
      if (activeSource === 'gmail') {
        const res = await getThreads(`in:inbox ${q}`);
        if (res.success && res.data) setGmailThreads(res.data);
        else if (res.error) setError(res.error.message);
      } else {
        const res = await searchOutlook(q);
        if (res.success && res.data) setOutlookThreads(res.data);
        else if (res.error) setError(res.error.message);
      }
      setIsLoading(false);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, user, activeSource, fetchGmailInbox, fetchOutlookInbox]);

  const unreadCount = useMemo(() => threads.filter((t) => !t.isRead).length, [threads]);

  const selectThread = (id: string) => {
    setSelectedThreadIds((prev) => prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]);
  };

  const selectAll = () => setSelectedThreadIds(threads.map((t) => t.id));
  const clearSelection = () => setSelectedThreadIds([]);

  const deleteSelected = async () => {
    if (selectedThreadIds.length === 0 || activeSource !== 'gmail') return;
    if (confirm(`Delete ${selectedThreadIds.length} email(s)?`)) {
      setIsLoading(true);
      await deleteThreads(selectedThreadIds);
      clearSelection();
      await fetchGmailInbox();
    }
  };

  const archiveSelected = async () => {
    if (selectedThreadIds.length === 0 || activeSource !== 'gmail') return;
    setIsLoading(true);
    await archiveThreads(selectedThreadIds);
    clearSelection();
    await fetchGmailInbox();
  };

  const markSelectedAsRead = async () => {
    if (selectedThreadIds.length === 0 || activeSource !== 'gmail') return;
    setIsLoading(true);
    await markAsRead(selectedThreadIds);
    clearSelection();
    await fetchGmailInbox();
  };

  const fetchInboxThreads = useCallback(() => {
    if (activeSource === 'gmail') fetchGmailInbox();
    else fetchOutlookInbox();
  }, [activeSource, fetchGmailInbox, fetchOutlookInbox]);

  return {
    threads,
    activeSource,
    setActiveSource,
    outlookConnected,
    isLoading,
    error,
    selectedThreadIds,
    searchQuery,
    unreadCount,
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
