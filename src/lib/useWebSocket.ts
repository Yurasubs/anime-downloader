'use client';

import { useEffect, useCallback, useRef } from 'react';
import { publicWS, privateWS } from '@/lib/websocket';
import { useAppStore } from '@/lib/store';
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

function getWSBase() {
  if (typeof window === 'undefined') return '';
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.host;
  return `${proto}://${host}`;
}

export function useWebSocket() {
  const store = useAppStore();
  const cleanupRef = useRef<(() => void)[]>([]);

  const connectPublic = useCallback(async () => {
    try {
      await publicWS.connect(`${getWSBase()}/public`);
    } catch {
      store.addNotification('Unable to connect to server', 'error');
    }
  }, []);

  const connectPrivate = useCallback(async (password?: string) => {
    try {
      store.setConnectionState('connecting');
      const params = password ? `?password=${encodeURIComponent(password)}` : '';
      await privateWS.connect(`${getWSBase()}/private${params}`);
      store.setConnectionState('connected');
      store.setView('service-select');

      // Get server type
      const type = await privateWS.send<ServiceType | undefined>('type', undefined);
      if (type) {
        store.setService(type);
        store.setView('main');
      }

      // Get version
      const version = await privateWS.send<string>('version', undefined);
      store.setVersion(version);

      // Get queue state
      const queue = await privateWS.send<QueueItem[]>('getQueue', undefined);
      store.setQueue(queue);
      const downloading = await privateWS.send<boolean>('isDownloading', undefined);
      store.setIsDownloading(downloading);
      const queueRunning = await privateWS.send<boolean>('getDownloadQueue', undefined);
      store.setQueueRunning(queueRunning);

      // Listen for server-pushed events
      const unsub1 = privateWS.on('progress', (msg) => {
        useAppStore.getState().setCurrentProgress(msg.data as ExtendedProgress);
      });
      const unsub2 = privateWS.on('finish', () => {
        useAppStore.getState().setCurrentProgress(null);
        useAppStore.getState().setIsDownloading(false);
        useAppStore.getState().setCurrentItem(null);
      });
      const unsub3 = privateWS.on('queueChange', (msg) => {
        useAppStore.getState().setQueue(msg.data as QueueItem[]);
      });
      const unsub4 = privateWS.on('current', (msg) => {
        useAppStore.getState().setCurrentItem(msg.data as QueueItem | null);
        if (msg.data) {
          useAppStore.getState().setIsDownloading(true);
        }
      });

      cleanupRef.current = [unsub1, unsub2, unsub3, unsub4];
    } catch {
      store.setConnectionState('disconnected');
      store.addNotification('Connection failed. Check your password.', 'error');
    }
  }, []);

  const checkSetup = useCallback(async () => {
    try {
      await connectPublic();
      const isSetup = await publicWS.send<boolean>('isSetup', undefined);
      const requirePassword = await publicWS.send<boolean>('requirePassword', undefined);

      if (!isSetup) {
        store.setView('setup');
        // Connect without password for setup
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
  }, [connectPublic, connectPrivate]);

  useEffect(() => {
    return () => {
      // Only unsubscribe event listeners, never disconnect the singleton WSes.
      // Multiple components share useWebSocket — disconnecting on unmount
      // would kill the connection when any one of them unmounts.
      cleanupRef.current.forEach((unsub) => unsub());
    };
  }, []);

  // API methods
  const setupServer = useCallback(async (config: GUIConfig) => {
    return privateWS.send<boolean>('setupServer', config);
  }, []);

  const selectService = useCallback(async (service: ServiceType) => {
    // 'setup' is fire-and-forget on the server (no response sent back)
    privateWS.sendNoWait('setup', service);
    store.setService(service);
    store.setView('main');
    // Small delay so the server has time to instantiate the service handler
    await new Promise((r) => setTimeout(r, 500));
    // Load available language codes
    try {
      const dubCodes = await privateWS.send<string[]>('availableDubCodes', undefined);
      store.setAvailableDubCodes(dubCodes);
      const subCodes = await privateWS.send<string[]>('availableSubCodes', undefined);
      store.setAvailableSubCodes(subCodes);
    } catch {
      // Non-critical: language codes can be loaded later
    }
  }, []);

  const authenticate = useCallback(async (data: AuthData): Promise<AuthResponse> => {
    return privateWS.send<AuthResponse>('auth', data);
  }, []);

  const checkToken = useCallback(async () => {
    return privateWS.send<AuthResponse>('checkToken', undefined);
  }, []);

  const search = useCallback(async (data: SearchData): Promise<SearchResponse> => {
    return privateWS.send<SearchResponse>('search', data);
  }, []);

  const listEpisodes = useCallback(async (id: string): Promise<EpisodeListResponse> => {
    return privateWS.send<EpisodeListResponse>('listEpisodes', id);
  }, []);

  const resolveItems = useCallback(async (data: ResolveItemsData): Promise<boolean> => {
    return privateWS.send<boolean>('resolveItems', data);
  }, []);

  const getQueue = useCallback(async (): Promise<QueueItem[]> => {
    return privateWS.send<QueueItem[]>('getQueue', undefined);
  }, []);

  const removeFromQueue = useCallback(async (index: number) => {
    return privateWS.send('removeFromQueue', index);
  }, []);

  const clearQueue = useCallback(async () => {
    return privateWS.send('clearQueue', undefined);
  }, []);

  const setDownloadQueue = useCallback(async (running: boolean) => {
    await privateWS.send('setDownloadQueue', running);
    store.setQueueRunning(running);
  }, []);

  const changeProvider = useCallback(async () => {
    const result = await privateWS.send<boolean>('changeProvider', undefined);
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
    return privateWS.send('openFolder', type);
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
  };
}
