import React from "react"
import { Download, FileText, Check, CheckCheck, Star } from "lucide-react"

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
    const ext = (name.split(".").pop() || "FILE").toUpperCase()
    const isPdf = ext === "PDF"
    const formattedSize = formatBytes(size)

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation()
        const link = document.createElement("a")
        link.href = url
        link.download = name
        link.target = "_blank"
        link.rel = "noopener noreferrer"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div
            className={`w-72 sm:w-80 p-3 rounded-2xl shadow-xs transition-all ${
                isMine
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs shadow-purple-600/15"
                    : "bg-white dark:bg-[#1a233a] text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-slate-800 rounded-tl-xs"
            }`}
        >
            <div className="flex items-center gap-3">
                {/* File format badge */}
                <div
                    className={`h-11 w-11 shrink-0 rounded-xl flex flex-col items-center justify-center font-black shadow-sm ${
                        isPdf
                            ? "bg-rose-500 text-white shadow-rose-500/30"
                            : "bg-indigo-500 text-white shadow-indigo-500/30"
                    }`}
                >
                    <FileText size={18} className="stroke-[2.5]" />
                    <span className="text-[9px] tracking-wider uppercase font-black -mt-0.5">
                        {ext.slice(0, 4)}
                    </span>
                </div>

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
                        className={`text-[11px] mt-0.5 font-medium ${
                            isMine ? "text-purple-200/90" : "text-slate-400 dark:text-slate-400"
                        }`}
                    >
                        {formattedSize} • {ext}
                    </p>
                </div>

                {/* Download button */}
                <button
                    type="button"
                    onClick={handleDownload}
                    className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isMine
                            ? "bg-white/20 hover:bg-white/30 text-white active:scale-95"
                            : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 active:scale-95"
                    }`}
                    title={`Download ${name}`}
                >
                    <Download size={16} className="stroke-[2.2]" />
                </button>
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
    )
}

export default DocumentCard
