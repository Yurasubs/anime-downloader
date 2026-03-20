'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import {
  fetchSetupStatus,
  fetchConnect,
  sendCommand,
} from '@/lib/api-client';
import type {
  AuthData,
  AuthResponse,
  SearchData,
  SearchResponse,
  EpisodeListResponse,
  QueueItem,
  ExtendedProgress,
  ServiceType,
  GUIConfig,
  ResolveItemsData,
} from '@/types';

export function useAPI() {
  const store = useAppStore();
  const eventSourceRef = useRef<EventSource | null>(null);

  // -------------------------------------------------------------------
  // Real-time updates via Server-Sent Events (SSE)
  // -------------------------------------------------------------------
  const startPolling = useCallback(() => {
    if (eventSourceRef.current) return; // already listening

    const es = new EventSource('/api/ws/stream');
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const state = JSON.parse(event.data);
        const appState = useAppStore.getState();

        appState.setCurrentProgress(state.progress as ExtendedProgress | null);
        appState.setCurrentItem(state.currentItem as QueueItem | null);
        appState.setQueue(state.queue as QueueItem[]);
        appState.setIsDownloading(state.isDownloading);
        appState.setQueueRunning(state.queueRunning);
      } catch {
        // Silently ignore parse errors
      }
    };

    es.onerror = () => {
      // EventSource auto-reconnects natively; no action strongly required
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // -------------------------------------------------------------------
  // Connection flow
  // -------------------------------------------------------------------

  const connectPrivate = useCallback(async (password?: string) => {
    try {
      store.setConnectionState('connecting');
      const result = await fetchConnect(password);

      store.setConnectionState('connected');
      store.setVersion(result.version);
      store.setQueue(result.queue as QueueItem[]);
      store.setIsDownloading(result.isDownloading);
      store.setQueueRunning(result.queueRunning);

      if (result.type) {
        store.setService(result.type as ServiceType);
        store.setView('main');
      } else {
        store.setView('service-select');
      }

      // Start polling for real-time-ish updates
      startPolling();
    } catch {
      store.setConnectionState('disconnected');
      store.addNotification('Connection failed. Check your password.', 'error');
    }
  }, [startPolling]);

  const checkSetup = useCallback(async () => {
    try {
      const { isSetup, requirePassword } = await fetchSetupStatus();

      if (!isSetup) {
        store.setView('setup');
        await connectPrivate();
        return;
      }

      if (!requirePassword) {
        await connectPrivate();
      } else {
        store.setView('login');
      }
    } catch {
      store.addNotification('Unable to connect to server', 'error');
    }
  }, [connectPrivate]);

  // -------------------------------------------------------------------
  // API methods (same interface as the old useWebSocket)
  // -------------------------------------------------------------------

  const setupServer = useCallback(async (config: GUIConfig) => {
    return sendCommand<boolean>('setupServer', config);
  }, []);

  const selectService = useCallback(async (service: ServiceType) => {
    // 'setup' is fire-and-forget on the server
    await sendCommand('setup', service);
    store.setService(service);
    store.setView('main');
    // Small delay so the server has time to instantiate the service handler
    await new Promise((r) => setTimeout(r, 500));
    // Load available language codes
    try {
      const dubCodes = await sendCommand<string[]>('availableDubCodes', undefined);
      store.setAvailableDubCodes(dubCodes);
      const subCodes = await sendCommand<string[]>('availableSubCodes', undefined);
      store.setAvailableSubCodes(subCodes);
    } catch {
      // Non-critical
    }
  }, []);

  const authenticate = useCallback(async (data: AuthData): Promise<AuthResponse> => {
    return sendCommand<AuthResponse>('auth', data);
  }, []);

  const checkToken = useCallback(async () => {
    return sendCommand<AuthResponse>('checkToken', undefined);
  }, []);

  const search = useCallback(async (data: SearchData): Promise<SearchResponse> => {
    return sendCommand<SearchResponse>('search', data);
  }, []);

  const listEpisodes = useCallback(async (id: string): Promise<EpisodeListResponse> => {
    return sendCommand<EpisodeListResponse>('listEpisodes', id);
  }, []);

  const resolveItems = useCallback(async (data: ResolveItemsData): Promise<boolean> => {
    return sendCommand<boolean>('resolveItems', data);
  }, []);

  const getQueue = useCallback(async (): Promise<QueueItem[]> => {
    return sendCommand<QueueItem[]>('getQueue', undefined);
  }, []);

  const removeFromQueue = useCallback(async (index: number) => {
    return sendCommand('removeFromQueue', index);
  }, []);

  const clearQueue = useCallback(async () => {
    return sendCommand('clearQueue', undefined);
  }, []);

  const setDownloadQueue = useCallback(async (running: boolean) => {
    await sendCommand('setDownloadQueue', running);
    store.setQueueRunning(running);
  }, []);

  const changeProvider = useCallback(async () => {
    const result = await sendCommand<boolean>('changeProvider', undefined);
    if (result) {
      store.setService(null);
      store.setView('service-select');
      store.setSearchResults([]);
      store.setEpisodes([]);
      store.setSelectedSeries(null);
      store.setIsAuthenticated(false);
    }
    return result;
  }, []);

  const openFolder = useCallback(async (type: 'content' | 'config') => {
    return sendCommand('openFolder', type);
  }, []);

  const openFile = useCallback(async (data: [string, string]) => {
    return sendCommand('openFile', data);
  }, []);

  const openURL = useCallback(async (url: string) => {
    return sendCommand('openURL', url);
  }, []);

  return {
    checkSetup,
    connectPrivate,
    setupServer,
    selectService,
    authenticate,
    checkToken,
    search,
    listEpisodes,
    resolveItems,
    getQueue,
    removeFromQueue,
    clearQueue,
    setDownloadQueue,
    changeProvider,
    openFolder,
    openFile,
    openURL,
  };
}
