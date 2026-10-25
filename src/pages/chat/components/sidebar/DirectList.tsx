import { useState, useEffect, useRef, useCallback } from "react"
import { Search, MessageSquare, ShieldAlert, Ban, Archive, ArchiveRestore } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useGetApi } from "@/hooks/api"
import axiosInstance from "@/api/axios"
import useToast from "@/hooks/toast"
import useDebounce from "@/hooks/debounce"
import { useSocket } from "@/hooks/socket"
import { CHAT_EVENTS } from "@/pages/chat/constants"
import { useSelector } from "react-redux"
import { getUser } from "@/redux/slices/auth.slice"
import type { IUser, IConversation } from "@/types"
import { usePresence } from "@/hooks/usePresence"

export interface UserResponse {
    users: IUser[]
    count: number
    page: number
    per_page: number
    total_pages: number
    hasMore: boolean
}

interface Props {
    selectedUserId: number | null
    onSelectUser: (user: IUser) => void
    externalSearch?: string
    isArchived?: boolean
}

const DirectList = ({ selectedUserId, onSelectUser, externalSearch, isArchived = false }: Props) => {
    const authUser = useSelector(getUser)
    const toast = useToast()
    const [internalSearch, setInternalSearch] = useState("")
    const search = externalSearch !== undefined ? externalSearch : internalSearch
    const setSearch = setInternalSearch
    const [page, setPage] = useState(1)
    const [userList, setUserList] = useState<IUser[]>([])
    const bottomRef = useRef<HTMLDivElement>(null)

    const socket = useSocket()
    const queryClient = useQueryClient()

    const debouncedSearch = useDebounce(search, 400)
    const isSearching = debouncedSearch.length > 0

    // ── socket updates ────────────────────────────────────────────────────
    useEffect(() => {
        if (!socket) return

        const onRefresh = () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] })
            queryClient.invalidateQueries({ queryKey: ['conversations-archived'] })
        }

        socket.on(CHAT_EVENTS.RECEIVE_MESSAGE, onRefresh)
        socket.on(CHAT_EVENTS.NEW_REQUEST, onRefresh)
        socket.on(CHAT_EVENTS.CONVERSATION_STATUS_UPDATED, onRefresh)

        return () => {
            socket.off(CHAT_EVENTS.RECEIVE_MESSAGE, onRefresh)
            socket.off(CHAT_EVENTS.NEW_REQUEST, onRefresh)
            socket.off(CHAT_EVENTS.CONVERSATION_STATUS_UPDATED, onRefresh)
        }
    }, [socket, queryClient])

    // ── fetch conversations (when NOT searching) ──────────────────────────
    const endpoint = isArchived ? "/conversations?archived=true" : "/conversations"
    const convQueryKey = isArchived ? 'conversations-archived' : 'conversations'

    const { data: convData, isFetching: isFetchingConvs } = useGetApi<IConversation[]>(
        endpoint,
        undefined,
        {
            queryKey: convQueryKey,
            enabled: !isSearching,
            staleTime: 0
        }
    )

    const handleToggleArchive = async (e: React.MouseEvent, conversationId: number, archive: boolean) => {
        e.stopPropagation()
        try {
            await axiosInstance.patch(`/conversations/${conversationId}/archive`, { archive })
            queryClient.invalidateQueries({ queryKey: ['conversations'] })
            queryClient.invalidateQueries({ queryKey: ['conversations-archived'] })
            toast.success(archive ? "Conversation archived" : "Conversation unarchived")
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to update archive status")
        }
    }

    // ── fetch users (when searching) ──────────────────────────────────────
    const { data: userData, isFetching: isFetchingUsers } = useGetApi<UserResponse>(
        "/users",
        { page, limit: 20, search: debouncedSearch },
        { 
            queryKey: `users-search-${debouncedSearch}-${page}`,
            enabled: isSearching,
            staleTime: 0 
        }
    )

    useEffect(() => {
        if (!isSearching) {
            setUserList([])
            setPage(1)
            return
        }
        
        const incoming = (userData?.data as any)?.users
        if (!incoming) return
        setUserList((prev) =>
            page === 1 ? incoming : [...prev, ...incoming]
        )
    }, [userData, isSearching, page])

    const conversations = (convData?.data || []) as any[]
    const isFetching = isSearching ? isFetchingUsers : isFetchingConvs

    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            if (entries[0].isIntersecting && isSearching && (userData?.data as any)?.hasMore && !isFetchingUsers) {
                setPage((prev) => prev + 1)
            }
        },
        [isSearching, userData, isFetchingUsers]
    )

    useEffect(() => {
        const observer = new IntersectionObserver(handleObserver, { threshold: 0.5 })
        if (bottomRef.current) observer.observe(bottomRef.current)
        return () => observer.disconnect()
    }, [handleObserver])


    return (
        <div className="flex flex-col h-full bg-card">
            {/* Search Input Bar (only if externalSearch is not provided) */}
            {externalSearch === undefined && (
                <div className="px-4 pb-3 pt-1">
                    <div className="relative group">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search conversations..."
                            className="w-full pl-10 pr-12 py-2 text-xs bg-slate-100 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded-md pointer-events-none shadow-2xs">
                            ⌘K
                        </span>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto px-3 custom-scrollbar">

                {isFetching && (isSearching ? userList.length === 0 : conversations.length === 0) && <ListSkeleton />}

                {!isFetching && (isSearching ? userList.length === 0 : conversations.length === 0) && (
                    <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-3 text-slate-400">
                            {isSearching ? <Search size={20} /> : isArchived ? <Archive size={20} /> : <MessageSquare size={20} />}
                        </div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {isSearching
                                ? "No users found"
                                : isArchived
                                ? "No archived chats"
                                : "No conversations yet"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs">
                            {isSearching
                                ? "Try searching with a different name or username"
                                : isArchived
                                ? "Conversations you archive will appear here"
                                : "Search a user above to start chatting"}
                        </p>
                    </div>
                )}

                <div className="space-y-1.5 py-1">
                    {/* ── Search Results ── */}
                    {isSearching && userList.map((user: IUser) => (
                        <div
                            key={user.id}
                            onClick={() => onSelectUser(user)}
                            className={`flex items-center gap-3 p-3 cursor-pointer rounded-2xl transition-all duration-200 ${
                                selectedUserId === user.id 
                                    ? "bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 shadow-xs" 
                                    : "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-900 dark:text-slate-100"
                            }`}
                        >
                            <UserAvatar user={user} isSelected={selectedUserId === user.id} />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                                    @{user.username}
                                </p>
                            </div>
                        </div>
                    ))}

                    {/* ── Active Conversations ── */}
                    {!isSearching && conversations.map((conv) => {
                        const otherUser = conv.sender_id === authUser?.id ? conv.receiver : conv.sender
                        const isPending = conv.status === 'pending'
                        const isIRecipient = conv.receiver_id === authUser?.id
                        const iBlocked = conv.sender_id === authUser?.id ? conv.blocked_by_sender : conv.blocked_by_receiver
                        
                        const lastMsg = conv.messages?.[0]
                        const isSelected = selectedUserId === otherUser.id
                        const isUnread = lastMsg && !lastMsg.is_seen && lastMsg.sender_id !== authUser?.id && !iBlocked

                        return (
                            <div
                                key={conv.id}
                                onClick={() => onSelectUser(otherUser)}
                                className={`group flex items-center gap-3 p-3 cursor-pointer rounded-2xl transition-all duration-200 ${
                                    isSelected 
                                        ? "bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 shadow-xs" 
                                        : "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-900 dark:text-slate-100"
                                }`}
                            >
                                <UserAvatar user={otherUser} isSelected={isSelected} />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{otherUser.name}</p>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {lastMsg && (
                                                <span className="text-[11px] tabular-nums whitespace-nowrap text-slate-400 font-medium group-hover:hidden">
                                                    {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={(e) => handleToggleArchive(e, conv.id, !conv.is_archived)}
                                                className="hidden group-hover:flex items-center justify-center p-1 rounded-md text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                                                title={conv.is_archived ? "Unarchive chat" : "Archive chat"}
                                            >
                                                {conv.is_archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-[11px] font-normal truncate text-slate-600 dark:text-slate-400">
                                            {iBlocked ? (
                                                <span className="flex items-center gap-1 text-red-500 dark:text-red-400 font-medium">
                                                    <Ban size={11} className="stroke-[2.5]" /> Blocked user
                                                </span>
                                            ) : isPending && isIRecipient ? (
                                                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold animate-pulse">
                                                    <ShieldAlert size={11} /> Message Request
                                                </span>
                                            ) : lastMsg ? (
                                                lastMsg.content.startsWith('{') ? '🔒 Encrypted message' : lastMsg.content
                                            ) : (
                                                `@${otherUser.username}`
                                            )}
                                        </p>
                                        {isUnread && (
                                            <span className="h-5 min-w-5 px-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shadow-xs shadow-purple-600/30 shrink-0">
                                                1
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div ref={bottomRef} className="py-2 px-2" />
            </div>
        </div>
    )
}

const UserAvatar = ({ user, isSelected }: { user: IUser, isSelected: boolean }) => {
    const { isUserOnline } = usePresence()
    const isOnline = isUserOnline(user.id, user.is_online)

    return (
        <div className="relative flex-shrink-0">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center font-display font-bold text-sm shadow-xs overflow-hidden ${
                isSelected 
                    ? "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white" 
                    : "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/40"
            }`}>
                {user.avatar
                    ? <img src={user.avatar} className="w-full h-full object-cover" />
                    : user.name[0].toUpperCase()
                }
            </div>
            {isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card bg-emerald-500 shadow-2xs" />
            )}
        </div>
    )
}

const ListSkeleton = () => (
    <div className="space-y-2 px-1 py-1">
        {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl animate-pulse bg-slate-100/60 dark:bg-slate-800/40">
                <div className="w-11 h-11 bg-slate-200 dark:bg-slate-700 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-2/5" />
                    <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-4/5" />
                </div>
            </div>
        ))}
    </div>
)

export default DirectList