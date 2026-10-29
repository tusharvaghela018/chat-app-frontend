import React from "react"
import { Reply, X } from "lucide-react"

interface ReplyPreviewBarProps {
    replyingTo: {
        id: number
        sender_name: string
        content: string
    } | null
    onCancel: () => void
    isDirect?: boolean
}

export const ReplyPreviewBar: React.FC<ReplyPreviewBarProps> = ({ replyingTo, onCancel, isDirect }) => {
    if (!replyingTo) return null

    // Helper to format content preview (handles image/audio/doc indicators)
    const getPreviewText = (text: string) => {
        try {
            if (text.startsWith("{") && text.endsWith("}")) {
                const parsed = JSON.parse(text)
                if (parsed.type === "image") return "📷 Photo"
                if (parsed.type === "audio") return "🎤 Voice message"
                if (parsed.type === "document" || parsed.type === "file") return `📄 ${parsed.name || "Attachment"}`
                if (parsed.type === "call" || parsed.type === "call_log") return "📞 Call"
                if (parsed.caption) return parsed.caption
                if (parsed.ciphertext) return "🔒 Encrypted message"
            }
        } catch {
            // plain text
        }
        return text || "Message"
    }

    return (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-100/90 dark:bg-slate-800/90 border-t border-slate-200/80 dark:border-slate-700/80 backdrop-blur-md animate-in slide-in-from-bottom-2 fade-in duration-150">
            <div className="flex items-center gap-3 min-w-0 flex-1 border-l-4 border-purple-500 pl-3">
                <Reply size={16} className="text-purple-500 shrink-0 rotate-180" />
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-purple-600 dark:text-purple-400 truncate">
                        {isDirect ? "Replying to message" : `Replying to ${replyingTo.sender_name}`}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                        {getPreviewText(replyingTo.content)}
                    </p>
                </div>
            </div>

            <button
                type="button"
                onClick={onCancel}
                className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors ml-2 shrink-0 cursor-pointer"
                title="Cancel reply (Esc)"
                aria-label="Cancel reply"
            >
                <X size={16} />
            </button>
        </div>
    )
}

export default ReplyPreviewBar
