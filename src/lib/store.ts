import { create } from 'zustand';
import type {
  ServiceType,
  SearchResponseItem,
  Episode,
  QueueItem,
  ExtendedProgress,
} from '@/types';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected';
export type AppView = 'login' | 'setup' | 'service-select' | 'main';

interface AppState {
  // Connection
  connectionState: ConnectionState;
  setConnectionState: (state: ConnectionState) => void;

  // App view
  view: AppView;
  setView: (view: AppView) => void;

  // Service
  service: ServiceType | null;
  setService: (service: ServiceType | null) => void;

  // Auth
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;

  // Version
  version: string;
  setVersion: (version: string) => void;

  // Search
  searchResults: SearchResponseItem[];
  setSearchResults: (results: SearchResponseItem[]) => void;
  isSearching: boolean;
  setIsSearching: (value: boolean) => void;

  // Episodes
  episodes: Episode[];
  setEpisodes: (episodes: Episode[]) => void;
  selectedSeries: SearchResponseItem | null;
  setSelectedSeries: (item: SearchResponseItem | null) => void;

  // Queue
  queue: QueueItem[];
  setQueue: (queue: QueueItem[]) => void;
  isDownloading: boolean;
  setIsDownloading: (value: boolean) => void;
  queueRunning: boolean;
  setQueueRunning: (value: boolean) => void;

  // Current download
  currentItem: QueueItem | null;
  setCurrentItem: (item: QueueItem | null) => void;
  currentProgress: ExtendedProgress | null;
  setCurrentProgress: (progress: ExtendedProgress | null) => void;

  // Available languages
  availableDubCodes: string[];
  setAvailableDubCodes: (codes: string[]) => void;
  availableSubCodes: string[];
  setAvailableSubCodes: (codes: string[]) => void;

  // Download options
  downloadOptions: {
    q: number;
    dubLang: string[];
    dlsubs: string[];
    fileName: string;
    dlVideoOnce: boolean;
    all: boolean;
    but: boolean;
    novids: boolean;
    noaudio: boolean;
  };
  setDownloadOption: <K extends keyof AppState['downloadOptions']>(
    key: K,
    value: AppState['downloadOptions'][K]
  ) => void;

  // Notifications
  notifications: { id: string; message: string; type: 'info' | 'error' | 'success' }[];
  addNotification: (message: string, type: 'info' | 'error' | 'success') => void;
  removeNotification: (id: string) => void;
}

let notifCounter = 0;

export const useAppStore = create<AppState>((set) => ({
  connectionState: 'disconnected',
  setConnectionState: (connectionState) => set({ connectionState }),

  view: 'login',
  setView: (view) => set({ view }),

  service: null,
  setService: (service) => set({ service }),

  isAuthenticated: false,
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  version: '',
  setVersion: (version) => set({ version }),

  searchResults: [],
  setSearchResults: (searchResults) => set({ searchResults }),
  isSearching: false,
  setIsSearching: (isSearching) => set({ isSearching }),

  episodes: [],
  setEpisodes: (episodes) => set({ episodes }),
  selectedSeries: null,
  setSelectedSeries: (selectedSeries) => set({ selectedSeries }),

  queue: [],
  setQueue: (queue) => set({ queue }),
  isDownloading: false,
  setIsDownloading: (isDownloading) => set({ isDownloading }),
  queueRunning: false,
  setQueueRunning: (queueRunning) => set({ queueRunning }),

  currentItem: null,
  setCurrentItem: (currentItem) => set({ currentItem }),
  currentProgress: null,
  setCurrentProgress: (currentProgress) => set({ currentProgress }),

  availableDubCodes: [],
  setAvailableDubCodes: (availableDubCodes) => set({ availableDubCodes }),
  availableSubCodes: [],
  setAvailableSubCodes: (availableSubCodes) => set({ availableSubCodes }),

  downloadOptions: {
    q: 0,
    dubLang: ['jpn'],
    dlsubs: ['all'],
    fileName: '',
    dlVideoOnce: false,
    all: false,
    but: false,
    novids: false,
    noaudio: false,
  },
  setDownloadOption: (key, value) =>
    set((state) => ({
      downloadOptions: { ...state.downloadOptions, [key]: value },
    })),

  notifications: [],
  addNotification: (message, type) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { id: String(++notifCounter), message, type },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
