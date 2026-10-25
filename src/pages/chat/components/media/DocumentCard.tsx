import React, { useState } from "react"
import {
    Download,
    FileText,
    Check,
    CheckCheck,
    Star,
    Loader2,
    Eye,
    FileSpreadsheet,
    FileCode,
    FileArchive,
} from "lucide-react"

import axiosInstance from "@/api/axios"
import DocumentViewerModal from "@/pages/chat/components/media/DocumentViewerModal"

export const formatBytes = (bytes: number, decimals = 1): string => {
    if (!bytes || bytes === 0) return "0 B"
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

interface DocumentCardProps {
    url: string
    name: string
    size?: number
    isMine: boolean
    createdAt: string
    isSeen?: boolean
    isPending?: boolean
    isStarred?: boolean
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
    url,
    name,
    size = 0,
    isMine,
    createdAt,
    isSeen,
    isPending,
    isStarred = false,
}) => {
    const [isDownloading, setIsDownloading] = useState(false)
    const [isViewerOpen, setIsViewerOpen] = useState(false)

    const ext = (name.split(".").pop() || "FILE").toUpperCase()
    const isPdf = ext === "PDF"
    const isText = ["TXT", "JSON", "CSV", "MD", "LOG", "JS", "TS", "HTML", "CSS", "XML", "PY", "SQL", "ENV"].includes(ext)
    const isArchive = ["ZIP", "RAR", "7Z", "TAR", "GZ"].includes(ext)
    // Non-zip files support inline preview modal
    const isViewable = !isArchive

    const formattedSize = formatBytes(size)

    const handleDownload = async (e?: React.MouseEvent) => {
        if (e && e.stopPropagation) e.stopPropagation()
        if (isDownloading) return

        setIsDownloading(true)
        try {
            // 1. Download via backend proxy (solves Cloudinary 401 & CORS)
            const response = await axiosInstance.get("/upload/download", {
                params: { url, name },
                responseType: "blob",
            })
            const blob = new Blob([response.data], {
                type: response.headers["content-type"] || "application/octet-stream",
            })
            const blobUrl = window.URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = blobUrl
            link.download = name || `document_${Date.now()}.${ext.toLowerCase()}`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(blobUrl)
        } catch (proxyErr) {
            console.warn("Backend proxy blob download failed, falling back to direct proxy navigation:", proxyErr)
            // Direct browser navigation to our backend proxy endpoint which serves Content-Disposition: attachment
            const proxyDownloadUrl = `${axiosInstance.defaults.baseURL || ""}/upload/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`
            const link = document.createElement("a")
            link.href = proxyDownloadUrl
            link.download = name || `document_${Date.now()}.${ext.toLowerCase()}`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } finally {
            setIsDownloading(false)
        }
    }

    const handleCardClick = (e: React.MouseEvent) => {
        if (isViewable) {
            setIsViewerOpen(true)
        } else {
            handleDownload(e)
        }
    }

    const getBadgeInfo = () => {
        if (isPdf) {
            return {
                bg: "bg-rose-500 text-white shadow-rose-500/30",
                icon: <FileText size={18} className="stroke-[2.5]" />,
            }
        }
        if (["XLS", "XLSX"].includes(ext)) {
            return {
                bg: "bg-emerald-600 text-white shadow-emerald-600/30",
                icon: <FileSpreadsheet size={18} className="stroke-[2.5]" />,
            }
        }
        if (["PPT", "PPTX"].includes(ext)) {
            return {
                bg: "bg-amber-600 text-white shadow-amber-600/30",
                icon: <FileText size={18} className="stroke-[2.5]" />,
            }
        }
        if (["DOC", "DOCX"].includes(ext)) {
            return {
                bg: "bg-blue-600 text-white shadow-blue-600/30",
                icon: <FileText size={18} className="stroke-[2.5]" />,
            }
        }
        if (isText) {
            return {
                bg: "bg-indigo-600 text-white shadow-indigo-600/30",
                icon: <FileCode size={18} className="stroke-[2.5]" />,
            }
        }
        if (isArchive) {
            return {
                bg: "bg-purple-600 text-white shadow-purple-600/30",
                icon: <FileArchive size={18} className="stroke-[2.5]" />,
            }
        }
        return {
            bg: "bg-slate-600 text-white shadow-slate-600/30",
            icon: <FileText size={18} className="stroke-[2.5]" />,
        }
    }

    const badge = getBadgeInfo()

    return (
        <>
            <div
                onClick={handleCardClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        handleCardClick(e as any)
                    }
                }}
                className={`w-72 sm:w-84 p-3 rounded-2xl shadow-xs transition-all cursor-pointer select-none active:scale-[0.99] group ${
                    isMine
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs shadow-purple-600/15 hover:shadow-purple-600/30"
                        : "bg-white dark:bg-[#1a233a] text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-slate-800 rounded-tl-xs hover:border-purple-300 dark:hover:border-purple-700/50 shadow-sm"
                }`}
                title={isViewable ? `Click to preview ${name}` : `Click to download ${name}`}
            >
                <div className="flex items-center gap-3">
                    {/* File format badge matching mockup */}
                    {isPdf ? (
                        <div className="h-11 w-11 shrink-0 rounded-xl bg-red-600 text-white flex items-center justify-center font-extrabold text-sm lowercase tracking-tight shadow-sm shadow-red-600/30 group-hover:scale-105 transition-transform">
                            pdf
                        </div>
                    ) : (
                        <div
                            className={`h-11 w-11 shrink-0 rounded-xl flex flex-col items-center justify-center font-black shadow-sm transition-transform group-hover:scale-105 ${badge.bg}`}
                        >
                            {badge.icon}
                            <span className="text-[9px] tracking-wider uppercase font-black -mt-0.5">
                                {ext.slice(0, 4)}
                            </span>
                        </div>
                    )}

                    {/* File metadata */}
                    <div className="flex-1 min-w-0 pr-1">
                        <p
                            className={`text-xs sm:text-sm font-bold truncate leading-tight ${
                                isMine ? "text-white" : "text-slate-900 dark:text-slate-100"
                            }`}
                            title={name}
                        >
                            {name}
                        </p>
                        <p
                            className={`text-[11px] mt-0.5 font-medium flex items-center gap-1.5 ${
                                isMine ? "text-purple-200/90" : "text-slate-400 dark:text-slate-400"
                            }`}
                        >
                            <span>{formattedSize} • {ext}</span>
                            {isViewable && (
                                <span className={`text-[10px] font-semibold opacity-80 group-hover:opacity-100 flex items-center gap-0.5 ${
                                    isMine ? "text-purple-100" : "text-purple-600 dark:text-purple-400"
                                }`}>
                                    <Eye size={11} className="inline" /> View
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Direct Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                        {/* Eye / Preview button (for viewable documents) */}
                        {isViewable && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setIsViewerOpen(true)
                                }}
                                className={`h-8 w-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                    isMine
                                        ? "bg-white/15 hover:bg-white/25 text-white active:scale-95"
                                        : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 active:scale-95"
                                }`}
                                title={`Preview ${name}`}
                            >
                                <Eye size={15} />
                            </button>
                        )}

                        {/* Direct Download button */}
                        <button
                            type="button"
                            onClick={(e) => handleDownload(e)}
                            disabled={isDownloading}
                            className={`h-9 w-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                isMine
                                    ? "bg-white/20 hover:bg-white/30 text-white active:scale-95"
                                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 active:scale-95"
                            } disabled:opacity-50`}
                            title={`Download ${name}`}
                        >
                            {isDownloading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Download size={16} className="stroke-[2.2]" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Bottom timestamp + checkmark status */}
                <div
                    className={`flex items-center justify-end gap-1 mt-2 text-[10px] tabular-nums ${
                        isMine ? "text-purple-200/90" : "text-slate-400 dark:text-slate-500"
                    }`}
                >
                    <span>
                        {new Date(createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                    {isStarred && (
                        <Star size={10} className="fill-amber-400 text-amber-400 inline shrink-0" />
                    )}
                    {isMine && (
                        <span className="ml-0.5">
                            {isPending ? (
                                <span className="inline-block animate-pulse text-[9px]">●</span>
                            ) : isSeen ? (
                                <CheckCheck size={13} className="inline text-purple-200" />
                            ) : (
                                <Check size={13} className="inline text-purple-200" />
                            )}
                        </span>
                    )}
                </div>
            </div>

            {/* Inline Document Viewer Modal */}
            {isViewable && (
                <DocumentViewerModal
                    isOpen={isViewerOpen}
                    onClose={() => setIsViewerOpen(false)}
                    url={url}
                    name={name}
                    size={size}
                    onDownload={() => handleDownload()}
                    isDownloading={isDownloading}
                />
            )}
        </>
    )
}

export default DocumentCard
