import React, { useState, useMemo, useEffect } from "react"
import { Star, Users, User, Search, ArrowRight, Mic, FileText } from "lucide-react"
import { useGetApi } from "@/hooks/api"
import axiosInstance from "@/api/axios"
import { useQueryClient } from "@tanstack/react-query"
import { useSocket } from "@/hooks/socket"
import { CHAT_EVENTS, GROUP_EVENTS } from "@/pages/chat/constants"
import type { IUser, IGroup } from "@/types"
import { decryptDirectMessage, getSessionKeys } from "@/utils/crypto"

interface StarredItemData {
    id: number
    type: "direct" | "group"
    message_id?: number
    group_message_id?: number
    content: string
    created_at: string
    starred_at: string
    sender?: {
        id: number
        name: string
        avatar?: string | null
        public_key?: string
    } | null
    conversation_id?: number
    group_id?: number
    chat?: {
        type: "direct" | "group"
        id?: number
        name: string
        avatar?: string | null
        other_user?: IUser
        group?: IGroup
    } | null
}

interface StarredListProps {
    onSelectUser: (user: IUser) => void
    onSelectGroup: (group: IGroup) => void
    onTabChange?: (tab: "dm" | "groups" | string) => void
    externalSearch?: string
}

export const StarredList: React.FC<StarredListProps> = ({
    onSelectUser,
    onSelectGroup,
    onTabChange,
    externalSearch = "",
}) => {
    const queryClient = useQueryClient()
    const socket = useSocket()
    const [filterType, setFilterType] = useState<"all" | "direct" | "group">("all")
    const [localSearch, setLocalSearch] = useState("")

    // Real-time synchronization for Starred List tab
    useEffect(() => {
        if (!socket) return

        const handleStarUpdated = () => {
            queryClient.invalidateQueries({ queryKey: ["starred-messages"] })
            queryClient.invalidateQueries({ queryKey: ["starred-messages-ids"] })
        }

        socket.on(CHAT_EVENTS.STAR_UPDATED, handleStarUpdated)
        socket.on(GROUP_EVENTS.STAR_UPDATED, handleStarUpdated)

        return () => {
            socket.off(CHAT_EVENTS.STAR_UPDATED, handleStarUpdated)
            socket.off(GROUP_EVENTS.STAR_UPDATED, handleStarUpdated)
        }
    }, [socket, queryClient])

    const { data: response, isLoading } = useGetApi<StarredItemData[]>(
        "/starred-messages",
        undefined,
        {
            queryKey: "starred-messages",
            staleTime: 0,
        }
    )

    const rawList: StarredItemData[] = response?.data || []

    const searchKeyword = (externalSearch || localSearch).trim().toLowerCase()

    // Helper to decrypt / parse message content
    const parseContent = (item: StarredItemData) => {
        const raw = item.content
        if (!raw) return { text: "Empty message", type: "text" }

        try {
            const parsed = JSON.parse(raw)
            if (parsed.type === "audio") {
                return { text: "Voice message", type: "audio", duration: parsed.duration }
            }
            if (parsed.type === "file") {
                return { text: parsed.name || "Attachment", type: "file", size: parsed.size }
            }

            // E2EE encrypted message
            if (parsed.c && parsed.n) {
                const myKeys = getSessionKeys()
                const senderPub = item.sender?.public_key || item.chat?.other_user?.public_key
                if (myKeys && senderPub) {
                    const dec = decryptDirectMessage(parsed, senderPub, myKeys.secretKey)
                    if (dec) {
                        try {
                            const inner = JSON.parse(dec)
                            if (inner.type === "audio") {
                                return { text: "Voice message", type: "audio", duration: inner.duration }
                            }
                            if (inner.type === "file") {
                                return { text: inner.name || "Attachment", type: "file", size: inner.size }
                            }
                        } catch {}
                        return { text: dec, type: "text" }
                    }
                }
                return { text: "Encrypted message", type: "text" }
            }

            return { text: raw, type: "text" }
        } catch {
            return { text: raw, type: "text" }
        }
    }

    // Filter items based on tab & search
    const filteredList = useMemo(() => {
        return rawList.filter((item) => {
            if (filterType !== "all" && item.type !== filterType) return false

            if (!searchKeyword) return true

            const chatName = (item.chat?.name || "").toLowerCase()
            const senderName = (item.sender?.name || "").toLowerCase()
            const { text } = parseContent(item)
            const contentText = text.toLowerCase()

            return (
                chatName.includes(searchKeyword) ||
                senderName.includes(searchKeyword) ||
                contentText.includes(searchKeyword)
            )
        })
    }, [rawList, filterType, searchKeyword])

    // Unstar handler with 0ms optimistic removal
    const handleUnstar = async (e: React.MouseEvent, item: StarredItemData) => {
        e.stopPropagation()

        // 1. Optimistically remove from React Query cache immediately
        queryClient.setQueryData(["starred-messages", undefined], (old: any) => {
            if (!old || !old.data || !Array.isArray(old.data)) return old
            return {
                ...old,
                data: old.data.filter((i: StarredItemData) => i.id !== item.id),
            }
        })

        try {
            await axiosInstance.post("/starred-messages/toggle", {
                messageId: item.message_id,
                groupMessageId: item.group_message_id,
            })
            queryClient.invalidateQueries({ queryKey: ["starred-messages"] })
            queryClient.invalidateQueries({ queryKey: ["starred-messages-ids"] })
            if (item.message_id) {
                queryClient.invalidateQueries({ queryKey: ["messages-"], exact: false })
            }
            if (item.group_message_id) {
                queryClient.invalidateQueries({ queryKey: ["group-messages-"], exact: false })
            }
        } catch (err) {
            console.error("Failed to unstar message:", err)
            queryClient.invalidateQueries({ queryKey: ["starred-messages"] })
        }
    }

    // Card click navigation
    const handleItemClick = (item: StarredItemData) => {
        if (item.type === "direct" && item.chat?.other_user) {
            onSelectUser(item.chat.other_user)
            onTabChange?.("dm")
        } else if (item.type === "group" && item.chat?.group) {
            onSelectGroup(item.chat.group)
            onTabChange?.("groups")
        }
    }

    const formatTimestamp = (dateStr: string) => {
        try {
            const date = new Date(dateStr)
            const now = new Date()
            const isToday =
                date.getDate() === now.getDate() &&
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear()

            if (isToday) {
                return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            }
            return date.toLocaleDateString([], { month: "short", day: "numeric" })
        } catch {
            return ""
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col gap-3 p-4">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse"
                    />
                ))}
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Filter Chips & Search Bar */}
            <div className="px-4 py-2.5 space-y-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/40">
                {!externalSearch && (
                    <div className="relative">
                        <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            placeholder="Search in starred..."
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                        />
                    </div>
                )}

                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setFilterType("all")}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            filterType === "all"
                                ? "bg-purple-600 text-white shadow-xs shadow-purple-600/30"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                    >
                        All ({rawList.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterType("direct")}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                            filterType === "direct"
                                ? "bg-purple-600 text-white shadow-xs shadow-purple-600/30"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                    >
                        <User size={12} />
                        Direct
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterType("group")}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                            filterType === "group"
                                ? "bg-purple-600 text-white shadow-xs shadow-purple-600/30"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                    >
                        <Users size={12} />
                        Groups
                    </button>
                </div>
            </div>

            {/* Starred Messages List */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
                {filteredList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-amber-500 mb-3 shadow-xs">
                            <Star size={24} className="fill-amber-400 text-amber-500" />
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                            {rawList.length === 0 ? "No starred messages yet" : "No matches found"}
                        </p>
                        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                            {rawList.length === 0
                                ? "Hover over any message in direct or group chats and click the star icon to save it here."
                                : "Try searching with a different term or change the filter above."}
                        </p>
                    </div>
                ) : (
                    filteredList.map((item) => {
                        const { text, type: msgType } = parseContent(item)
                        const isDirect = item.type === "direct"

                        return (
                            <div
                                key={item.id}
                                onClick={() => handleItemClick(item)}
                                className="group relative p-3 rounded-2xl bg-white dark:bg-[#1a2238] border border-slate-200/80 dark:border-slate-800/80 hover:border-purple-300 dark:hover:border-purple-700/60 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col gap-2"
                            >
                                {/* Header: Avatar + Chat Title + Badge + Star button */}
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="relative">
                                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden shadow-xs shrink-0">
                                                {item.chat?.avatar ? (
                                                    <img
                                                        src={item.chat.avatar}
                                                        alt={item.chat.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : isDirect ? (
                                                    item.chat?.name?.[0]?.toUpperCase() || <User size={15} />
                                                ) : (
                                                    item.chat?.name?.[0]?.toUpperCase() || <Users size={15} />
                                                )}
                                            </div>
                                            <span
                                                className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                                                    isDirect
                                                        ? "bg-indigo-600 text-white"
                                                        : "bg-purple-600 text-white"
                                                }`}
                                            >
                                                {isDirect ? "D" : "G"}
                                            </span>
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                                    {item.chat?.name || (isDirect ? "Direct Chat" : "Group Chat")}
                                                </p>
                                                <span
                                                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold tracking-tight uppercase ${
                                                        isDirect
                                                            ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/50"
                                                            : "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/50"
                                                    }`}
                                                >
                                                    {isDirect ? "Direct" : "Group"}
                                                </span>
                                            </div>

                                            {!isDirect && item.sender?.name && (
                                                <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold truncate">
                                                    by {item.sender.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Star icon & Timestamp */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="text-[10px] text-slate-400 font-medium tabular-nums">
                                            {formatTimestamp(item.created_at)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => handleUnstar(e, item)}
                                            className="p-1 rounded-full text-amber-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                            title="Unstar message"
                                        >
                                            <Star size={14} className="fill-amber-400" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content Preview */}
                                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 rounded-xl px-3 py-2 text-xs">
                                    {msgType === "audio" ? (
                                        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold">
                                            <Mic size={14} className="animate-pulse" />
                                            <span>Voice Message</span>
                                        </div>
                                    ) : msgType === "file" ? (
                                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium truncate">
                                            <FileText size={14} />
                                            <span className="truncate">{text}</span>
                                        </div>
                                    ) : (
                                        <p className="text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                                            {text}
                                        </p>
                                    )}
                                </div>

                                {/* Jump to chat prompt on hover */}
                                <div className="flex items-center justify-end gap-1 text-[10px] font-semibold text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span>Jump to message</span>
                                    <ArrowRight size={11} />
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

export default StarredList
