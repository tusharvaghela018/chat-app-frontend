import React, { useState } from "react"
import { Check, CheckCheck, Star, Download, X, ZoomIn, ZoomOut, Maximize2, Loader2 } from "lucide-react"

interface ImageBubbleProps {
    url: string
    name?: string
    size?: number
    isMine: boolean
    createdAt: string
    isSeen?: boolean
    isPending?: boolean
    isStarred?: boolean
}

export const ImageBubble: React.FC<ImageBubbleProps> = ({
    url,
    name = "Photo",
    isMine,
    createdAt,
    isSeen,
    isPending,
    isStarred = false,
}) => {
    const [isLoaded, setIsLoaded] = useState(false)
    const [hasError, setHasError] = useState(false)
    const [isLightboxOpen, setIsLightboxOpen] = useState(false)
    const [zoomLevel, setZoomLevel] = useState(1)
    const [isDownloading, setIsDownloading] = useState(false)

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (isDownloading) return

        setIsDownloading(true)
        try {
            const response = await fetch(url)
            const blob = await response.blob()
            const blobUrl = window.URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = blobUrl
            link.download = name || `photo_${Date.now()}.jpg`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(blobUrl)
        } catch (err) {
            console.error("Image download failed:", err)
            const link = document.createElement("a")
            link.href = url
            link.download = name
            link.target = "_blank"
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } finally {
            setIsDownloading(false)
        }
    }

    const openLightbox = () => {
        setZoomLevel(1)
        setIsLightboxOpen(true)
    }

    const closeLightbox = () => {
        setIsLightboxOpen(false)
        setZoomLevel(1)
    }

    return (
        <>
            {/* WhatsApp style Photo bubble */}
            <div
                onClick={openLightbox}
                className={`relative group cursor-pointer overflow-hidden rounded-2xl shadow-sm max-w-[280px] sm:max-w-[340px] border ${
                    isMine
                        ? "border-purple-500/20 rounded-br-xs"
                        : "border-slate-200/90 dark:border-slate-800 rounded-tl-xs"
                } bg-slate-100 dark:bg-slate-900`}
            >
                {/* Shimmer skeleton before image loads */}
                {!isLoaded && !hasError && (
                    <div className="w-64 h-52 sm:w-80 sm:h-64 flex items-center justify-center bg-slate-200 dark:bg-slate-800 animate-pulse">
                        <Loader2 size={24} className="animate-spin text-purple-600/60" />
                    </div>
                )}

                {/* Error fallback */}
                {hasError && (
                    <div className="w-64 h-36 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/80 p-4 text-center">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Failed to load image</p>
                    </div>
                )}

                {/* Actual image */}
                <img
                    src={url}
                    alt={name}
                    onLoad={() => setIsLoaded(true)}
                    onError={() => {
                        setIsLoaded(true)
                        setHasError(true)
                    }}
                    className={`w-full max-h-[380px] object-cover transition-transform duration-300 group-hover:scale-[1.02] ${
                        !isLoaded ? "hidden" : "block"
                    }`}
                />

                {/* Hover overlay zoom hint */}
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <div className="p-2 rounded-full bg-black/40 text-white backdrop-blur-xs">
                        <Maximize2 size={16} />
                    </div>
                </div>

                {/* WhatsApp-style bottom dark vignette overlay with timestamp, star & status */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-6 pb-1.5 px-3 flex items-center justify-end gap-1.5 text-[11px] tabular-nums text-white/95 font-medium select-none">
                    <span className="drop-shadow-xs">
                        {new Date(createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                    {isStarred && (
                        <Star size={11} className="fill-amber-400 text-amber-400 inline shrink-0 drop-shadow-xs" />
                    )}
                    {isMine && (
                        <span className="ml-0.5 drop-shadow-xs">
                            {isPending ? (
                                <span className="inline-block animate-pulse text-[9px] text-white">●</span>
                            ) : isSeen ? (
                                <CheckCheck size={14} className="inline text-sky-400" />
                            ) : (
                                <Check size={14} className="inline text-white/90" />
                            )}
                        </span>
                    )}
                </div>
            </div>

            {/* Lightbox Fullscreen Modal */}
            {isLightboxOpen && (
                <div
                    onClick={closeLightbox}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
                >
                    {/* Top action bar */}
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-0 inset-x-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent text-white z-20"
                    >
                        <p className="text-sm font-semibold truncate max-w-xs sm:max-w-md">{name}</p>
                        <div className="flex items-center gap-2">
                            {/* Zoom controls */}
                            <button
                                type="button"
                                onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.25))}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                                title="Zoom Out"
                            >
                                <ZoomOut size={18} />
                            </button>
                            <span className="text-xs font-mono">{Math.round(zoomLevel * 100)}%</span>
                            <button
                                type="button"
                                onClick={() => setZoomLevel((prev) => Math.min(3, prev + 0.25))}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                                title="Zoom In"
                            >
                                <ZoomIn size={18} />
                            </button>

                            {/* Direct Download button */}
                            <button
                                type="button"
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors ml-1"
                                title="Download photo"
                            >
                                {isDownloading ? (
                                    <Loader2 size={18} className="animate-spin text-purple-400" />
                                ) : (
                                    <Download size={18} />
                                )}
                            </button>

                            {/* Close button */}
                            <button
                                type="button"
                                onClick={closeLightbox}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors ml-2"
                                title="Close (Esc)"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Image display */}
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-[90vw] max-h-[85vh] overflow-auto flex items-center justify-center p-4 transition-transform duration-200"
                    >
                        <img
                            src={url}
                            alt={name}
                            style={{ transform: `scale(${zoomLevel})` }}
                            className="max-h-[80vh] max-w-[85vw] object-contain rounded-lg shadow-2xl transition-transform duration-150 select-none cursor-default"
                        />
                    </div>
                </div>
            )}
        </>
    )
}

export default ImageBubble
