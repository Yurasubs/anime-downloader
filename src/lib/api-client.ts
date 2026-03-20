/**
 * Client-side API helper.
 *
 * Simple typed fetch wrappers for calling the Next.js API routes
 * that bridge to the backend WebSocket.
 */

/** POST JSON and parse the response */
async function post<T = unknown>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || `Request failed: ${res.status}`);
  }

  return json as T;
}

/** GET and parse the response */
async function get<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || `Request failed: ${res.status}`);
  }

  return json as T;
}

// ---------------------------------------------------------------------------
// Typed API methods
// ---------------------------------------------------------------------------

export interface SetupStatus {
  isSetup: boolean;
  requirePassword: boolean;
}

export interface ConnectResult {
  type: string | undefined;
  version: string;
  queue: unknown[];
  isDownloading: boolean;
  queueRunning: boolean;
}

export interface PollState {
  progress: unknown | null;
  currentItem: unknown | null;
  queue: unknown[];
  isDownloading: boolean;
  queueRunning: boolean;
}

/** Check if backend is set up & whether password is required */
export function fetchSetupStatus(): Promise<SetupStatus> {
  return get<SetupStatus>('/api/ws/setup');
}

/** Connect to backend with optional password. Returns initial state. */
export function fetchConnect(password?: string): Promise<ConnectResult> {
  return post<ConnectResult>('/api/ws/connect', password ? { password } : {});
}

/** Generic WS command proxy */
export async function sendCommand<T = unknown>(
  name: string,
  data?: unknown
): Promise<T> {
  const res = await post<{ result: T; ok?: boolean }>('/api/ws', { name, data });
  // For fire-and-forget commands the response is { ok: true }
  if ('result' in res) {
    return res.result;
  }
  return undefined as T;
}

/** Poll download state */
export function fetchPollState(): Promise<PollState> {
  return get<PollState>('/api/ws/poll');
}
