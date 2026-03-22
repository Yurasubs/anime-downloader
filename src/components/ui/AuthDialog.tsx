"use client"

import { useState, useEffect, FormEvent } from "react"
import { useAPI } from "@/lib/useAPI"
import { useAppStore } from "@/lib/store"
import { X, Loader2, User, CheckCircle } from "lucide-react"

export default function AuthDialog({ onClose }: { onClose: () => void }) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const { authenticate, checkToken } = useAPI()
    const addNotification = useAppStore(s => s.addNotification)
    const isAuthenticated = useAppStore(s => s.isAuthenticated)
    const setIsAuthenticated = useAppStore(s => s.setIsAuthenticated)
    const service = useAppStore(s => s.service)

    const serviceNames: Record<string, string> = {
        crunchy: "Crunchyroll",
        hidive: "HIDIVE",
        adn: "ADN"
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!username.trim() || !password.trim()) {
            addNotification("Please enter username and password", "error")
            return
        }
        setLoading(true)
        try {
            const result = await authenticate({ username, password })
            if (result.isOk) {
                setIsAuthenticated(true)
                addNotification("Successfully authenticated", "success")
                onClose()
            } else {
                addNotification(`Authentication failed: ${result.reason.message}`, "error")
            }
        } catch {
            addNotification("Authentication failed", "error")
        } finally {
            setLoading(false)
        }
    }

    const handleCheck = async () => {
        setLoading(true)
        try {
            const result = await checkToken()
            if (result.isOk) {
                setIsAuthenticated(true)
                addNotification("Token is valid", "success")
            } else {
                setIsAuthenticated(false)
                addNotification("Token expired or invalid", "error")
            }
        } catch {
            addNotification("Token check failed", "error")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [onClose])

    return (
        <div
            role="presentation"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                className="bg-surface border border-border rounded-xl p-6 w-full max-w-md shadow-2xl"
                onClick={e => e.stopPropagation()}
                onKeyDown={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">
                            {service ? `${serviceNames[service]} Login` : "Service Login"}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-muted hover:bg-surface-hover transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {isAuthenticated ? (
                    <div className="text-center py-4">
                        <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
                        <p className="text-foreground font-medium">Authenticated</p>
                        <p className="text-sm text-muted mt-1">Your session is active</p>
                        <button
                            onClick={handleCheck}
                            disabled={loading}
                            className="mt-4 text-sm text-primary hover:text-primary-light transition-colors disabled:opacity-50"
                        >
                            {loading ? "Checking..." : "Verify token"}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-muted mb-1.5">
                                Username / Email
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                // oxlint-disable-next-line jsx-a11y/no-autofocus
                                autoFocus
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-muted mb-1.5">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Sign In
                            </button>
                            <button
                                type="button"
                                onClick={handleCheck}
                                disabled={loading}
                                className="px-4 py-2 border border-border rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all disabled:opacity-50"
                            >
                                Check Token
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
