import { useState, useEffect, useRef, useCallback } from "react"
import { Users, Search } from "lucide-react"
import { useGetApi } from "@/hooks/api"
import useDebounce from "@/hooks/debounce"
import type { IGroup } from "@/types"
import { useSocket } from "@/hooks/socket"
import { useQueryClient } from "@tanstack/react-query"
import { GROUP_EVENTS } from "@/pages/chat/constants"

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
}

const GroupList = ({ selectedGroupId, onSelectGroup }: Props) => {
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [groupList, setGroupList] = useState<IGroup[]>([])
    const bottomRef = useRef<HTMLDivElement>(null)

    const socket = useSocket()
    const queryClient = useQueryClient()

    const debouncedSearch = useDebounce(search, 400)

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

    // listen for member changes and refetch group list
    useEffect(() => {
        if (!socket) return

        const handleMemberJoined = () => {
            queryClient.invalidateQueries({ queryKey: ["groups-"], exact: false })
        }

        const handleMemberLeft = () => {
            queryClient.invalidateQueries({ queryKey: ["groups-"], exact: false })
        }

        socket.on(GROUP_EVENTS.MEMBER_JOINED, handleMemberJoined)
        socket.on(GROUP_EVENTS.MEMBER_LEFT, handleMemberLeft)

        return () => {
            socket.off(GROUP_EVENTS.MEMBER_JOINED, handleMemberJoined)
            socket.off(GROUP_EVENTS.MEMBER_LEFT, handleMemberLeft)
        }
    }, [socket])

    return (
        <div className="flex flex-col h-full bg-card">
            {/* Search Input Bar */}
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
                        const isSelected = selectedGroupId === group.id
                        return (
                            <div
                                key={group.id}
                                onClick={() => onSelectGroup(group)}
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
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{group.name}</p>
                                    <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                        {group.description ?? "No description provided"}
                                    </p>
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
