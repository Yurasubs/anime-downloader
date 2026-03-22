"use client"

import { useEffect, useCallback, useRef } from "react"
import { useAppStore } from "@/lib/store"
import { fetchSetupStatus, fetchConnect, sendCommand } from "@/lib/api-client"
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
    ResolveItemsData
} from "@/types"

export function useAPI() {
    const setConnectionState = useAppStore(s => s.setConnectionState)
    const setVersion = useAppStore(s => s.setVersion)
    const setQueue = useAppStore(s => s.setQueue)
    const setIsDownloading = useAppStore(s => s.setIsDownloading)
    const setQueueRunning = useAppStore(s => s.setQueueRunning)
    const setService = useAppStore(s => s.setService)
    const setView = useAppStore(s => s.setView)
    const addNotification = useAppStore(s => s.addNotification)
    const setAvailableDubCodes = useAppStore(s => s.setAvailableDubCodes)
    const setAvailableSubCodes = useAppStore(s => s.setAvailableSubCodes)
    const setSearchResults = useAppStore(s => s.setSearchResults)
    const setEpisodes = useAppStore(s => s.setEpisodes)
    const setSelectedSeries = useAppStore(s => s.setSelectedSeries)
    const setIsAuthenticated = useAppStore(s => s.setIsAuthenticated)

    const eventSourceRef = useRef<EventSource | null>(null)

    // -------------------------------------------------------------------
    // Real-time updates via Server-Sent Events (SSE)
    // -------------------------------------------------------------------
    const startPolling = useCallback(() => {
        if (eventSourceRef.current) return // already listening

        const es = new EventSource("/api/ws/stream")
        eventSourceRef.current = es

        es.onmessage = event => {
            try {
                const state = JSON.parse(event.data)
                const appState = useAppStore.getState()

                appState.setCurrentProgress(state.progress as ExtendedProgress | null)
                appState.setCurrentItem(state.currentItem as QueueItem | null)
                appState.setQueue(state.queue as QueueItem[])
                appState.setIsDownloading(state.isDownloading)
                appState.setQueueRunning(state.queueRunning)
            } catch {
                // Silently ignore parse errors
            }
        }

        es.onerror = () => {
            // EventSource auto-reconnects natively; no action strongly required
        }
    }, [])

    const stopPolling = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close()
            eventSourceRef.current = null
        }
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopPolling()
        }
    }, [stopPolling])

    // -------------------------------------------------------------------
    // Connection flow
    // -------------------------------------------------------------------

    const connectPrivate = useCallback(
        async (password?: string) => {
            try {
                setConnectionState("connecting")
                const result = await fetchConnect(password)

                setConnectionState("connected")
                setVersion(result.version)
                setQueue(result.queue as QueueItem[])
                setIsDownloading(result.isDownloading)
                setQueueRunning(result.queueRunning)

                if (result.type) {
                    setService(result.type as ServiceType)
                    setView("main")
                } else {
                    setView("service-select")
                }

                // Start polling for real-time-ish updates
                startPolling()
            } catch {
                setConnectionState("disconnected")
                addNotification("Connection failed. Check your password.", "error")
            }
        },
        [
            startPolling,
            setConnectionState,
            setVersion,
            setQueue,
            setIsDownloading,
            setQueueRunning,
            setService,
            setView,
            addNotification
        ]
    )

    const checkSetup = useCallback(async () => {
        try {
            const { isSetup, requirePassword } = await fetchSetupStatus()

            if (!isSetup) {
                setView("setup")
                await connectPrivate()
                return
            }

            if (!requirePassword) {
                await connectPrivate()
            } else {
                setView("login")
            }
        } catch {
            addNotification("Unable to connect to server", "error")
        }
    }, [connectPrivate, setView, addNotification])

    // -------------------------------------------------------------------
    // API methods (same interface as the old useWebSocket)
    // -------------------------------------------------------------------

    const setupServer = useCallback(async (config: GUIConfig) => {
        return sendCommand<boolean>("setupServer", config)
    }, [])

    const selectService = useCallback(
        async (service: ServiceType) => {
            // 'setup' is fire-and-forget on the server
            await sendCommand("setup", service)
            setService(service)
            setView("main")
            // Small delay so the server has time to instantiate the service handler
            await new Promise(r => setTimeout(r, 500))
            // Load available language codes
            try {
                const dubCodes = await sendCommand<string[]>("availableDubCodes", undefined)
                setAvailableDubCodes(dubCodes)
                const subCodes = await sendCommand<string[]>("availableSubCodes", undefined)
                setAvailableSubCodes(subCodes)
            } catch {
                // Non-critical
            }
        },
        [setService, setView, setAvailableDubCodes, setAvailableSubCodes]
    )

    const authenticate = useCallback(async (data: AuthData): Promise<AuthResponse> => {
        return sendCommand<AuthResponse>("auth", data)
    }, [])

    const checkToken = useCallback(async () => {
        return sendCommand<AuthResponse>("checkToken", undefined)
    }, [])

    const search = useCallback(async (data: SearchData): Promise<SearchResponse> => {
        return sendCommand<SearchResponse>("search", data)
    }, [])

    const listEpisodes = useCallback(async (id: string): Promise<EpisodeListResponse> => {
        return sendCommand<EpisodeListResponse>("listEpisodes", id)
    }, [])

    const resolveItems = useCallback(async (data: ResolveItemsData): Promise<boolean> => {
        return sendCommand<boolean>("resolveItems", data)
    }, [])

    const getQueue = useCallback(async (): Promise<QueueItem[]> => {
        return sendCommand<QueueItem[]>("getQueue", undefined)
    }, [])

    const removeFromQueue = useCallback(async (index: number) => {
        return sendCommand("removeFromQueue", index)
    }, [])

    const clearQueue = useCallback(async () => {
        return sendCommand("clearQueue", undefined)
    }, [])

    const setDownloadQueue = useCallback(
        async (running: boolean) => {
            await sendCommand("setDownloadQueue", running)
            setQueueRunning(running)
        },
        [setQueueRunning]
    )

    const changeProvider = useCallback(async () => {
        const result = await sendCommand<boolean>("changeProvider", undefined)
        if (result) {
            setService(null)
            setView("service-select")
            setSearchResults([])
            setEpisodes([])
            setSelectedSeries(null)
            setIsAuthenticated(false)
        }
        return result
    }, [setService, setView, setSearchResults, setEpisodes, setSelectedSeries, setIsAuthenticated])

    const openFolder = useCallback(async (type: "content" | "config") => {
        return sendCommand("openFolder", type)
    }, [])

    const openFile = useCallback(async (data: [string, string]) => {
        return sendCommand("openFile", data)
    }, [])

    const openURL = useCallback(async (url: string) => {
        return sendCommand("openURL", url)
    }, [])

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
        openURL
    }
}
