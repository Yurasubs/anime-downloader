"use client"

import { useState, useEffect, useCallback } from "react"
import { useAPI } from "@/lib/useAPI"
import yaml from "yaml"
import {
    Save,
    RotateCcw,
    FolderOpen,
    Settings2,
    HardDrive,
    FileText,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Info
} from "lucide-react"

type ConfigState = {
    "cli-defaults": Record<string, unknown>
    "dir-path": Record<string, unknown>
    "bin-path": Record<string, unknown>
}

const FILENAME_VARS = [
    { var: "${title}", desc: "Episode title" },
    { var: "${episode}", desc: "Episode number" },
    { var: "${showTitle}", desc: "Show title" },
    { var: "${seriesTitle}", desc: "Series title (alias)" },
    { var: "${season}", desc: "Season number" },
    { var: "${height}", desc: "Video height (e.g. 1080)" },
    { var: "${width}", desc: "Video width" },
    { var: "${service}", desc: "Service name (CR/HI/ADN)" }
]

async function fetchConfig(name: string): Promise<string> {
    const res = await fetch(`/api/config?name=${name}`)
    const data = await res.json()
    return data.content || ""
}

async function saveConfig(name: string, content: string): Promise<boolean> {
    const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, content })
    })
    const data = await res.json()
    return !!data.ok
}

export default function SettingsPanel() {
    const { openFolder } = useAPI()
    const [configs, setConfigs] = useState<ConfigState>({
        "cli-defaults": {},
        "dir-path": {},
        "bin-path": {}
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [saveStatus, setSaveStatus] = useState<{
        type: "success" | "error"
        message: string
    } | null>(null)
    const [activeSection, setActiveSection] = useState<"cli-defaults" | "dir-path" | "bin-path">("cli-defaults")

    const loadConfigs = useCallback(async () => {
        setLoading(true)
        try {
            const [cliRaw, dirRaw, binRaw] = await Promise.all([
                fetchConfig("cli-defaults"),
                fetchConfig("dir-path"),
                fetchConfig("bin-path")
            ])
            setConfigs({
                "cli-defaults": cliRaw ? yaml.parse(cliRaw) || {} : {},
                "dir-path": dirRaw ? yaml.parse(dirRaw) || {} : {},
                "bin-path": binRaw ? yaml.parse(binRaw) || {} : {}
            })
        } catch {
            setSaveStatus({ type: "error", message: "Failed to load config" })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadConfigs()
    }, [loadConfigs])

    const updateValue = (configName: keyof ConfigState, key: string, value: unknown) => {
        setConfigs(prev => ({
            ...prev,
            [configName]: { ...prev[configName], [key]: value }
        }))
    }

    const handleSave = async (configName: keyof ConfigState) => {
        setSaving(configName)
        setSaveStatus(null)
        try {
            const content = yaml.stringify(configs[configName])
            const ok = await saveConfig(configName, content)
            setSaveStatus(
                ok
                    ? { type: "success", message: `${configName}.yml saved!` }
                    : { type: "error", message: `Failed to save ${configName}.yml` }
            )
        } catch {
            setSaveStatus({ type: "error", message: `Error saving ${configName}.yml` })
        } finally {
            setSaving(null)
            setTimeout(() => setSaveStatus(null), 3000)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-muted">Loading configuration...</span>
            </div>
        )
    }

    const cli = configs["cli-defaults"] as Record<string, unknown>
    const dir = configs["dir-path"] as Record<string, unknown>
    const bin = configs["bin-path"] as Record<string, unknown>

    const sections = [
        {
            id: "cli-defaults" as const,
            label: "Advanced Options",
            icon: Settings2
        },
        { id: "dir-path" as const, label: "Output Paths", icon: FolderOpen },
        { id: "bin-path" as const, label: "Binary Paths", icon: HardDrive }
    ]

    return (
        <div className="space-y-4">
            {/* Status toast */}
            {saveStatus && (
                <div
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                        saveStatus.type === "success"
                            ? "bg-success/10 text-success border border-success/20"
                            : "bg-error/10 text-error border border-error/20"
                    }`}
                >
                    {saveStatus.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4" />
                    ) : (
                        <AlertCircle className="w-4 h-4" />
                    )}
                    {saveStatus.message}
                </div>
            )}

            {/* Section tabs */}
            <div className="flex gap-2 flex-wrap">
                {sections.map(s => {
                    const Icon = s.icon
                    return (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                activeSection === s.id
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-surface text-muted hover:text-foreground hover:bg-surface-hover border border-border"
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {s.label}
                        </button>
                    )
                })}

                {/* Reload button */}
                <button
                    onClick={loadConfigs}
                    className="ml-auto flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted hover:text-foreground bg-surface hover:bg-surface-hover border border-border transition-all"
                >
                    <RotateCcw className="w-4 h-4" />
                    Reload
                </button>
            </div>

            {/* Content */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-5">
                {activeSection === "cli-defaults" && (
                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">Advanced Options</h3>
                                <p className="text-sm text-muted">
                                    Configure cli-defaults.yml — download behavior & filename template
                                </p>
                            </div>
                            <button
                                onClick={() => handleSave("cli-defaults")}
                                disabled={saving === "cli-defaults"}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
                            >
                                {saving === "cli-defaults" ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Save
                            </button>
                        </div>

                        {/* Filename template */}
                        <div className="space-y-2">
                            <label htmlFor="fileNameConfig" className="text-sm font-medium flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-primary" />
                                Filename Template
                            </label>
                            <input
                                id="fileNameConfig"
                                type="text"
                                value={(cli.fileName as string) || ""}
                                onChange={e => updateValue("cli-defaults", "fileName", e.target.value)}
                                placeholder="[${service}] ${showTitle} - S${season}E${episode} [${height}p]"
                                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                            />
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {FILENAME_VARS.map(v => (
                                    <button
                                        key={v.var}
                                        onClick={() =>
                                            updateValue(
                                                "cli-defaults",
                                                "fileName",
                                                ((cli.fileName as string) || "") + v.var
                                            )
                                        }
                                        className="px-2 py-0.5 text-xs rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-mono"
                                        title={v.desc}
                                    >
                                        {v.var}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-muted flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                Click a variable to append it. Use path separators to create folders.
                            </p>
                        </div>

                        {/* Grid of settings */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Quality */}
                            <SettingField label="Quality" description="0 = best available">
                                <input
                                    type="number"
                                    min={0}
                                    value={(cli.q as number) ?? 0}
                                    onChange={e => updateValue("cli-defaults", "q", parseInt(e.target.value) || 0)}
                                    className="setting-input"
                                />
                            </SettingField>

                            {/* Server */}
                            <SettingField label="Server" description="Server number to use">
                                <select
                                    value={(cli.server as number) ?? 1}
                                    onChange={e => updateValue("cli-defaults", "server", parseInt(e.target.value))}
                                    className="setting-input"
                                >
                                    {[1, 2, 3, 4].map(n => (
                                        <option key={n} value={n}>
                                            Server {n}
                                        </option>
                                    ))}
                                </select>
                            </SettingField>

                            {/* Part size */}
                            <SettingField label="Part Size" description="Concurrent download parts">
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={(cli.partsize as number) ?? 10}
                                    onChange={e =>
                                        updateValue("cli-defaults", "partsize", parseInt(e.target.value) || 10)
                                    }
                                    className="setting-input"
                                />
                            </SettingField>

                            {/* Dub languages */}
                            <SettingField label="Dub Languages" description="Comma-separated codes, e.g. jpn,eng">
                                <input
                                    type="text"
                                    value={
                                        Array.isArray(cli.dubLang)
                                            ? (cli.dubLang as string[]).join(",")
                                            : (cli.dubLang as string) || ""
                                    }
                                    onChange={e =>
                                        updateValue(
                                            "cli-defaults",
                                            "dubLang",
                                            e.target.value
                                                .split(",")
                                                .map(s => s.trim())
                                                .filter(Boolean)
                                        )
                                    }
                                    placeholder="jpn"
                                    className="setting-input"
                                />
                            </SettingField>

                            {/* Subtitle languages */}
                            <SettingField label="Subtitle Languages" description="Comma-separated codes">
                                <input
                                    type="text"
                                    value={
                                        Array.isArray(cli.dlsubs)
                                            ? (cli.dlsubs as string[]).join(",")
                                            : (cli.dlsubs as string) || ""
                                    }
                                    onChange={e =>
                                        updateValue(
                                            "cli-defaults",
                                            "dlsubs",
                                            e.target.value
                                                .split(",")
                                                .map(s => s.trim())
                                                .filter(Boolean)
                                        )
                                    }
                                    placeholder="all"
                                    className="setting-input"
                                />
                            </SettingField>

                            {/* Default Audio */}
                            <SettingField label="Default Audio" description="Default audio language">
                                <input
                                    type="text"
                                    value={(cli.defaultAudio as string) || ""}
                                    onChange={e => updateValue("cli-defaults", "defaultAudio", e.target.value)}
                                    placeholder="jpn"
                                    className="setting-input"
                                />
                            </SettingField>
                        </div>

                        {/* Toggle settings */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            <ToggleSetting
                                label="Mux as MP4"
                                checked={!!cli.mp4}
                                onChange={v => updateValue("cli-defaults", "mp4", v)}
                            />
                            <ToggleSetting
                                label="Keep temp files"
                                checked={!!cli.nocleanup}
                                onChange={v => updateValue("cli-defaults", "nocleanup", v)}
                            />
                            <ToggleSetting
                                label="Download video once"
                                checked={!!cli.dlVideoOnce}
                                onChange={v => updateValue("cli-defaults", "dlVideoOnce", v)}
                            />
                            <ToggleSetting
                                label="Keep all videos"
                                checked={!!cli.keepAllVideos}
                                onChange={v => updateValue("cli-defaults", "keepAllVideos", v)}
                            />
                        </div>
                    </div>
                )}

                {activeSection === "dir-path" && (
                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">Output Paths</h3>
                                <p className="text-sm text-muted">
                                    Configure dir-path.yml — where downloads and assets are stored
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openFolder("content")}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted hover:text-foreground bg-background hover:bg-surface-hover border border-border transition-all"
                                >
                                    <FolderOpen className="w-4 h-4" />
                                    Open folder
                                </button>
                                <button
                                    onClick={() => handleSave("dir-path")}
                                    disabled={saving === "dir-path"}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
                                >
                                    {saving === "dir-path" ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Save
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <SettingField
                                label="Download Output"
                                description="Where downloaded videos are saved. Use ${wdir} for working directory."
                            >
                                <input
                                    type="text"
                                    value={(dir.content as string) || ""}
                                    onChange={e => updateValue("dir-path", "content", e.target.value)}
                                    placeholder="${wdir}/videos/"
                                    className="setting-input font-mono"
                                />
                            </SettingField>

                            <SettingField label="Fonts Directory" description="Where subtitle fonts are stored">
                                <input
                                    type="text"
                                    value={(dir.fonts as string) || ""}
                                    onChange={e => updateValue("dir-path", "fonts", e.target.value)}
                                    placeholder="${wdir}/fonts/"
                                    className="setting-input font-mono"
                                />
                            </SettingField>
                        </div>
                    </div>
                )}

                {activeSection === "bin-path" && (
                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">Binary Paths</h3>
                                <p className="text-sm text-muted">Configure bin-path.yml — paths to external tools</p>
                            </div>
                            <button
                                onClick={() => handleSave("bin-path")}
                                disabled={saving === "bin-path"}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
                            >
                                {saving === "bin-path" ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Save
                            </button>
                        </div>

                        <div className="space-y-4">
                            {[
                                { key: "ffmpeg", label: "FFmpeg", ph: "ffmpeg" },
                                { key: "mkvmerge", label: "MKVMerge", ph: "mkvmerge" },
                                {
                                    key: "mp4decrypt",
                                    label: "MP4 Decrypt",
                                    ph: "mp4decrypt"
                                },
                                {
                                    key: "shaka",
                                    label: "Shaka Packager",
                                    ph: "shaka-packager"
                                }
                            ].map(b => (
                                <SettingField key={b.key} label={b.label} description={`Path to ${b.label} executable`}>
                                    <input
                                        type="text"
                                        value={(bin[b.key] as string) || ""}
                                        onChange={e => updateValue("bin-path", b.key, e.target.value)}
                                        placeholder={b.ph}
                                        className="setting-input font-mono"
                                    />
                                </SettingField>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

/* ─── Sub-components ─── */

function SettingField({
    label,
    description,
    children
}: {
    label: string
    description?: string
    children: React.ReactNode
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium">{label}</label>
            {description && <p className="text-xs text-muted">{description}</p>}
            {children}
        </div>
    )
}

function ToggleSetting({
    label,
    checked,
    onChange
}: {
    label: string
    checked: boolean
    onChange: (v: boolean) => void
}) {
    return (
        <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-background border border-border hover:bg-surface-hover transition-colors cursor-pointer">
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                    checked ? "bg-primary" : "bg-border"
                }`}
            >
                <span
                    className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform mt-0.5 ${
                        checked ? "translate-x-4 ml-0.5" : "translate-x-0.5"
                    }`}
                />
            </button>
            <span className="text-sm">{label}</span>
        </label>
    )
}
