// src/viewmodels/useInboxViewModel.ts
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getThreads, getInboxThreads, deleteThreads, archiveThreads, markAsRead } from '@/services/api/gmailService';
import { getOutlookInbox, searchOutlook } from '@/services/api/outlookService';
import { useAuthStore } from '@/stores/authStore';
import { useIntegrationStore } from '@/stores/integrationStore';
import type { EmailThread } from '@/models/Email';

// Module-level cache: survives tab switches for the session
let _gmailCache: { data: EmailThread[]; at: number } | null = null;
let _outlookCache: { data: EmailThread[]; at: number } | null = null;
const INBOX_TTL = 2 * 60 * 1000; // 2 minutes

export function useInboxViewModel() {
  const { user } = useAuthStore();
  const { outlookConnected } = useIntegrationStore();
  const [activeSource, setActiveSourceState] = useState<'gmail' | 'outlook'>('gmail');
  const [gmailThreads, setGmailThreads] = useState<EmailThread[]>(_gmailCache?.data ?? []);
  const [outlookThreads, setOutlookThreads] = useState<EmailThread[]>(_outlookCache?.data ?? []);
  const [isLoading, setIsLoading] = useState(_gmailCache === null);
  const [error, setError] = useState<string | null>(null);
  const [selectedThreadIds, setSelectedThreadIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const threads = activeSource === 'gmail' ? gmailThreads : outlookThreads;

  const fetchGmailInbox = useCallback(async (force = false) => {
    if (!user) return;
    if (!force && _gmailCache && Date.now() - _gmailCache.at < INBOX_TTL) {
      setGmailThreads(_gmailCache.data);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    const res = await getInboxThreads(30);
    if (res.success && res.data) {
      _gmailCache = { data: res.data, at: Date.now() };
      setGmailThreads(res.data);
    } else if (res.error) setError(res.error.message);
    setIsLoading(false);
  }, [user]);

  const fetchOutlookInbox = useCallback(async (force = false) => {
    if (!user || !outlookConnected) return;
    if (!force && _outlookCache && Date.now() - _outlookCache.at < INBOX_TTL) {
      setOutlookThreads(_outlookCache.data);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    const res = await getOutlookInbox(30);
    if (res.success && res.data) {
      _outlookCache = { data: res.data, at: Date.now() };
      setOutlookThreads(res.data);
    } else if (res.error) setError(res.error.message);
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
      _gmailCache = null;
      clearSelection();
      await fetchGmailInbox(true);
    }
  };

  const archiveSelected = async () => {
    if (selectedThreadIds.length === 0 || activeSource !== 'gmail') return;
    setIsLoading(true);
    await archiveThreads(selectedThreadIds);
    _gmailCache = null;
    clearSelection();
    await fetchGmailInbox(true);
  };

  const markSelectedAsRead = async () => {
    if (selectedThreadIds.length === 0 || activeSource !== 'gmail') return;
    setIsLoading(true);
    await markAsRead(selectedThreadIds);
    _gmailCache = null;
    clearSelection();
    await fetchGmailInbox(true);
  };

  const fetchInboxThreads = useCallback(() => {
    if (activeSource === 'gmail') fetchGmailInbox(true);
    else fetchOutlookInbox(true);
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
