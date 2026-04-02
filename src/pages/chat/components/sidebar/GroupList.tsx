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
    }, [debouncedSearch])

    const { data, isFetching } = useGetApi<GroupResponse>(
        "/groups",
        { page, limit: 20, ...(debouncedSearch ? { search: debouncedSearch } : {}) },
        { queryKey: `groups-${debouncedSearch}` }
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

            {/* search */}
            <div className="px-4 pb-4">
                <div className="relative group">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search groups..."
                        className="w-full pl-10 pr-4 py-2 text-sm bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                    />
                </div>
            </div>

            {/* list */}
            <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">

                {isFetching && groupList.length === 0 && <ListSkeleton />}

                {!isFetching && groupList.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3 text-muted-foreground">
                            <Users size={20} />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                            {search ? "No groups found matching your search" : "No groups joined yet"}
                        </p>
                    </div>
                )}

                <div className="space-y-1">
                    {groupList.map((group: IGroup) => (
                        <div
                            key={group.id}
                            onClick={() => onSelectGroup(group)}
                            className={`flex items-center gap-3 p-3 cursor-pointer rounded-2xl transition-all duration-200
                                ${selectedGroupId === group.id 
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                                    : "hover:bg-muted text-foreground"}`}
                        >
                            <div className="flex-shrink-0">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-display font-bold shadow-inner overflow-hidden
                                    ${selectedGroupId === group.id ? "bg-white/20" : "bg-purple-500/10 text-purple-600"}`}>
                                    {group.avatar
                                        ? <img src={group.avatar} className="w-full h-full object-cover" />
                                        : <Users size={20} />
                                    }
                                </div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold truncate">{group.name}</p>
                                <p className={`text-[10px] font-medium truncate
                                    ${selectedGroupId === group.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                    {group.description ?? "No description provided"}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div ref={bottomRef} className="py-6 flex justify-center">
                    {isFetching && groupList.length > 0 && (
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                </div>
            </div>
        </div>
    )
}

const ListSkeleton = () => (
    <div className="space-y-2 px-2">
        {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl animate-pulse bg-muted/50">
                <div className="w-11 h-11 bg-muted rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-2 bg-muted rounded w-1/4" />
                </div>
            </div>
        ))}
    </div>
)

export default GroupList
