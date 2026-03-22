"use client"

import { useAPI } from "@/lib/useAPI"
import { useAppStore } from "@/lib/store"
import type { ServiceType } from "@/types"

const services: { id: ServiceType; name: string; description: string; color: string; logo: string }[] = [
    {
        id: "crunchy",
        name: "Crunchyroll",
        description: "The world's largest anime streaming platform",
        color: "from-orange-500/20 to-orange-600/5 border-orange-500/30 hover:border-orange-400/50",
        logo: "CR"
    },
    {
        id: "hidive",
        name: "HIDIVE",
        description: "Exclusive anime and live-action titles",
        color: "from-cyan-500/20 to-cyan-600/5 border-cyan-500/30 hover:border-cyan-400/50",
        logo: "HI"
    },
    {
        id: "adn",
        name: "ADN",
        description: "Animation Digital Network (FR/DE)",
        color: "from-blue-500/20 to-blue-600/5 border-blue-500/30 hover:border-blue-400/50",
        logo: "AD"
    }
]

export default function ServiceSelect() {
    const { selectService } = useAPI()
    const version = useAppStore(s => s.version)
    const addNotification = useAppStore(s => s.addNotification)

    const handleSelect = async (service: ServiceType) => {
        try {
            await selectService(service)
        } catch {
            addNotification("Failed to select service", "error")
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold tracking-tight mb-2">AniDL</h1>
                    <p className="text-muted">Select a streaming service to get started</p>
                    {version && <p className="text-xs text-muted/50 mt-2">v{version}</p>}
                </div>

                <div className="grid gap-4">
                    {services.map(service => (
                        <button
                            key={service.id}
                            onClick={() => handleSelect(service.id)}
                            className={`group flex items-center gap-5 bg-gradient-to-r ${service.color} border rounded-xl p-5 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]`}
                        >
                            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-background/50 flex items-center justify-center text-lg font-bold tracking-tight">
                                {service.logo}
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-foreground group-hover:text-white transition-colors">
                                    {service.name}
                                </h2>
                                <p className="text-sm text-muted">{service.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
