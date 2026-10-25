import React from "react";
import { useCall } from "@/context/CallContext";
import { Mic, MicOff, Maximize2, PhoneOff, Video, Phone } from "lucide-react";

export const FloatingCallWidget: React.FC = () => {
    const {
        callStatus,
        callType,
        remoteUser,
        duration,
        isMuted,
        toggleMute,
        toggleMinimize,
        endCall,
        isMinimized,
    } = useCall();

    if (callStatus !== "connected" || !isMinimized) {
        return null;
    }

    const formatDuration = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center gap-3 p-2.5 pr-3.5 rounded-2xl bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl text-white select-none">
                {/* Caller Avatar / Icon */}
                <div className="relative shrink-0">
                    {remoteUser?.avatar ? (
                        <img
                            src={remoteUser.avatar}
                            alt={remoteUser.name}
                            className="h-10 w-10 rounded-full object-cover border border-purple-500/40"
                        />
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-sm">
                            {remoteUser?.name?.[0] || "U"}
                        </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-900 flex items-center justify-center">
                        {callType === "video" ? <Video size={8} /> : <Phone size={8} />}
                    </span>
                </div>

                {/* Call Info */}
                <div className="min-w-0 pr-1">
                    <p className="text-xs font-bold text-slate-100 truncate max-w-[110px]">
                        {remoteUser?.name}
                    </p>
                    <p className="text-[11px] font-mono text-emerald-400 font-semibold tabular-nums">
                        {formatDuration(duration)}
                    </p>
                </div>

                {/* Control Actions */}
                <div className="flex items-center gap-1.5 pl-1 border-l border-slate-800">
                    <button
                        type="button"
                        onClick={toggleMute}
                        className={`p-2 rounded-xl transition-colors ${
                            isMuted
                                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white"
                        }`}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
                    </button>

                    <button
                        type="button"
                        onClick={toggleMinimize}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Expand Call"
                    >
                        <Maximize2 size={15} />
                    </button>

                    <button
                        type="button"
                        onClick={endCall}
                        className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30 transition-colors"
                        title="End Call"
                    >
                        <PhoneOff size={15} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FloatingCallWidget;
