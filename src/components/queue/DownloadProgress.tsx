"use client"

import Image from "next/image"
import { useAppStore } from "@/lib/store"
import { Download, Loader2 } from "lucide-react"

export default function DownloadProgress() {
    const currentProgress = useAppStore(s => s.currentProgress)
    const currentItem = useAppStore(s => s.currentItem)
    const isDownloading = useAppStore(s => s.isDownloading)

    if (!isDownloading || !currentProgress) return null

    const { progress, downloadInfo } = currentProgress
    const percent = typeof progress.percent === "number" ? progress.percent : parseFloat(progress.percent) || 0

    const speedMB = (progress.downloadSpeed / 1024 / 1024).toFixed(1)
    const downloadedMB = (progress.bytes / 1024 / 1024).toFixed(1)

    return (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
            {/* Progress bar - top accent */}
            <div className="h-0.5 bg-background">
                <div
                    className="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-300"
                    style={{ width: `${percent}%` }}
                />
            </div>

            <div className="flex items-center gap-3 px-4 py-3">
                {/* Spinner */}
                <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />

                {/* Thumbnail */}
                {downloadInfo.image ? (
                    <div className="relative w-20 h-12 flex-shrink-0 rounded overflow-hidden bg-background">
                        <Image src={downloadInfo.image} alt="" fill className="object-cover" sizes="80px" />
                    </div>
                ) : (
                    <div className="w-20 h-12 rounded bg-background flex-shrink-0 flex items-center justify-center">
                        <Download className="w-4 h-4 text-muted/30" />
                    </div>
                )}

                {/* Info - matching episode listing style */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                        {currentItem?.episode && (
                            <span className="text-xs font-mono text-primary">E{currentItem.episode}</span>
                        )}
                        <span className="text-sm text-foreground truncate">{downloadInfo.title}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted truncate">{downloadInfo.parent?.title}</span>
                        {downloadInfo.language && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-background text-muted uppercase">
                                {downloadInfo.language.name || downloadInfo.language.code}
                            </span>
                        )}
                    </div>
                </div>

                {/* Stats - right side */}
                <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-mono text-foreground">{percent.toFixed(1)}%</div>
                    <div className="flex items-center gap-3 text-[11px] text-muted mt-0.5">
                        <span>
                            {progress.cur}/{progress.total}
                        </span>
                        <span>{downloadedMB} MB</span>
                        <span className="text-primary font-medium">{speedMB} MB/s</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
