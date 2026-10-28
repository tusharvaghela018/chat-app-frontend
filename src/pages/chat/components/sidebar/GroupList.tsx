import { useState, useEffect, useRef, useCallback } from "react"
import { Users, Search } from "lucide-react"
import { useGetApi } from "@/hooks/api"
import useDebounce from "@/hooks/debounce"
import type { IGroup } from "@/types"
import { useSocket } from "@/hooks/socket"
import { useQueryClient } from "@tanstack/react-query"
import { GROUP_EVENTS } from "@/pages/chat/constants"
import { useSelector } from "react-redux"
import { getUser } from "@/redux/slices/auth.slice"

export interface GroupResponse {
    groups: IGroup[]
    count: number
    page: number
    per_page: number
    total_pages: number
    hasMore: boolean
}

interface Props {
    selectedGroupId: number | null
    onSelectGroup: (group: IGroup) => void
    externalSearch?: string
}

const GroupList = ({ selectedGroupId, onSelectGroup, externalSearch }: Props) => {
    const [internalSearch, setInternalSearch] = useState("")
    const search = externalSearch !== undefined ? externalSearch : internalSearch
    const setSearch = setInternalSearch
    const [page, setPage] = useState(1)
    const [groupList, setGroupList] = useState<IGroup[]>([])
    const bottomRef = useRef<HTMLDivElement>(null)

    const authUser = useSelector(getUser)
    const socket = useSocket()
    const queryClient = useQueryClient()

    const debouncedSearch = useDebounce(search, 400)

    // Immediately clear unread count for selected group in local list
    useEffect(() => {
        if (!selectedGroupId) return
        setGroupList((prev) =>
            prev.map((g) => {
                if (g.id === selectedGroupId && Number((g as any).unread_count) > 0) {
                    return { ...g, unread_count: 0 }
                }
                return g
            })
        )
    }, [selectedGroupId])

    useEffect(() => {
        setPage(1)
        setGroupList([])
    }, [debouncedSearch])

    const { data, isFetching } = useGetApi<GroupResponse>(
        "/groups",
        { page, limit: 20, ...(debouncedSearch ? { search: debouncedSearch } : {}) },
        { 
            queryKey: `groups-${debouncedSearch}`,
            staleTime: 0 
        }
    )

    const hasMore = (data?.data as any)?.hasMore ?? false

    useEffect(() => {
        const incoming = (data?.data as any)?.groups
        if (!incoming) return
        setGroupList((prev) =>
            page === 1 ? incoming : [...prev, ...incoming]
        )
    }, [data])

    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            if (entries[0].isIntersecting && hasMore && !isFetching) {
                setPage((prev) => prev + 1)
            }
        },
        [hasMore, isFetching]
    )

    useEffect(() => {
        const observer = new IntersectionObserver(handleObserver, { threshold: 0.5 })
        if (bottomRef.current) observer.observe(bottomRef.current)
        return () => observer.disconnect()
    }, [handleObserver])

    // listen for member changes and live message updates with 0ms in-memory cache updates
    useEffect(() => {
        if (!socket) return

        const handleRefreshGroups = () => {
            queryClient.invalidateQueries({ queryKey: ["groups-"], exact: false })
            queryClient.invalidateQueries({ queryKey: ["groups-count"] })
        }

        const handleReceiveMessage = (msg: any) => {
            const isFromOther = Number(msg.sender_id) !== Number(authUser?.id)
            setGroupList((prev) =>
                prev.map((g) => {
                    if (g.id === msg.group_id) {
                        const isCurrentlyActive = selectedGroupId === g.id
                        const unreadInc = (isFromOther && !isCurrentlyActive) ? 1 : 0
                        return {
                            ...g,
                            unread_count: (Number((g as any).unread_count) || 0) + unreadInc,
                            last_message: msg,
                            last_message_content: msg.content,
                            last_message_time: msg.created_at || new Date().toISOString()
                        }
                    }
                    return g
                })
            )
        }

        socket.on(GROUP_EVENTS.MEMBER_JOINED, handleRefreshGroups)
        socket.on(GROUP_EVENTS.MEMBER_LEFT, handleRefreshGroups)
        socket.on(GROUP_EVENTS.RECEIVE_MESSAGE, handleReceiveMessage)

        return () => {
            socket.off(GROUP_EVENTS.MEMBER_JOINED, handleRefreshGroups)
            socket.off(GROUP_EVENTS.MEMBER_LEFT, handleRefreshGroups)
            socket.off(GROUP_EVENTS.RECEIVE_MESSAGE, handleReceiveMessage)
        }
    }, [socket, queryClient, authUser?.id, selectedGroupId])

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
                            placeholder="Search groups..."
                            className="w-full pl-10 pr-12 py-2 text-xs bg-slate-100 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded-md pointer-events-none shadow-2xs">
                            ⌘K
                        </span>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto px-3 custom-scrollbar">

                {isFetching && groupList.length === 0 && <ListSkeleton />}

                {!isFetching && groupList.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-3 text-slate-400">
                            <Users size={20} />
                        </div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {search ? "No groups found matching your search" : "No groups joined yet"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs">
                            Create a group below or ask an admin for an invite link to join
                        </p>
                    </div>
                )}

                <div className="space-y-1.5 py-1">
                    {groupList.map((group: IGroup) => {
                        const isSelected = Number(selectedGroupId) === Number(group.id)
                        return (
                            <div
                                key={group.id}
                                onClick={() => {
                                    const clearThisGroup = (old: any) => {
                                        if (!old?.data?.groups || !Array.isArray(old.data.groups)) return old
                                        const updated = old.data.groups.map((g: any) =>
                                            Number(g.id) === Number(group.id) ? { ...g, unread_count: 0 } : g
                                        )
                                        return { ...old, data: { ...old.data, groups: updated } }
                                    }
                                    queryClient.setQueriesData({ queryKey: ["groups-"] }, clearThisGroup)
                                    queryClient.setQueriesData({ queryKey: ["groups-count"] }, clearThisGroup)
                                    setGroupList(prev => prev.map(g => Number(g.id) === Number(group.id) ? { ...g, unread_count: 0 } : g))
                                    onSelectGroup(group)
                                }}
                                className={`flex items-center gap-3 p-3 cursor-pointer rounded-2xl transition-all duration-200 ${
                                    isSelected 
                                        ? "bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 shadow-xs" 
                                        : "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-900 dark:text-slate-100"
                                }`}
                            >
                                <div className="flex-shrink-0">
                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-display font-bold text-sm shadow-xs overflow-hidden ${
                                        isSelected 
                                            ? "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white" 
                                            : "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/40"
                                    }`}>
                                        {group.avatar
                                            ? <img src={group.avatar} className="w-full h-full object-cover" />
                                            : <Users size={18} />
                                        }
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1">
                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{group.name}</p>
                                        {((group as any).last_message_time || (group as any).last_message?.created_at) && (
                                            <span className="text-[10px] text-slate-400 font-medium shrink-0">
                                                {new Date((group as any).last_message_time || (group as any).last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between gap-2 mt-0.5">
                                        <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 truncate flex-1">
                                            {(group as any).last_message_content
                                                ? (group as any).last_message_content.startsWith('{')
                                                    ? "🔒 Encrypted message"
                                                    : (group as any).last_message_content
                                                : (group as any).last_message?.sender?.name
                                                ? `${(group as any).last_message.sender.name}: ${(group as any).last_message.content}`
                                                : (group.description ?? "No description provided")
                                            }
                                        </p>
                                        {Number((group as any).unread_count) > 0 && selectedGroupId !== group.id ? (
                                            <span className="h-4 min-w-4 px-1 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                                {Number((group as any).unread_count) > 99 ? "99+" : (group as any).unread_count}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div ref={bottomRef} className="py-2 px-2">
                    {isFetching && groupList.length > 0 && (
                        <div className="flex items-center gap-3 p-3 rounded-2xl animate-pulse bg-slate-100/60 dark:bg-slate-800/40">
                            <div className="w-11 h-11 bg-slate-200 dark:bg-slate-700 rounded-full flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

const ListSkeleton = () => (
    <div className="space-y-2 px-1 py-1">
        {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl animate-pulse bg-slate-100/60 dark:bg-slate-800/40">
                <div className="w-11 h-11 bg-slate-200 dark:bg-slate-700 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                </div>
            </div>
        ))}
    </div>
)

export default GroupList
