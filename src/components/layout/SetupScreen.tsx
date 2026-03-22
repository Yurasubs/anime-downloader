"use client"

import { useState, FormEvent } from "react"
import { useAPI } from "@/lib/useAPI"
import { useAppStore } from "@/lib/store"
import { Settings, Loader2 } from "lucide-react"

export default function SetupScreen() {
    const [port, setPort] = useState("3000")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const { setupServer } = useAPI()
    const addNotification = useAppStore(s => s.addNotification)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await setupServer({
                port: parseInt(port) || 3000,
                password: password || undefined
            })
            addNotification("Server configured. Please restart the server.", "success")
        } catch {
            addNotification("Failed to configure server", "error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 mb-4">
                        <Settings className="w-8 h-8 text-accent" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Initial Setup</h1>
                    <p className="text-muted mt-2">Configure your AniDL server</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-6 space-y-4">
                    <div>
                        <label htmlFor="port" className="block text-sm font-medium text-muted mb-2">
                            Port
                        </label>
                        <input
                            id="port"
                            type="number"
                            value={port}
                            onChange={e => setPort(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        />
                    </div>
                    <div>
                        <label htmlFor="setup-password" className="block text-sm font-medium text-muted mb-2">
                            Password <span className="text-muted/50">(recommended)</span>
                        </label>
                        <input
                            id="setup-password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Leave blank for no password"
                            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save & Restart"
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
