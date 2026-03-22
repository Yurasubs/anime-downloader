"use client"

import Image from "next/image"
import { useAPI } from "@/lib/useAPI"
import { useAppStore } from "@/lib/store"
import { Play, Pause, Trash2, XCircle, ListOrdered, Download } from "lucide-react"
import type { QueueItem } from "@/types"

export default function QueuePanel() {
    const queue = useAppStore(s => s.queue)
    const queueRunning = useAppStore(s => s.queueRunning)
    const { setDownloadQueue, removeFromQueue, clearQueue } = useAPI()

    return (
        <div className="space-y-4">
            {/* Queue controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <ListOrdered className="w-5 h-5 text-primary" />
                        Download Queue
                    </h2>
                    <span className="text-sm text-muted">
                        {queue.length} item{queue.length !== 1 ? "s" : ""}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setDownloadQueue(!queueRunning)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            queueRunning
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
                                : "bg-success/10 text-success border border-success/30 hover:bg-success/20"
                        }`}
                    >
                        {queueRunning ? (
                            <>
                                <Pause className="w-4 h-4" />
                                Pause Queue
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                Start Queue
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => clearQueue()}
                        disabled={queue.length === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted hover:text-danger hover:border-danger/30 hover:bg-danger/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <Trash2 className="w-4 h-4" />
                        Clear
                    </button>
                </div>
            </div>

            {/* Queue list */}
            {queue.length === 0 ? (
                <div className="text-center py-20">
                    <Download className="w-16 h-16 mx-auto mb-4 text-muted/20" />
                    <h3 className="text-lg font-medium text-muted/50 mb-2">Queue is empty</h3>
                    <p className="text-sm text-muted/30">Search for anime and add episodes to start downloading</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {queue.map((item, idx) => (
                        <QueueItemCard
                            key={`${item.id}-${item.e}-${idx}`}
                            item={item}
                            index={idx}
                            onRemove={() => removeFromQueue(idx)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

function QueueItemCard({ item, index, onRemove }: { item: QueueItem; index: number; onRemove: () => void }) {
    return (
        <div className="group flex items-center gap-4 bg-surface border border-border rounded-xl p-3 hover:border-border/80 transition-all">
            {/* Index */}
            <span className="text-xs font-mono text-muted/50 w-6 text-right flex-shrink-0">{index + 1}</span>

            {/* Thumbnail */}
            {item.image ? (
                <div className="relative w-28 aspect-video flex-shrink-0 rounded-md shadow-sm overflow-hidden bg-background">
                    <Image
                        src={item.image}
                        alt={item.title || "Queue thumbnail"}
                        fill
                        className="object-cover"
                        sizes="112px"
                    />
                </div>
            ) : (
                <div className="w-28 aspect-video rounded-md shadow-sm bg-background flex-shrink-0 flex items-center justify-center">
                    <Download className="w-6 h-6 text-muted/30" />
                </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground truncate">{item.parent?.title || item.title}</h3>
                <p className="text-xs text-muted truncate mt-0.5">
                    {item.title} &mdash; Episode {item.episode}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {item.dubLang?.map(lang => (
                        <span
                            key={lang}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase"
                        >
                            {lang}
                        </span>
                    ))}
                    {item.q > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-background text-muted">{item.q}p</span>
                    )}
                    {item.q === 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-background text-muted">Best</span>
                    )}
                    {item.dlsubs?.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-background text-muted">
                            Subs: {item.dlsubs.join(", ")}
                        </span>
                    )}
                </div>
            </div>

            {/* Remove */}
            <button
                onClick={onRemove}
                className="p-2 rounded-lg text-muted/30 hover:text-danger hover:bg-danger/10 transition-all opacity-0 group-hover:opacity-100"
                title="Remove from queue"
            >
                <XCircle className="w-4 h-4" />
            </button>
        </div>
    )
}
