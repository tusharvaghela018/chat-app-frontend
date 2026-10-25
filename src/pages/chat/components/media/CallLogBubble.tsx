import React from "react"
import { 
    Phone, PhoneOutgoing, PhoneMissed, PhoneOff, 
    Video, VideoOff, ArrowUpRight, ArrowDownLeft 
} from "lucide-react"

export interface CallLogPayload {
    type: "call_log"
    callId?: number
    callType: "audio" | "video"
    status: "completed" | "missed" | "declined" | "busy" | "cancelled"
    duration?: number
    startedAt?: string | Date
}

interface CallLogBubbleProps {
    payload: CallLogPayload
    isMine: boolean
    createdAt: string | Date
    onCallBack: (isVideo: boolean) => void
}

const formatDuration = (secs?: number): string => {
    if (!secs || secs <= 0) return "0s"
    const m = Math.floor(secs / 60)
    const s = secs % 60
    if (m === 0) return `${s}s`
    if (s === 0) return `${m}m`
    return `${m}m ${s}s`
}

export const CallLogBubble: React.FC<CallLogBubbleProps> = ({
    payload,
    isMine,
    createdAt,
    onCallBack,
}) => {
    const isVideo = payload.callType === "video"
    const status = payload.status || "completed"
    const duration = payload.duration || 0

    // Time string
    const timeStr = new Date(createdAt || payload.startedAt || Date.now()).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    })

    // Determine state presentation
    let title = ""
    let subtitle = ""
    let icon = <Phone size={18} />
    let iconBg = "bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400"
    let borderAccent = "border-slate-200/90 dark:border-slate-800"

    switch (status) {
        case "completed":
            if (isMine) {
                title = isVideo ? "Outgoing Video Call" : "Outgoing Voice Call"
                icon = isVideo ? <Video size={18} /> : <ArrowUpRight size={18} />
            } else {
                title = isVideo ? "Incoming Video Call" : "Incoming Voice Call"
                icon = isVideo ? <Video size={18} /> : <ArrowDownLeft size={18} />
            }
            subtitle = `${formatDuration(duration)} • ${timeStr}`
            iconBg = "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            break

        case "missed":
            if (isMine) {
                title = isVideo ? "Outgoing Video Call" : "Outgoing Voice Call"
                subtitle = `Unanswered • ${timeStr}`
                icon = isVideo ? <Video size={18} /> : <PhoneOutgoing size={18} />
                iconBg = "bg-slate-500/10 dark:bg-slate-500/20 text-slate-500 dark:text-slate-400"
            } else {
                title = isVideo ? "Missed Video Call" : "Missed Voice Call"
                subtitle = `Missed • ${timeStr}`
                icon = isVideo ? <VideoOff size={18} /> : <PhoneMissed size={18} />
                iconBg = "bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 dark:text-rose-400"
                borderAccent = "border-rose-500/30 dark:border-rose-500/30"
            }
            break

        case "declined":
            title = isMine ? (isVideo ? "Video Call Declined" : "Voice Call Declined") : "Declined Call"
            subtitle = `Declined • ${timeStr}`
            icon = <PhoneOff size={18} />
            iconBg = "bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 dark:text-amber-400"
            break

        case "busy":
            title = "User Busy"
            subtitle = `Line busy • ${timeStr}`
            icon = <PhoneOff size={18} />
            iconBg = "bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 dark:text-amber-400"
            break

        case "cancelled":
            if (isMine) {
                title = isVideo ? "Cancelled Video Call" : "Cancelled Voice Call"
                subtitle = `Cancelled • ${timeStr}`
                icon = isVideo ? <Video size={18} /> : <PhoneOutgoing size={18} />
                iconBg = "bg-slate-500/10 dark:bg-slate-500/20 text-slate-500 dark:text-slate-400"
            } else {
                title = isVideo ? "Missed Video Call" : "Missed Voice Call"
                subtitle = `Missed • ${timeStr}`
                icon = isVideo ? <VideoOff size={18} /> : <PhoneMissed size={18} />
                iconBg = "bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 dark:text-rose-400"
                borderAccent = "border-rose-500/30 dark:border-rose-500/30"
            }
            break
    }

    return (
        <div className="w-full flex justify-center my-2.5 animate-in fade-in duration-200">
            <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white/90 dark:bg-[#162032]/90 backdrop-blur-md border ${borderAccent} shadow-xs max-w-sm w-full transition-all hover:shadow-md`}>
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg} shadow-inner`}>
                        {icon}
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-normal truncate">
                            {subtitle}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => onCallBack(isVideo)}
                    className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-600 hover:text-white dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white text-xs font-semibold border border-purple-500/20 transition-all hover:scale-105 active:scale-95 shadow-xs"
                    title={`Call back with ${isVideo ? "video" : "voice"}`}
                >
                    {isVideo ? <Video size={13} /> : <Phone size={13} />}
                    <span>Call back</span>
                </button>
            </div>
        </div>
    )
}

export default CallLogBubble
