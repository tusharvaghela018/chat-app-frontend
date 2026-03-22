import { useState, useEffect, useRef, useCallback } from "react"
import { User, Search } from "lucide-react"
import { useGetApi } from "@/hooks/api"
import useDebounce from "@/hooks/debounce"
import type { IUser } from "@/types"

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
}

const DirectList = ({ selectedUserId, onSelectUser }: Props) => {
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [userList, setUserList] = useState<IUser[]>([])
    const bottomRef = useRef<HTMLDivElement>(null)

    const debouncedSearch = useDebounce(search, 400)

    // reset page when search changes
    useEffect(() => {
        setPage(1)
    }, [debouncedSearch])

    const { data, isFetching } = useGetApi<UserResponse>(
        "/users",
        { page, limit: 20, ...(debouncedSearch ? { search: debouncedSearch } : {}) },
        { queryKey: `users-${debouncedSearch}` }
    )

    const hasMore = (data?.data as any)?.hasMore ?? false

    useEffect(() => {
        const incoming = (data?.data as any)?.users
        if (!incoming) return
        setUserList((prev) =>
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

    return (
        <div className="flex flex-col h-full">
            <div className="p-3 border-b">
                <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search users..."
                        className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg outline-none focus:border-blue-400 transition"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">

                {isFetching && userList.length === 0 && <ListSkeleton />}

                {!isFetching && userList.length === 0 && (
                    <div className="flex items-center justify-center h-32">
                        <p className="text-sm text-gray-400">
                            {search ? "No users found" : "No users yet"}
                        </p>
                    </div>
                )}

                {userList.map((user: IUser) => (
                    <div
                        key={user.id}
                        onClick={() => onSelectUser(user)}
                        className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition
                            ${selectedUserId === user.id ? "bg-blue-50 border-r-2 border-blue-500" : ""}`}
                    >
                        <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                {user.avatar
                                    ? <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" />
                                    : <User size={18} />
                                }
                            </div>
                            {user.is_online && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-xs text-gray-400">
                                {user.is_online ? "Online" : "Offline"}
                            </p>
                        </div>
                    </div>
                ))}

                <div ref={bottomRef} className="py-3 flex justify-center">
                    {isFetching && userList.length > 0 && (
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                </div>
            </div>
        </div>
    )
}

const ListSkeleton = () => (
    <div className="space-y-1 p-2">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                </div>
            </div>
        ))}
    </div>
)

export default DirectList