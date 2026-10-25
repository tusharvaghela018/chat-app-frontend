import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { useGetApi } from "@/hooks/api";
import { useSocket } from "@/hooks/socket";
import { getUser } from "@/redux/slices/auth.slice";
import { useCall } from "@/context/CallContext";
import { CALL_EVENTS } from "@/pages/chat/constants";
import {
    Phone,
    Video,
    PhoneMissed,
    PhoneIncoming,
    PhoneOutgoing,
    Loader2,
} from "lucide-react";
import type { IUser } from "@/types";

export interface ICallLog {
    id: number;
    caller_id: number;
    receiver_id: number;
    conversation_id: number | null;
    type: "audio" | "video";
    status: "completed" | "missed" | "declined" | "busy" | "cancelled";
    duration: number;
    started_at: string;
    ended_at: string | null;
    caller: IUser;
    receiver: IUser;
}

interface CallListProps {
    onSelectUser: (user: IUser) => void;
    externalSearch?: string;
}

export const CallList: React.FC<CallListProps> = ({ onSelectUser, externalSearch = "" }) => {
    const authUser = useSelector(getUser);
    const socket = useSocket();
    const queryClient = useQueryClient();
    const { startCall, callStatus } = useCall();

    const { data: callData, isLoading, refetch } = useGetApi<{
        calls: ICallLog[];
        total: number;
    }>("/calls", undefined, {
        queryKey: "call-history",
        staleTime: 10 * 1000,
    });

    const calls = callData?.data?.calls || [];

    // Refetch call history when any call ends or is completed
    useEffect(() => {
        if (!socket) return;

        const onCallEnded = () => {
            queryClient.invalidateQueries({ queryKey: ["call-history"] });
            refetch();
        };

        socket.on(CALL_EVENTS.ENDED, onCallEnded);
        return () => {
            socket.off(CALL_EVENTS.ENDED, onCallEnded);
        };
    }, [socket, queryClient, refetch]);

    const formatCallTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();

        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        const isYesterday = d.toDateString() === yesterday.toDateString();

        const timeStr = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

        if (isToday) return `Today, ${timeStr}`;
        if (isYesterday) return `Yesterday, ${timeStr}`;
        return `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeStr}`;
    };

    const formatDuration = (secs: number) => {
        if (!secs || secs <= 0) return "";
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `(${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")})`;
    };

    const filteredCalls = calls.filter((call) => {
        if (!authUser) return false;
        const isOutgoing = call.caller_id === authUser.id;
        const partner = isOutgoing ? call.receiver : call.caller;
        if (!partner) return false;

        if (!externalSearch.trim()) return true;
        const query = externalSearch.toLowerCase();
        return (
            partner.name?.toLowerCase().includes(query) ||
            partner.username?.toLowerCase().includes(query)
        );
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <Loader2 size={24} className="animate-spin mb-2 text-purple-600 dark:text-purple-400" />
                <span className="text-xs">Loading call history...</span>
            </div>
        );
    }

    if (filteredCalls.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3 shadow-xs">
                    <Phone size={22} />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {externalSearch ? "No calls found" : "No recent calls"}
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                    {externalSearch
                        ? "Try searching for a different name or username."
                        : "Start a high-definition voice or video call with any contact."}
                </p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto custom-scrollbar px-2 space-y-1">
            {filteredCalls.map((call) => {
                if (!authUser) return null;
                const isOutgoing = call.caller_id === authUser.id;
                const partner = isOutgoing ? call.receiver : call.caller;
                if (!partner) return null;

                const isMissed = !isOutgoing && call.status === "missed";
                const isDeclined = call.status === "declined" || call.status === "busy";

                return (
                    <div
                        key={call.id}
                        onClick={() => onSelectUser(partner)}
                        className="group flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700/50"
                    >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            {partner.avatar ? (
                                <img
                                    src={partner.avatar}
                                    alt={partner.name}
                                    className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700/60"
                                />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                                    {partner.name?.[0] || "U"}
                                </div>
                            )}

                            {/* Call Type Icon Badge */}
                            <span
                                className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center text-[9px] shadow-xs ${
                                    isMissed
                                        ? "bg-red-500 text-white"
                                        : "bg-purple-600 text-white"
                                }`}
                            >
                                {call.type === "video" ? <Video size={9} /> : <Phone size={9} />}
                            </span>
                        </div>

                        {/* Middle Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <h4
                                    className={`text-xs font-bold truncate ${
                                        isMissed
                                            ? "text-red-600 dark:text-red-400"
                                            : "text-slate-900 dark:text-slate-100"
                                    }`}
                                >
                                    {partner.name}
                                </h4>
                                <span className="text-[10px] text-slate-400 tabular-nums">
                                    {formatCallTime(call.started_at)}
                                </span>
                            </div>

                            {/* Status subtitle with direction icon */}
                            <div className="flex items-center gap-1.5 text-[11px]">
                                {isMissed ? (
                                    <span className="flex items-center gap-1 text-red-500 dark:text-red-400 font-medium">
                                        <PhoneMissed size={12} className="stroke-[2.5]" />
                                        <span>Missed</span>
                                    </span>
                                ) : isOutgoing ? (
                                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                        <PhoneOutgoing size={12} className="text-indigo-500 stroke-[2.2]" />
                                        <span>
                                            Outgoing {isDeclined ? "(Declined)" : formatDuration(call.duration)}
                                        </span>
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                        <PhoneIncoming size={12} className="text-emerald-500 stroke-[2.2]" />
                                        <span>
                                            Incoming {isDeclined ? "(Declined)" : formatDuration(call.duration)}
                                        </span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Quick Call Back Button */}
                        <div className="shrink-0 pl-1">
                            <button
                                type="button"
                                disabled={callStatus !== "idle"}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    startCall(
                                        {
                                            id: partner.id,
                                            name: partner.name,
                                            avatar: partner.avatar,
                                            username: partner.username,
                                        },
                                        call.type === "video",
                                        call.conversation_id || undefined
                                    );
                                }}
                                className="p-2 rounded-xl text-purple-600 hover:text-white dark:text-purple-400 hover:bg-purple-600 dark:hover:bg-purple-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                title={`Call back (${call.type === "video" ? "Video" : "Audio"})`}
                            >
                                {call.type === "video" ? <Video size={16} /> : <Phone size={16} />}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CallList;
