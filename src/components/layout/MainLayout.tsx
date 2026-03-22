"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import Header from "@/components/layout/Header"
import SearchPanel from "@/components/search/SearchPanel"
import EpisodePanel from "@/components/search/EpisodePanel"
import QueuePanel from "@/components/queue/QueuePanel"
import DownloadProgress from "@/components/queue/DownloadProgress"
import SettingsPanel from "@/components/settings/SettingsPanel"

export type Tab = "search" | "queue" | "settings"

export default function MainLayout() {
    const [tab, setTab] = useState<Tab>("search")
    const selectedSeries = useAppStore(s => s.selectedSeries)

    return (
        <div className="min-h-screen flex flex-col">
            <Header activeTab={tab} onTabChange={setTab} />

            <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
                <DownloadProgress />

                {tab === "search" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <SearchPanel />
                        {selectedSeries && <EpisodePanel />}
                    </div>
                )}

                {tab === "queue" && <QueuePanel />}

                {tab === "settings" && <SettingsPanel />}
            </main>
        </div>
    )
}
