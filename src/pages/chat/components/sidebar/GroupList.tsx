import { useState, useEffect, useRef, useCallback } from "react"
import { Users, Plus, Search } from "lucide-react"
import { useGetApi } from "@/hooks/api"
import useDebounce from "@/hooks/debounce"
import type { IGroup } from "@/types"
import { useSocket } from "@/hooks/socket"
import { useQueryClient } from "@tanstack/react-query"
import { GROUP_EVENTS } from "@/pages/chat/constants"
import Input from "@/common/Input"

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
    onCreateGroup: () => void
}

const GroupList = ({ selectedGroupId, onSelectGroup, onCreateGroup }: Props) => {
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
        <div className="flex flex-col h-full">

            {/* create group button */}
            <button
                onClick={onCreateGroup}
                className="w-full flex items-center gap-3 p-4 text-blue-600 hover:bg-blue-50 transition border-b flex-shrink-0"
            >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Plus size={18} />
                </div>
                <span className="text-sm font-medium">Create new group</span>
            </button>

            {/* search */}
            <div className="p-3 border-b flex-shrink-0">
                <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search groups..."
                        className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg outline-none focus:border-blue-400 transition"
                    />
                </div>
            </div>

            {/* list */}
            <div className="flex-1 overflow-y-auto">

                {isFetching && groupList.length === 0 && <ListSkeleton />}

                {!isFetching && groupList.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 gap-2">
                        <Users size={32} className="text-gray-300" />
                        <p className="text-sm text-gray-400">
                            {search ? "No groups found" : "No groups yet"}
                        </p>
                    </div>
                )}

                {groupList.map((group: IGroup) => (
                    <div
                        key={group.id}
                        onClick={() => onSelectGroup(group)}
                        className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition
                            ${selectedGroupId === group.id ? "bg-blue-50 border-r-2 border-blue-500" : ""}`}
                    >
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            {group.avatar
                                ? <img src={group.avatar} className="w-10 h-10 rounded-full object-cover" />
                                : <Users size={18} className="text-purple-600" />
                            }
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{group.name}</p>
                            <p className="text-xs text-gray-400 truncate">
                                {group.description ?? "No description"}
                            </p>
                        </div>
                    </div>
                ))}

                <div ref={bottomRef} className="py-3 flex justify-center">
                    {isFetching && groupList.length > 0 && (
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                </div>
            </div>
        </div>
    )
}

const ListSkeleton = () => (
    <div className="space-y-1 p-2">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                </div>
            </div>
        ))}
    </div>
)

export default GroupList