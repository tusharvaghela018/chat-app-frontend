import { useState } from "react";
import {
    Monitor,
    Smartphone,
    Tablet,
    Laptop,
    Globe,
    MapPin,
    Clock,
    ShieldCheck,
    AlertTriangle,
    LogOut,
    RefreshCw,
    Shield,
    CheckCircle2,
    Calendar,
    Loader2
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetApi, useDeleteApi } from "@/hooks/api";
import useToast from "@/hooks/toast";
import { formatRelativeTime } from "@/utils/date";
import type { IDeviceSession } from "@/types";

interface SessionsResponse {
    sessions: IDeviceSession[];
    total: number;
    current_session_id: string | null;
}

const getDeviceIcon = (deviceType: string, os: string, className: string = "w-5 h-5") => {
    const type = (deviceType || "").toLowerCase();
    const osLower = (os || "").toLowerCase();

    if (type === "mobile" || osLower.includes("android") || osLower.includes("ios")) {
        return <Smartphone className={className} />;
    }
    if (type === "tablet" || osLower.includes("ipad")) {
        return <Tablet className={className} />;
    }
    if (osLower.includes("mac") || type === "laptop") {
        return <Laptop className={className} />;
    }
    return <Monitor className={className} />;
};

const DeviceSettings = () => {
    const toast = useToast();
    const queryClient = useQueryClient();

    const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
    const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);

    // Fetch active sessions
    const {
        data: sessionsData,
        isLoading,
        isFetching,
        refetch
    } = useGetApi<SessionsResponse>("/auth/sessions", undefined, {
        queryKey: "auth-sessions"
    });

    const sessions = sessionsData?.data?.sessions || [];
    const currentSession = sessions.find((s) => s.is_current);
    const otherSessions = sessions.filter((s) => !s.is_current);

    // Revoke single session
    const { mutate: revokeSession, isPending: isRevokingSingle } = useDeleteApi(
        "/auth/sessions",
        {
            onSuccess: (res) => {
                toast.success(res?.message || "Device logged out successfully");
                setConfirmRevokeId(null);
                queryClient.invalidateQueries({ queryKey: ["auth-sessions"] });
            },
            onError: (err: any) => {
                toast.error(err?.response?.data?.message || "Failed to log out device");
            }
        }
    );

    // Revoke all other sessions
    const { mutate: revokeOtherSessions, isPending: isRevokingAll } = useDeleteApi(
        "/auth/sessions/other",
        {
            onSuccess: (res) => {
                toast.success(res?.message || "Logged out of all other devices");
                setConfirmRevokeAll(false);
                queryClient.invalidateQueries({ queryKey: ["auth-sessions"] });
            },
            onError: (err: any) => {
                toast.error(err?.response?.data?.message || "Failed to log out other devices");
            }
        }
    );

    const handleRevokeSingle = (sessionId: string) => {
        revokeSession(sessionId);
    };

    const handleRevokeAllOthers = () => {
        revokeOtherSessions(undefined);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-foreground">
                            Linked Devices & Sessions
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                            {sessions.length} {sessions.length === 1 ? "Active Device" : "Active Devices"}
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        View devices where your account is currently logged in, track locations, and remotely terminate sessions.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all self-start sm:self-auto cursor-pointer"
                    title="Refresh device list"
                >
                    <RefreshCw size={14} className={isFetching ? "animate-spin text-purple-600" : ""} />
                    <span>{isFetching ? "Refreshing..." : "Refresh"}</span>
                </button>
            </div>

            {isLoading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <Loader2 size={28} className="animate-spin text-purple-600" />
                    <p className="text-xs font-medium">Loading active sessions...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* ── 1. CURRENT DEVICE CARD ── */}
                    {currentSession && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <CheckCircle2 size={14} className="text-emerald-500" />
                                Current Device (This Device)
                            </h3>

                            <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent dark:from-emerald-500/10 p-5 shadow-xs transition-all">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 ring-1 ring-emerald-500/20">
                                            {getDeviceIcon(currentSession.device_type, currentSession.os, "w-6 h-6")}
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                                    {currentSession.device_name}
                                                </h4>
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow-xs">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                                    Active Now
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                                <span className="font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                    {currentSession.browser}
                                                </span>
                                                <span className="text-slate-400">•</span>
                                                <span className="font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                    {currentSession.os}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
                                                <div className="flex items-center gap-1">
                                                    <MapPin size={13} className="text-purple-500 flex-shrink-0" />
                                                    <span className="font-medium">{currentSession.location}</span>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Globe size={13} className="text-indigo-500 flex-shrink-0" />
                                                    <span className="font-mono text-[11px]">{currentSession.ip_address}</span>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Calendar size={13} className="text-slate-400 flex-shrink-0" />
                                                    <span>Logged in {new Date(currentSession.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── 2. OTHER ACTIVE SESSIONS ── */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <Shield size={14} className="text-purple-500" />
                                Other Active Devices ({otherSessions.length})
                            </h3>

                            {otherSessions.length > 0 && !confirmRevokeAll && (
                                <button
                                    type="button"
                                    onClick={() => setConfirmRevokeAll(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 rounded-xl transition-all cursor-pointer"
                                >
                                    <LogOut size={13} />
                                    <span>Log out of all other devices</span>
                                </button>
                            )}
                        </div>

                        {/* Confirmation Banner for Revoking All Other Devices */}
                        {confirmRevokeAll && (
                            <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle size={18} className="text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                                            Log out of all other {otherSessions.length} active {otherSessions.length === 1 ? "device" : "devices"}?
                                        </p>
                                        <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                                            All other sessions will immediately be disconnected and required to sign in again.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <button
                                        type="button"
                                        onClick={() => setConfirmRevokeAll(false)}
                                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleRevokeAllOthers}
                                        disabled={isRevokingAll}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        {isRevokingAll ? (
                                            <>
                                                <Loader2 size={13} className="animate-spin" />
                                                Logging out...
                                            </>
                                        ) : (
                                            <>
                                                <LogOut size={13} />
                                                Yes, Log Out All
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* List of other sessions */}
                        {otherSessions.length === 0 ? (
                            <div className="p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-center flex flex-col items-center justify-center gap-2">
                                <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <ShieldCheck size={24} />
                                </div>
                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                                    No other active devices
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                                    You are only signed in on this current device. When you log in from a mobile phone, tablet, or another computer, it will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {otherSessions.map((session) => {
                                    const isConfirming = confirmRevokeId === session.id;

                                    return (
                                        <div
                                            key={session.id}
                                            className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-card hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-start gap-3.5">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0">
                                                        {getDeviceIcon(session.device_type, session.os, "w-5 h-5")}
                                                    </div>

                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                                {session.device_name}
                                                            </h4>
                                                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                                                {session.browser} • {session.os}
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                                            <div className="flex items-center gap-1">
                                                                <MapPin size={12} className="text-purple-500 flex-shrink-0" />
                                                                <span>{session.location}</span>
                                                            </div>

                                                            <div className="flex items-center gap-1">
                                                                <Globe size={12} className="text-indigo-500 flex-shrink-0" />
                                                                <span className="font-mono text-[11px]">{session.ip_address}</span>
                                                            </div>

                                                            <div className="flex items-center gap-1">
                                                                <Clock size={12} className="text-amber-500 flex-shrink-0" />
                                                                <span>Active {formatRelativeTime(session.last_active_at)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-2 self-end sm:self-center">
                                                    {isConfirming ? (
                                                        <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                                                            <button
                                                                type="button"
                                                                onClick={() => setConfirmRevokeId(null)}
                                                                className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRevokeSingle(session.id)}
                                                                disabled={isRevokingSingle}
                                                                className="px-3 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
                                                            >
                                                                {isRevokingSingle ? "Logging out..." : "Confirm"}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => setConfirmRevokeId(session.id)}
                                                            className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                                                            title="Log out of this device"
                                                        >
                                                            <LogOut size={13} />
                                                            <span>Log Out</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeviceSettings;
