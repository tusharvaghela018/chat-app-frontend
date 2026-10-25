import React from "react"
import { X, User, Lock, Ban, Check, Mail, AtSign, ShieldAlert } from "lucide-react"
import type { IUser } from "@/types"
import Button from "@/common/Button"

interface UserProfileModalProps {
    open: boolean
    onClose: () => void
    user: IUser
    isBlocked: boolean
    isOnline?: boolean
    onToggleBlock: (block: boolean) => void
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
    open,
    onClose,
    user,
    isBlocked,
    isOnline = false,
    onToggleBlock,
}) => {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#1a2234] shadow-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Close modal"
                >
                    <X size={18} />
                </button>

                {/* Content */}
                <div className="flex flex-col items-center text-center">
                    {/* Avatar with status indicator */}
                    <div className="relative mb-4">
                        <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold">
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span>{user.name.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        {isBlocked ? (
                            <div
                                className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-red-600 text-white flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm"
                                title="Blocked"
                            >
                                <Ban size={14} className="stroke-[2.5]" />
                            </div>
                        ) : isOnline ? (
                            <div
                                className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800 shadow-sm"
                                title="Online"
                            />
                        ) : (
                            <div
                                className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-slate-400 border-2 border-white dark:border-slate-800 shadow-sm"
                                title="Offline"
                            />
                        )}
                    </div>

                    {/* Name & Tag */}
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {user.name}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                        <AtSign size={12} />
                        {user.username || user.name.toLowerCase().replace(/\s+/g, "_")}
                    </p>

                    {/* Status Pill */}
                    <div className="mt-3">
                        {isBlocked ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 border border-red-200/80 dark:border-red-900/50">
                                <Ban size={12} className="stroke-[2.5]" /> Blocked
                            </span>
                        ) : isOnline ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/50">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Offline
                            </span>
                        )}
                    </div>

                    {/* Security & Info Box */}
                    <div className="w-full mt-6 space-y-2.5 text-left bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/50 text-xs">
                        <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                            <Lock size={15} className="text-emerald-500 shrink-0" />
                            <span className="font-medium">End-to-end encrypted chat</span>
                        </div>
                        {user.email && (
                            <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 truncate">
                                <Mail size={15} className="shrink-0 text-slate-400" />
                                <span className="truncate">{user.email}</span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="w-full mt-6 space-y-2">
                        {isBlocked ? (
                            <Button
                                fullWidth
                                onClick={() => {
                                    onToggleBlock(false)
                                    onClose()
                                }}
                                className="rounded-xl h-11 text-xs sm:text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/25 transition-all active:scale-95"
                            >
                                <Check size={16} className="mr-2 stroke-[2.5]" />
                                Unblock User
                            </Button>
                        ) : (
                            <Button
                                fullWidth
                                variant="outline"
                                onClick={() => {
                                    onToggleBlock(true)
                                    onClose()
                                }}
                                className="rounded-xl h-11 text-xs sm:text-sm font-bold border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all active:scale-95"
                            >
                                <Ban size={16} className="mr-2" />
                                Block User
                            </Button>
                        )}

                        <Button
                            fullWidth
                            variant="ghost"
                            onClick={onClose}
                            className="rounded-xl h-10 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserProfileModal
