/**
 * Server-side WebSocket bridge.
 *
 * Maintains a persistent WS connection to the multi-downloader-nx backend
 * and exposes request/response helpers + cached polling state so Next.js
 * API routes can serve the browser via plain REST.
 *
 * This file MUST only be imported from server code (API routes).
 */

import WebSocket from "ws"
import { randomUUID } from "crypto"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PendingRequest {
    resolve: (data: unknown) => void
    reject: (err: Error) => void
    timer: ReturnType<typeof setTimeout>
}

interface WSMsg {
    name: string
    data: unknown
    id: string
}

export interface PollState {
    progress: unknown | null
    currentItem: unknown | null
    queue: unknown[]
    isDownloading: boolean
    queueRunning: boolean
}

// ---------------------------------------------------------------------------
// Bridge class
// ---------------------------------------------------------------------------

class WSBridge {
    private ws: WebSocket | null = null
    private pending = new Map<string, PendingRequest>()
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null
    private url = ""
    private _connected = false

    // Cached state from server-pushed events (for polling)
    public poll: PollState = {
        progress: null,
        currentItem: null,
        queue: [],
        isDownloading: false,
        queueRunning: false
    }

    get connected() {
        return this._connected
    }

    /** Connect to the backend WebSocket. Resolves once open. */
    connect(url: string): Promise<void> {
        // If already connected to the same URL, skip
        if (this.ws && this._connected && this.url === url) {
            return Promise.resolve()
        }
        // If there's an existing connection to a different URL, close it
        if (this.ws) {
            this.disconnect()
        }
        this.url = url

        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(url)
            } catch {
                reject(new Error("Failed to create WebSocket"))
                return
            }

            this.ws.on("open", () => {
                this._connected = true
                resolve()
            })

            this.ws.on("error", err => {
                if (!this._connected) {
                    reject(err)
                }
            })

            this.ws.on("close", () => {
                this._connected = false
                this.scheduleReconnect()
            })

            this.ws.on("message", raw => {
                try {
                    const msg = JSON.parse(raw.toString()) as WSMsg

                    // Check if this is a response to a pending request
                    if (msg.id && this.pending.has(msg.id)) {
                        const req = this.pending.get(msg.id)!
                        this.pending.delete(msg.id)
                        clearTimeout(req.timer)
                        req.resolve(msg.data)
                        return
                    }

                    // Otherwise it's a server-pushed event — cache for polling
                    this.handlePushEvent(msg)
                } catch {
                    // ignore parse errors
                }
            })
        })
    }

    /** Send a request and wait for the response. */
    async send<T = unknown>(name: string, data: unknown = undefined): Promise<T> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error("WebSocket not connected")
        }

        const id = randomUUID()

        const promise = new Promise<T>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(id)
                reject(new Error(`Request "${name}" timed out`))
            }, 30_000)

            this.pending.set(id, {
                resolve: resolve as (d: unknown) => void,
                reject,
                timer
            })
        })

        this.ws.send(JSON.stringify({ name, data, id }))
        return promise
    }

    /** Fire-and-forget */
    sendNoWait(name: string, data: unknown = undefined): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error("WebSocket not connected")
        }
        const id = randomUUID()
        this.ws.send(JSON.stringify({ name, data, id }))
    }

    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
        if (this.ws) {
            this.ws.removeAllListeners()
            this.ws.close()
            this.ws = null
        }
        this._connected = false
    }

    // -----------------------------------------------------------------------
    // Internal
    // -----------------------------------------------------------------------

    private subscribers = new Set<(state: PollState) => void>()

    public subscribe(cb: (state: PollState) => void) {
        this.subscribers.add(cb)
        return () => this.subscribers.delete(cb)
    }

    private emitState() {
        for (const cb of this.subscribers) {
            try {
                cb(this.poll)
            } catch {
                // Ignore subscriber errors
            }
        }
    }

    private scheduleReconnect() {
        if (this.reconnectTimer) return
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null
            if (this.url) {
                this.connect(this.url).catch(() => {
                    // will retry on next schedule
                })
            }
        }, 3_000)
    }

    private handlePushEvent(msg: WSMsg) {
        let changed = false
        switch (msg.name) {
            case "progress":
                this.poll.progress = msg.data
                this.poll.isDownloading = true
                changed = true
                break
            case "finish":
                this.poll.progress = null
                this.poll.currentItem = null
                this.poll.isDownloading = false
                changed = true
                break
            case "queueChange":
                this.poll.queue = msg.data as unknown[]
                changed = true
                break
            case "current":
                this.poll.currentItem = msg.data ?? null
                if (msg.data) {
                    this.poll.isDownloading = true
                }
                changed = true
                break
        }

        if (changed) {
            this.emitState()
        }
    }
}

// ---------------------------------------------------------------------------
// Singletons — survive across API route invocations (same Node process)
// ---------------------------------------------------------------------------

export const publicBridge = new WSBridge()
export const privateBridge = new WSBridge()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BACKEND_HOST = process.env.BACKEND_HOST || "localhost:3000"

function wsProto() {
    // In production you might want wss, but for local dev it's always ws
    return "ws"
}

export function getPublicURL() {
    return `${wsProto()}://${BACKEND_HOST}/public`
}

export function getPrivateURL(password?: string) {
    const params = password ? `?password=${encodeURIComponent(password)}` : ""
    return `${wsProto()}://${BACKEND_HOST}/private${params}`
}
