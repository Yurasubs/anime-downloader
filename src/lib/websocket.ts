import { v4 as uuidv4 } from 'uuid';
import type { WSMessage } from '@/types';

type MessageCallback = (data: WSMessage) => void;
type EventCallback = (data: { name: string; data: unknown }) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private pendingRequests = new Map<string, (data: unknown) => void>();
  private eventListeners = new Map<string, Set<EventCallback>>();
  private connectionListeners = new Set<(connected: boolean) => void>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private url: string = '';

  connect(url: string): Promise<void> {
    this.url = url;
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);
      } catch {
        reject(new Error('Failed to create WebSocket'));
        return;
      }

      this.ws.onopen = () => {
        this.notifyConnectionListeners(true);
        resolve();
      };

      this.ws.onerror = () => {
        reject(new Error('WebSocket connection failed'));
      };

      this.ws.onclose = () => {
        this.notifyConnectionListeners(false);
        this.scheduleReconnect();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as WSMessage;

          // Check if this is a response to a pending request
          if (msg.id && this.pendingRequests.has(msg.id)) {
            const resolver = this.pendingRequests.get(msg.id)!;
            this.pendingRequests.delete(msg.id);
            resolver(msg.data);
            return;
          }

          // Otherwise it's a server-pushed event
          const listeners = this.eventListeners.get(msg.name);
          if (listeners) {
            listeners.forEach((cb) => cb(msg));
          }
        } catch {
          // Ignore parse errors
        }
      };
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.url) {
        this.connect(this.url).catch(() => {
          // Will retry on next schedule
        });
      }
    }, 3000);
  }

  private notifyConnectionListeners(connected: boolean) {
    this.connectionListeners.forEach((cb) => cb(connected));
  }

  onConnectionChange(cb: (connected: boolean) => void) {
    this.connectionListeners.add(cb);
    return () => this.connectionListeners.delete(cb);
  }

  async send<T = unknown>(name: string, data: unknown = undefined): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const id = uuidv4();
    const promise = new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request ${name} timed out`));
      }, 30000);

      this.pendingRequests.set(id, (responseData) => {
        clearTimeout(timeout);
        resolve(responseData as T);
      });
    });

    this.ws.send(JSON.stringify({ name, data, id }));
    return promise;
  }

  /** Send a message without waiting for a response (fire-and-forget) */
  sendNoWait(name: string, data: unknown = undefined): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }
    const id = uuidv4();
    this.ws.send(JSON.stringify({ name, data, id }));
  }

  on(event: string, callback: EventCallback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instances
export const publicWS = new WebSocketClient();
export const privateWS = new WebSocketClient();
