"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { useAPI } from "@/lib/useAPI"
import { useAppStore } from "@/lib/store"
import { Loader2, Download, Check, ChevronDown, ChevronUp, X, Settings2 } from "lucide-react"
import type { Episode } from "@/types"

/** Map raw API language codes to short readable labels */
const LANG_LABELS: Record<string, string> = {
    // Dub codes (3-letter ISO 639-2/3)
    und: "UND",
    jpn: "JA",
    eng: "EN",
    spa: "ES",
    "spa-419": "ES-LA",
    "spa-es": "ES-ES",
    por: "PT",
    fra: "FR",
    deu: "DE",
    "ara-me": "AR-ME",
    ara: "AR",
    ita: "IT",
    rus: "RU",
    tur: "TR",
    hin: "HI",
    zho: "ZH",
    chi: "ZH",
    "zh-hk": "ZH-HK",
    kor: "KO",
    cat: "CA",
    pol: "PL",
    tha: "TH",
    tam: "TA",
    may: "MS",
    vie: "VI",
    ind: "ID",
    tel: "TE",
    // Subtitle locale codes (BCP-47 style)
    all: "All",
    none: "None",
    "en-us": "EN",
    "en-in": "EN-IN",
    "es-419": "ES-LA",
    "es-es": "ES-ES",
    "pt-br": "PT-BR",
    "pt-pt": "PT-PT",
    "fr-fr": "FR",
    "de-de": "DE",
    "ar-me": "AR",
    "ar-sa": "AR-SA",
    "it-it": "IT",
    "ru-ru": "RU",
    "tr-tr": "TR",
    "hi-in": "HI",
    "zh-cn": "ZH-CN",
    "zh-tw": "ZH-TW",
    "ko-kr": "KO",
    "ca-es": "CA",
    "pl-pl": "PL",
    "th-th": "TH",
    "ta-in": "TA",
    "ms-my": "MS",
    "vi-vn": "VI",
    "id-id": "ID",
    "te-in": "TE",
    "ja-jp": "JA"
}

function langLabel(code: string): string {
    return LANG_LABELS[code.toLowerCase()] ?? code.toUpperCase()
}

/** Deduplicate codes keeping insertion order, case-insensitive */
function dedupeCodes(codes: string[]): string[] {
    const seen = new Set<string>()
    return codes.filter(c => {
        const key = c.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

export default function EpisodePanel() {
    const selectedSeries = useAppStore(s => s.selectedSeries)
    const episodes = useAppStore(s => s.episodes)
    const setEpisodes = useAppStore(s => s.setEpisodes)
    const addNotification = useAppStore(s => s.addNotification)
    const downloadOptions = useAppStore(s => s.downloadOptions)
    const setDownloadOption = useAppStore(s => s.setDownloadOption)
    const availableDubCodes = useAppStore(s => s.availableDubCodes)
    const availableSubCodes = useAppStore(s => s.availableSubCodes)
    const { listEpisodes, resolveItems } = useAPI()

    const [loading, setLoading] = useState(false)
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [showOptions, setShowOptions] = useState(false)
    const [adding, setAdding] = useState(false)

    const loadEpisodes = useCallback(async () => {
        if (!selectedSeries) return
        setLoading(true)
        setSelected(new Set())
        try {
            const result = await listEpisodes(selectedSeries.id)
            if (result.isOk) {
                setEpisodes(result.value)
            } else {
                addNotification(`Failed to load episodes: ${result.reason.message}`, "error")
            }
        } catch {
            addNotification("Failed to load episodes", "error")
        } finally {
            setLoading(false)
        }
    }, [selectedSeries, listEpisodes, setEpisodes, addNotification])

    useEffect(() => {
        loadEpisodes()
    }, [loadEpisodes])

    const toggleEpisode = (e: string) => {
        setSelected(prev => {
            const next = new Set(prev)
            if (next.has(e)) next.delete(e)
            else next.add(e)
            return next
        })
    }

    const selectAll = () => {
        if (selected.size === episodes.length) {
            setSelected(new Set())
        } else {
            setSelected(new Set(episodes.map(ep => ep.e)))
        }
    }

    const handleAddToQueue = async () => {
        if (!selectedSeries) return

        const episodeSelector = selected.size === episodes.length ? "" : Array.from(selected).join(",")

        setAdding(true)
        try {
            await resolveItems({
                id: selectedSeries.id,
                e: episodeSelector,
                dubLang: downloadOptions.dubLang,
                dlsubs: downloadOptions.dlsubs,
                q: downloadOptions.q,
                fileName: downloadOptions.fileName || "[${service}] ${showTitle} - S${season}E${episode} [${height}p]",
                dlVideoOnce: downloadOptions.dlVideoOnce,
                all: selected.size === episodes.length,
                but: downloadOptions.but,
                novids: downloadOptions.novids,
                noaudio: downloadOptions.noaudio
            })
            addNotification(`Added ${selected.size} episode(s) to queue`, "success")
        } catch {
            addNotification("Failed to add to queue", "error")
        } finally {
            setAdding(false)
        }
    }

    const closePanel = () => {
        useAppStore.getState().setSelectedSeries(null)
        setEpisodes([])
    }

    // Build deduped language lists from API data
    const dubCodes = dedupeCodes(
        availableDubCodes.length > 0
            ? availableDubCodes
            : ["jpn", "eng", "spa", "por", "fra", "deu", "ita", "rus", "ara", "hin"]
    )
    const subCodes = dedupeCodes(
        availableSubCodes.length > 0
            ? ["all", "none", ...availableSubCodes.filter(c => c.toLowerCase() !== "all" && c.toLowerCase() !== "none")]
            : ["all", "none", "en-US", "es-419", "pt-BR", "fr-FR", "de-DE", "it-IT", "ru-RU", "ar-ME"]
    )

    // Group episodes by season
    const seasons = episodes.reduce<Record<string, Episode[]>>((acc, ep) => {
        const key = ep.seasonTitle || ep.season || "Episodes"
        if (!acc[key]) acc[key] = []
        acc[key].push(ep)
        return acc
    }, {})

    return (
        <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="p-4 border-b border-border flex-shrink-0">
                <div className="flex items-start gap-3">
                    {selectedSeries?.image && (
                        <div className="relative w-12 aspect-[2/3] flex-shrink-0 rounded-lg overflow-hidden">
                            <Image
                                src={selectedSeries.image}
                                alt={selectedSeries.name || ""}
                                fill
                                className="object-cover"
                                sizes="48px"
                            />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h2 className="font-semibold text-foreground truncate">{selectedSeries?.name}</h2>
                            <button
                                onClick={closePanel}
                                className="p-1 rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors flex-shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-sm text-muted">
                            {episodes.length} episodes {loading && "(loading...)"}
                        </p>
                    </div>
                </div>

                {/* Actions bar */}
                <div className="flex items-center gap-2 mt-3">
                    <button
                        onClick={selectAll}
                        className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted hover:text-foreground hover:bg-surface-hover transition-all"
                    >
                        {selected.size === episodes.length && episodes.length > 0 ? "Deselect All" : "Select All"}
                    </button>
                    <button
                        onClick={() => setShowOptions(!showOptions)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                            showOptions
                                ? "border-primary/30 text-primary bg-primary/5"
                                : "border-border text-muted hover:text-foreground hover:bg-surface-hover"
                        }`}
                    >
                        <Settings2 className="w-3 h-3" />
                        Options
                    </button>
                    <div className="flex-1" />
                    <button
                        onClick={handleAddToQueue}
                        disabled={selected.size === 0 || adding}
                        className="text-xs px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                        {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        Add to Queue ({selected.size})
                    </button>
                </div>
            </div>

            {/* Options */}
            {showOptions && (
                <div className="p-4 border-b border-border bg-background/50 space-y-3 flex-shrink-0">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="quality" className="block text-xs font-medium text-muted mb-1">
                                Quality
                            </label>
                            <select
                                id="quality"
                                value={downloadOptions.q}
                                onChange={e => setDownloadOption("q", parseInt(e.target.value))}
                                className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value={0}>Best</option>
                                <option value={1080}>1080p</option>
                                <option value={720}>720p</option>
                                <option value={480}>480p</option>
                                <option value={360}>360p</option>
                                <option value={240}>240p</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="fileName" className="block text-xs font-medium text-muted mb-1">
                                File Name
                            </label>
                            <input
                                id="fileName"
                                type="text"
                                value={downloadOptions.fileName}
                                onChange={e => setDownloadOption("fileName", e.target.value)}
                                placeholder="Default template"
                                className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="block text-xs font-medium text-muted mb-1">Dub Languages</div>
                        <div className="flex flex-wrap gap-1.5">
                            {dubCodes.map(code => (
                                <button
                                    key={code}
                                    type="button"
                                    onClick={() => {
                                        const current = downloadOptions.dubLang
                                        const updated = current.includes(code)
                                            ? current.filter(c => c !== code)
                                            : [...current, code]
                                        setDownloadOption("dubLang", updated.length > 0 ? updated : ["jpn"])
                                    }}
                                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                                        downloadOptions.dubLang.includes(code)
                                            ? "bg-primary text-white"
                                            : "bg-background border border-border text-muted hover:text-foreground"
                                    }`}
                                    title={code}
                                >
                                    {langLabel(code)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="block text-xs font-medium text-muted mb-1">Subtitle Languages</div>
                        <div className="flex flex-wrap gap-1.5">
                            {subCodes.map(code => {
                                const isAll = code.toLowerCase() === "all"
                                const isNone = code.toLowerCase() === "none"
                                return (
                                    <button
                                        key={code}
                                        type="button"
                                        onClick={() => {
                                            if (isAll) {
                                                setDownloadOption("dlsubs", ["all"])
                                                return
                                            }
                                            if (isNone) {
                                                setDownloadOption("dlsubs", ["none"])
                                                return
                                            }
                                            const current = downloadOptions.dlsubs.filter(
                                                c => c !== "all" && c !== "none"
                                            )
                                            const updated = current.includes(code)
                                                ? current.filter(c => c !== code)
                                                : [...current, code]
                                            setDownloadOption("dlsubs", updated.length > 0 ? updated : ["all"])
                                        }}
                                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                                            downloadOptions.dlsubs.includes(code) ||
                                            (isAll && downloadOptions.dlsubs.includes("all")) ||
                                            (isNone && downloadOptions.dlsubs.includes("none"))
                                                ? "bg-primary text-white"
                                                : "bg-background border border-border text-muted hover:text-foreground"
                                        }`}
                                        title={code}
                                    >
                                        {langLabel(code)}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        {[
                            { key: "dlVideoOnce" as const, label: "Download video once" },
                            { key: "novids" as const, label: "Skip video" },
                            { key: "noaudio" as const, label: "Skip audio" }
                        ].map(({ key, label }) => (
                            <label
                                key={key}
                                className="flex items-center gap-2 text-xs text-muted cursor-pointer hover:text-foreground transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={downloadOptions[key]}
                                    onChange={e => setDownloadOption(key, e.target.checked)}
                                    className="rounded border-border bg-background accent-primary"
                                />
                                {label}
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Episode list */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : (
                    Object.entries(seasons).map(([seasonName, seasonEps]) => (
                        <SeasonGroup
                            key={seasonName}
                            name={seasonName}
                            episodes={seasonEps}
                            selected={selected}
                            onToggle={toggleEpisode}
                        />
                    ))
                )}
            </div>
        </div>
    )
}

function SeasonGroup({
    name,
    episodes,
    selected,
    onToggle
}: {
    name: string
    episodes: Episode[]
    selected: Set<string>
    onToggle: (e: string) => void
}) {
    const [collapsed, setCollapsed] = useState(false)
    const selectedCount = episodes.filter(ep => selected.has(ep.e)).length

    return (
        <div>
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="w-full flex items-center justify-between px-4 py-2 bg-background/50 border-b border-border text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
                <span>
                    {name}
                    {selectedCount > 0 && <span className="ml-2 text-xs text-primary">({selectedCount} selected)</span>}
                </span>
                {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            {!collapsed &&
                episodes.map(ep => (
                    <EpisodeRow
                        key={ep.e}
                        episode={ep}
                        isSelected={selected.has(ep.e)}
                        onToggle={() => onToggle(ep.e)}
                    />
                ))}
        </div>
    )
}

function EpisodeRow({
    episode,
    isSelected,
    onToggle
}: {
    episode: Episode
    isSelected: boolean
    onToggle: () => void
}) {
    return (
        <button
            onClick={onToggle}
            className={`w-full flex items-center gap-3 px-4 py-2.5 border-b border-border/50 text-left transition-all ${
                isSelected
                    ? "bg-primary/5 border-l-2 border-l-primary"
                    : "hover:bg-surface-hover border-l-2 border-l-transparent"
            }`}
        >
            <div
                className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected ? "bg-primary text-white" : "border border-border bg-background"
                }`}
            >
                {isSelected && <Check className="w-3 h-3" />}
            </div>

            {episode.img && (
                <div className="relative w-20 h-12 flex-shrink-0 rounded overflow-hidden bg-background">
                    <Image src={episode.img} alt="" fill className="object-cover" sizes="80px" />
                </div>
            )}

            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                    <span className="text-xs font-mono text-primary">E{episode.episode}</span>
                    <span className="text-sm text-foreground truncate">{episode.name}</span>
                </div>
                {episode.description && <p className="text-xs text-muted line-clamp-1 mt-0.5">{episode.description}</p>}
                <div className="flex items-center gap-2 mt-1">
                    {episode.lang?.map(l => (
                        <span key={l} className="text-[9px] px-1 py-0.5 rounded bg-background text-muted uppercase">
                            {langLabel(l)}
                        </span>
                    ))}
                    {episode.time && <span className="text-[10px] text-muted/50">{episode.time}</span>}
                </div>
            </div>
        </button>
    )
}
