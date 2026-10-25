import React, { useState, useEffect } from "react"
import {
    X,
    Download,
    ExternalLink,
    FileText,
    Copy,
    Check,
    Loader2,
    FileSpreadsheet,
    FileCode,
    FileArchive,
} from "lucide-react"
import axiosInstance from "@/api/axios"
import { formatBytes } from "@/pages/chat/components/media/DocumentCard"

interface DocumentViewerModalProps {
    isOpen: boolean
    onClose: () => void
    url: string
    name: string
    size?: number
    onDownload: () => void
    isDownloading?: boolean
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
    isOpen,
    onClose,
    url,
    name,
    size = 0,
    onDownload,
    isDownloading = false,
}) => {
    const [isLoading, setIsLoading] = useState(true)
    const [textContent, setTextContent] = useState<string | null>(null)
    const [isTextLoading, setIsTextLoading] = useState(false)
    const [isCopied, setIsCopied] = useState(false)

    const ext = (name.split(".").pop() || "FILE").toUpperCase()
    const isPdf = ext === "PDF"
    const isText = ["TXT", "JSON", "CSV", "MD", "LOG", "JS", "TS", "HTML", "CSS", "XML", "PY", "SQL", "ENV"].includes(ext)
    const isOffice = ["DOC", "DOCX", "XLS", "XLSX", "PPT", "PPTX"].includes(ext)
    const isArchive = ["ZIP", "RAR", "7Z", "TAR", "GZ"].includes(ext)

    // Base backend proxy URLs
    const apiBase = axiosInstance.defaults.baseURL || ""
    const inlineProxyUrl = `${apiBase}/upload/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}&inline=true`

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose()
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isOpen, onClose])

    // Reset loading states when modal opens
    useEffect(() => {
        if (isOpen) {
            setIsLoading(true)
            setTextContent(null)

            // If text file, fetch content to render in viewer
            if (isText) {
                setIsTextLoading(true)
                axiosInstance
                    .get("/upload/download", {
                        params: { url, name, inline: true },
                        responseType: "text",
                    })
                    .then((res) => {
                        setTextContent(typeof res.data === "string" ? res.data : JSON.stringify(res.data, null, 2))
                    })
                    .catch((err) => {
                        console.warn("Failed to fetch text content for inline viewer:", err)
                        setTextContent("Unable to load preview text. Please use Download to view this file.")
                    })
                    .finally(() => {
                        setIsTextLoading(false)
                        setIsLoading(false)
                    })
            }
        }
    }, [isOpen, url, name, isText])

    if (!isOpen) return null

    const handleCopy = () => {
        if (!textContent) return
        navigator.clipboard.writeText(textContent)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
    }

    const handleOpenInSystem = () => {
        // Open the authenticated inline stream in a new tab / system viewer
        window.open(inlineProxyUrl, "_blank", "noopener,noreferrer")
    }

    // Badge styling by file extension
    const getBadgeStyle = () => {
        if (isPdf) return "bg-rose-500 text-white shadow-rose-500/30"
        if (["XLS", "XLSX"].includes(ext)) return "bg-emerald-600 text-white shadow-emerald-600/30"
        if (["PPT", "PPTX"].includes(ext)) return "bg-amber-600 text-white shadow-amber-600/30"
        if (["DOC", "DOCX"].includes(ext)) return "bg-blue-600 text-white shadow-blue-600/30"
        if (isText) return "bg-indigo-600 text-white shadow-indigo-600/30"
        if (isArchive) return "bg-purple-600 text-white shadow-purple-600/30"
        return "bg-slate-600 text-white"
    }

    const getFileIcon = () => {
        if (["XLS", "XLSX"].includes(ext)) return <FileSpreadsheet size={16} />
        if (isText) return <FileCode size={16} />
        if (isArchive) return <FileArchive size={16} />
        return <FileText size={16} />
    }

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-5xl h-[92vh] sm:h-[88vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            >
                {/* Header Bar */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-800/95 border-b border-slate-700/80 text-white shrink-0">
                    {/* Left: File Badge & Title */}
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div
                            className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${getBadgeStyle()}`}
                        >
                            {getFileIcon()}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-semibold truncate text-slate-100" title={name}>
                                {name}
                            </h3>
                            <p className="text-[11px] text-slate-400 font-medium">
                                {formatBytes(size)} • {ext}
                            </p>
                        </div>
                    </div>

                    {/* Right: Actions (Open in System, Download, Close) */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {/* Copy button (for text files) */}
                        {isText && textContent && (
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="h-9 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Copy file content"
                            >
                                {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                <span className="hidden sm:inline">{isCopied ? "Copied" : "Copy"}</span>
                            </button>
                        )}

                        {/* Open in System / New Tab */}
                        <button
                            type="button"
                            onClick={handleOpenInSystem}
                            className="h-9 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Open in browser or system viewer"
                        >
                            <ExternalLink size={14} />
                            <span className="hidden sm:inline">Open in System</span>
                        </button>

                        {/* Download button */}
                        <button
                            type="button"
                            onClick={onDownload}
                            disabled={isDownloading}
                            className="h-9 px-3.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/25 transition-all cursor-pointer disabled:opacity-50"
                            title="Download to computer"
                        >
                            {isDownloading ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Download size={14} className="stroke-[2.5]" />
                            )}
                            <span className="hidden sm:inline">{isDownloading ? "Downloading..." : "Download"}</span>
                        </button>

                        {/* Close button */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 w-9 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors ml-1 cursor-pointer"
                            title="Close (Esc)"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Main Viewer Body */}
                <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col">
                    {/* PDF Viewer */}
                    {isPdf && (
                        <div className="relative w-full h-full flex flex-col">
                            {isLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 z-10">
                                    <Loader2 size={32} className="animate-spin text-purple-500 mb-2" />
                                    <p className="text-xs">Loading PDF document...</p>
                                </div>
                            )}
                            <iframe
                                src={`${inlineProxyUrl}#toolbar=1&navpanes=1`}
                                title={name}
                                onLoad={() => setIsLoading(false)}
                                className="w-full h-full border-0 rounded-b-2xl bg-slate-900"
                            />
                        </div>
                    )}

                    {/* Text / Code Viewer */}
                    {isText && (
                        <div className="w-full h-full p-4 overflow-auto font-mono text-xs text-slate-200 leading-relaxed select-text bg-[#0d1117]">
                            {isTextLoading ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <Loader2 size={28} className="animate-spin text-purple-500 mb-2" />
                                    <p className="text-xs">Loading text preview...</p>
                                </div>
                            ) : (
                                <pre className="whitespace-pre-wrap break-words">{textContent}</pre>
                            )}
                        </div>
                    )}

                    {/* Office Files (Docx, Xlsx, Pptx) */}
                    {isOffice && (
                        <div className="relative w-full h-full flex flex-col">
                            {/* Google Docs Viewer Embed */}
                            <iframe
                                src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
                                title={name}
                                onLoad={() => setIsLoading(false)}
                                className="w-full h-full border-0 bg-white"
                            />
                            {/* Bottom helper pill */}
                            <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                                <span>Previewing via document viewer</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleOpenInSystem}
                                        className="text-purple-400 hover:text-purple-300 font-medium underline cursor-pointer"
                                    >
                                        Open in System
                                    </button>
                                    <span>•</span>
                                    <button
                                        type="button"
                                        onClick={onDownload}
                                        className="text-purple-400 hover:text-purple-300 font-medium underline cursor-pointer"
                                    >
                                        Download to edit in Office
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Archive (Zip, Rar) / Unsupported Fallback */}
                    {!isPdf && !isText && !isOffice && (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900/50">
                            <div
                                className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg ${getBadgeStyle()}`}
                            >
                                {getFileIcon()}
                            </div>
                            <h4 className="text-base font-semibold text-slate-200 mb-1">{name}</h4>
                            <p className="text-xs text-slate-400 max-w-md mb-6">
                                {isArchive
                                    ? "Archive files (ZIP/RAR) cannot be previewed directly inside the browser. Please download this archive to extract and view its files."
                                    : "This file format does not support inline browser preview. You can open it in your system or download it directly."}
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={onDownload}
                                    disabled={isDownloading}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                                >
                                    <Download size={16} />
                                    <span>Download File ({formatBytes(size)})</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleOpenInSystem}
                                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                    <ExternalLink size={16} />
                                    <span>Open in System</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default DocumentViewerModal
