// Types mirrored from multi-downloader-nx backend

export type ServiceType = 'crunchy' | 'hidive' | 'adn';

export type AuthData = {
  username: string;
  password: string;
};

export type AuthResponse = ResponseBase<undefined>;

export type SearchData = {
  search: string;
  page?: number;
  'search-type'?: string;
  'search-locale'?: string;
};

export type SearchResponseItem = {
  image: string;
  name: string;
  desc?: string;
  id: string;
  lang?: string[];
  rating: number;
};

export type SearchResponse = ResponseBase<SearchResponseItem[]>;

export type Episode = {
  e: string;
  lang: string[];
  name: string;
  season: string;
  seasonTitle: string;
  episode: string;
  id: string;
  img: string;
  description: string;
  time: string;
};

export type EpisodeListResponse = ResponseBase<Episode[]>;

export type ResolveItemsData = {
  id: string;
  dubLang: string[];
  all: boolean;
  but: boolean;
  novids: boolean;
  noaudio: boolean;
  dlVideoOnce: boolean;
  e: string;
  fileName: string;
  q: number;
  dlsubs: string[];
};

export type QueueItem = {
  title: string;
  episode: string;
  fileName: string;
  dlsubs: string[];
  parent: { title: string; season: string };
  q: number;
  dlVideoOnce: boolean;
  dubLang: string[];
  image: string;
} & ResolveItemsData;

export type ProgressData = {
  total: number;
  cur: number;
  percent: number | string;
  time: number;
  downloadSpeed: number;
  bytes: number;
};

export type LanguageItem = {
  cr_locale: string;
  locale: string;
  code: string;
  name: string;
};

export type DownloadInfo = {
  image: string;
  parent: { title: string };
  title: string;
  language: LanguageItem;
  fileName: string;
};

export type ExtendedProgress = {
  downloadInfo: DownloadInfo;
  progress: ProgressData;
};

export type ResponseBase<T> =
  | { isOk: true; value: T }
  | { isOk: false; reason: { name: string; message: string } };

export type FolderTypes = 'content' | 'config';

export type GUIConfig = {
  port: number;
  password?: string;
};

// WebSocket message types
export type WSMessage = {
  name: string;
  data: unknown;
  id: string;
};
