import React, { useEffect, useRef } from "react";
import { useCall } from "@/context/CallContext";
import {
    Mic,
    MicOff,
    Video as VideoIcon,
    VideoOff,
    PhoneOff,
    Phone,
    Minimize2,
    Shield,
    SwitchCamera,
    Loader2,
} from "lucide-react";

export const CallModal: React.FC = () => {
    const {
        callStatus,
        callType,
        remoteUser,
        localStream,
        remoteStream,
        isMuted,
        isVideoOff,
        isRemoteMuted,
        isRemoteVideoOff,
        duration,
        isMinimized,
        errorMessage,
        facingMode,
        isSwitchingCamera,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        toggleMinimize,
        switchCamera,
    } = useCall();

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const remoteAudioRef = useRef<HTMLAudioElement>(null);

    // Bind local media stream to local video element
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, callStatus]);

    // Bind remote media stream to remote video & audio elements
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
        if (remoteAudioRef.current && remoteStream) {
            remoteAudioRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, callStatus]);

    // If call is idle or minimized, don't show full modal
    if (callStatus === "idle" || isMinimized) {
        return null;
    }

    const formatDuration = (secs: number) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        if (h > 0) {
            return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        }
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
            {/* Hidden audio element for audio playback */}
            <audio ref={remoteAudioRef} autoPlay playsInline />

            <div className="relative w-full max-w-4xl h-[92vh] max-h-[720px] rounded-3xl bg-[#090e1a] border border-slate-800 shadow-2xl overflow-hidden flex flex-col justify-between select-none">
                {/* ── TOP HEADER BAR ──────────────────────────────────── */}
                <div className="h-14 px-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md z-30">
                    <div className="flex items-center gap-2.5">
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-semibold text-emerald-400">
                            <Shield size={12} />
                            <span>End-to-End Encrypted</span>
                        </span>
                    </div>

                    {/* Timer or Call Status */}
                    <div className="flex items-center gap-2">
                        {callStatus === "connected" ? (
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-mono font-bold text-white tabular-nums shadow-xs">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>{formatDuration(duration)}</span>
                            </div>
                        ) : (
                            <span className="text-xs text-slate-400 font-medium">
                                {callStatus === "incoming" && "Incoming Call..."}
                                {callStatus === "outgoing" && "Calling..."}
                                {callStatus === "ended" && "Call Ended"}
                            </span>
                        )}
                    </div>

                    {/* Minimize Button */}
                    <div>
                        {callStatus === "connected" && (
                            <button
                                type="button"
                                onClick={toggleMinimize}
                                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                                title="Minimize Call"
                            >
                                <Minimize2 size={17} />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── MAIN CONTENT AREA ────────────────────────────────── */}
                <div className="relative flex-1 flex items-center justify-center overflow-hidden">
                    {/* CASE 1: Active Video Call */}
                    {callStatus === "connected" && callType === "video" && (
                        <div className="relative w-full h-full flex items-center justify-center bg-black">
                            {/* Remote Video Stream */}
                            {remoteStream && !isRemoteVideoOff ? (
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                                    <div className="relative">
                                        {remoteUser?.avatar ? (
                                            <img
                                                src={remoteUser.avatar}
                                                alt={remoteUser.name}
                                                className="h-28 w-28 rounded-full object-cover border-2 border-purple-500/50 shadow-2xl"
                                            />
                                        ) : (
                                            <div className="h-28 w-28 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-2xl">
                                                {remoteUser?.name?.[0] || "U"}
                                            </div>
                                        )}
                                        {isRemoteMuted && (
                                            <span className="absolute bottom-1 right-1 p-2 rounded-full bg-red-600 text-white shadow-lg">
                                                <MicOff size={14} />
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-white">{remoteUser?.name}</h3>
                                    <p className="text-xs text-slate-400">
                                        {isRemoteVideoOff ? "Camera is turned off" : "Waiting for video..."}
                                    </p>
                                </div>
                            )}

                            {/* Floating Local PiP Video (Self Preview) */}
                            <div className="group absolute top-4 right-4 z-20 w-32 sm:w-44 aspect-video rounded-2xl overflow-hidden border-2 border-slate-700/80 bg-slate-900 shadow-2xl">
                                {!isVideoOff && localStream ? (
                                    <>
                                        <video
                                            ref={localVideoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className={`w-full h-full object-cover transition-transform duration-300 ${
                                                facingMode === "user" ? "scale-x-[-1]" : ""
                                            }`}
                                        />
                                        {/* Quick Flip Button on Local PiP */}
                                        <button
                                            type="button"
                                            onClick={switchCamera}
                                            disabled={isSwitchingCamera}
                                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/85 text-white backdrop-blur-md transition-all hover:scale-110 active:scale-95 shadow-md z-30"
                                            title={facingMode === "user" ? "Switch to Rear Camera" : "Switch to Front Camera"}
                                        >
                                            {isSwitchingCamera ? (
                                                <Loader2 size={13} className="animate-spin text-purple-400" />
                                            ) : (
                                                <SwitchCamera size={13} />
                                            )}
                                        </button>
                                        <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[9px] font-medium text-slate-300 uppercase pointer-events-none">
                                            {facingMode === "user" ? "Front" : "Rear"}
                                        </span>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 text-xs">
                                        <VideoOff size={18} className="mb-1 text-slate-500" />
                                        <span>Camera Off</span>
                                    </div>
                                )}
                                {isMuted && (
                                    <span className="absolute bottom-1.5 left-1.5 p-1 rounded-md bg-red-600/90 text-white shadow-sm">
                                        <MicOff size={11} />
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* CASE 2: Active Audio Call */}
                    {callStatus === "connected" && callType === "audio" && (
                        <div className="flex flex-col items-center justify-center text-center p-6 space-y-5">
                            {/* Pulsing Avatar with Waves */}
                            <div className="relative">
                                <div className="absolute inset-0 rounded-full bg-purple-600/20 animate-ping opacity-40 scale-125 pointer-events-none" />
                                <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-purple-600/20 to-indigo-600/20 blur-xl opacity-60" />

                                {remoteUser?.avatar ? (
                                    <img
                                        src={remoteUser.avatar}
                                        alt={remoteUser.name}
                                        className="relative h-32 w-32 rounded-full object-cover border-4 border-purple-500 shadow-2xl"
                                    />
                                ) : (
                                    <div className="relative h-32 w-32 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-4xl font-bold text-white shadow-2xl">
                                        {remoteUser?.name?.[0] || "U"}
                                    </div>
                                )}

                                {isRemoteMuted && (
                                    <span className="absolute bottom-1 right-1 p-2 rounded-full bg-red-600 text-white shadow-lg">
                                        <MicOff size={16} />
                                    </span>
                                )}
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">{remoteUser?.name}</h3>
                                {remoteUser?.username && (
                                    <p className="text-xs text-purple-400 font-medium">@{remoteUser.username}</p>
                                )}
                            </div>

                            {/* Soundwave visualizer bars */}
                            <div className="flex items-center gap-1 h-6">
                                {[40, 70, 30, 90, 60, 100, 45, 80, 50, 95, 60, 30, 75, 40].map((h, idx) => (
                                    <span
                                        key={idx}
                                        className="w-1 rounded-full bg-purple-500/80 animate-pulse"
                                        style={{
                                            height: `${h}%`,
                                            animationDuration: `${0.4 + (idx % 4) * 0.2}s`,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CASE 3: Incoming Call */}
                    {callStatus === "incoming" && (
                        <div className="flex flex-col items-center justify-center text-center p-6 space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-full bg-emerald-500/25 animate-ping opacity-60 scale-125" />
                                <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-purple-600/30 via-indigo-600/30 to-emerald-600/30 blur-2xl opacity-70" />

                                {remoteUser?.avatar ? (
                                    <img
                                        src={remoteUser.avatar}
                                        alt={remoteUser.name}
                                        className="relative h-32 w-32 rounded-full object-cover border-4 border-emerald-500 shadow-2xl"
                                    />
                                ) : (
                                    <div className="relative h-32 w-32 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-4xl font-bold text-white shadow-2xl">
                                        {remoteUser?.name?.[0] || "U"}
                                    </div>
                                )}
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">{remoteUser?.name}</h2>
                                {remoteUser?.username && (
                                    <p className="text-xs text-purple-400 font-medium mb-3">@{remoteUser.username}</p>
                                )}
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 text-xs text-slate-300 border border-slate-700/60">
                                    {callType === "video" ? (
                                        <>
                                            <VideoIcon size={14} className="text-emerald-400" />
                                            <span>Incoming Video Call...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Phone size={14} className="text-emerald-400" />
                                            <span>Incoming Voice Call...</span>
                                        </>
                                    )}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* CASE 4: Outgoing Call */}
                    {callStatus === "outgoing" && (
                        <div className="flex flex-col items-center justify-center text-center p-6 space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-full bg-indigo-500/25 animate-ping opacity-50 scale-125" />
                                <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-purple-600/30 to-indigo-600/30 blur-2xl opacity-70" />

                                {remoteUser?.avatar ? (
                                    <img
                                        src={remoteUser.avatar}
                                        alt={remoteUser.name}
                                        className="relative h-32 w-32 rounded-full object-cover border-4 border-indigo-500 shadow-2xl"
                                    />
                                ) : (
                                    <div className="relative h-32 w-32 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-4xl font-bold text-white shadow-2xl">
                                        {remoteUser?.name?.[0] || "U"}
                                    </div>
                                )}
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">{remoteUser?.name}</h2>
                                {remoteUser?.username && (
                                    <p className="text-xs text-purple-400 font-medium mb-3">@{remoteUser.username}</p>
                                )}
                                <p className="text-sm text-slate-400 animate-pulse font-medium">
                                    Calling {callType === "video" ? "Video" : "Audio"}...
                                </p>
                            </div>
                        </div>
                    )}

                    {/* CASE 5: Ended / Error Notice */}
                    {callStatus === "ended" && (
                        <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
                            <div className="h-20 w-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                                <PhoneOff size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-white">
                                {errorMessage || "Call Ended"}
                            </h3>
                        </div>
                    )}
                </div>

                {/* ── BOTTOM DOCK CONTROLS ─────────────────────────────── */}
                <div className="p-5 flex items-center justify-center border-t border-slate-800/80 bg-slate-900/70 backdrop-blur-md z-30">
                    {/* Controls during Active Call */}
                    {callStatus === "connected" && (
                        <div className="flex items-center gap-3 sm:gap-4">
                            {/* Mute Mic */}
                            <button
                                type="button"
                                onClick={toggleMute}
                                className={`p-4 rounded-2xl transition-all ${
                                    isMuted
                                        ? "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 shadow-md shadow-red-500/10"
                                        : "bg-slate-800/90 text-white border border-slate-700/80 hover:bg-slate-700"
                                }`}
                                title={isMuted ? "Unmute Mic" : "Mute Mic"}
                            >
                                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                            </button>

                            {/* Camera Toggle (Video Call only) */}
                            {callType === "video" && (
                                <button
                                    type="button"
                                    onClick={toggleVideo}
                                    className={`p-4 rounded-2xl transition-all ${
                                        isVideoOff
                                            ? "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 shadow-md shadow-red-500/10"
                                            : "bg-slate-800/90 text-white border border-slate-700/80 hover:bg-slate-700"
                                    }`}
                                    title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
                                >
                                    {isVideoOff ? <VideoOff size={22} /> : <VideoIcon size={22} />}
                                </button>
                            )}

                            {/* Switch Camera (Front / Rear) */}
                            {callType === "video" && !isVideoOff && (
                                <button
                                    type="button"
                                    onClick={switchCamera}
                                    disabled={isSwitchingCamera}
                                    className={`p-4 rounded-2xl transition-all ${
                                        isSwitchingCamera
                                            ? "bg-slate-800/50 text-slate-500 cursor-not-allowed"
                                            : "bg-slate-800/90 text-white border border-slate-700/80 hover:bg-slate-700 hover:border-purple-500/50 hover:text-purple-300 active:scale-95 shadow-xs"
                                    }`}
                                    title={facingMode === "user" ? "Switch to Rear Camera" : "Switch to Front Camera"}
                                >
                                    {isSwitchingCamera ? (
                                        <Loader2 size={22} className="animate-spin text-purple-400" />
                                    ) : (
                                        <SwitchCamera size={22} className="transition-transform duration-300" />
                                    )}
                                </button>
                            )}

                            {/* End Call Button */}
                            <button
                                type="button"
                                onClick={endCall}
                                className="px-6 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 active:scale-95 transition-all"
                                title="End Call"
                            >
                                <PhoneOff size={22} />
                                <span className="text-sm font-semibold">End Call</span>
                            </button>
                        </div>
                    )}

                    {/* Controls during Incoming Call */}
                    {callStatus === "incoming" && (
                        <div className="flex items-center gap-6">
                            {/* Decline Call Button */}
                            <button
                                type="button"
                                onClick={() => rejectCall("declined")}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/30 group-active:scale-95 transition-all">
                                    <PhoneOff size={24} />
                                </div>
                                <span className="text-xs font-semibold text-slate-300">Decline</span>
                            </button>

                            {/* Accept Call Button */}
                            <button
                                type="button"
                                onClick={acceptCall}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className="h-16 w-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-600/40 animate-bounce group-active:scale-95 transition-all">
                                    {callType === "video" ? <VideoIcon size={28} /> : <Phone size={28} />}
                                </div>
                                <span className="text-xs font-bold text-emerald-400">Accept</span>
                            </button>
                        </div>
                    )}

                    {/* Controls during Outgoing Call */}
                    {callStatus === "outgoing" && (
                        <div className="flex items-center justify-center gap-3">
                            {callType === "video" && (
                                <button
                                    type="button"
                                    onClick={switchCamera}
                                    disabled={isSwitchingCamera}
                                    className="p-3.5 rounded-2xl bg-slate-800/90 text-white border border-slate-700/80 hover:bg-slate-700 hover:text-purple-300 active:scale-95 transition-all shadow-xs"
                                    title={facingMode === "user" ? "Switch to Rear Camera" : "Switch to Front Camera"}
                                >
                                    {isSwitchingCamera ? (
                                        <Loader2 size={20} className="animate-spin text-purple-400" />
                                    ) : (
                                        <SwitchCamera size={20} />
                                    )}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={endCall}
                                className="px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 active:scale-95 transition-all"
                            >
                                <PhoneOff size={20} />
                                <span className="text-xs font-semibold">Cancel Call</span>
                            </button>
                        </div>
                    )}

                    {/* Notice during Ended */}
                    {callStatus === "ended" && (
                        <p className="text-xs text-slate-500 font-medium">Closing call window...</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallModal;
