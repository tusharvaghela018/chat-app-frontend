import { useState, useEffect, useRef, useCallback } from "react"
import { Search } from "lucide-react"
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

    // reset page and clear list when search changes
    useEffect(() => {
        setPage(1)
        setUserList([])
    }, [debouncedSearch])

    const { data, isFetching } = useGetApi<UserResponse>(
        "/users",
        { page, limit: 20, ...(debouncedSearch ? { search: debouncedSearch } : {}) },
        { 
            queryKey: `users-${debouncedSearch}`,
            staleTime: 0 
        }
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
        <div className="flex flex-col h-full bg-card">
            <div className="px-4 pb-4">
                <div className="relative group">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search users..."
                        className="w-full pl-10 pr-4 py-2 text-sm bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">

                {isFetching && userList.length === 0 && <ListSkeleton />}

                {!isFetching && userList.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                         <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3 text-muted-foreground">
                            <Search size={20} />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                            {search ? "No users found matching your search" : "No users yet"}
                        </p>
                    </div>
                )}

                <div className="space-y-1">
                    {userList.map((user: IUser) => (
                        <div
                            key={user.id}
                            onClick={() => onSelectUser(user)}
                            className={`flex items-center gap-3 p-3 cursor-pointer rounded-2xl transition-all duration-200
                                ${selectedUserId === user.id 
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                                    : "hover:bg-muted text-foreground"}`}
                        >
                            <div className="relative flex-shrink-0">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-display font-bold shadow-inner overflow-hidden
                                    ${selectedUserId === user.id ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"}`}>
                                    {user.avatar
                                        ? <img src={user.avatar} className="w-full h-full object-cover" />
                                        : user.name[0].toUpperCase()
                                    }
                                </div>
                                {user.is_online && (
                                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 bg-green-500
                                        ${selectedUserId === user.id ? "border-primary" : "border-card"}`} />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold truncate">{user.name}</p>
                                <p className={`text-[11px] font-medium truncate mb-0.5
                                    ${selectedUserId === user.id ? "text-primary-foreground/80" : "text-muted-foreground/80"}`}>
                                    @{user.username}
                                </p>
                                <p className={`text-[10px] font-medium uppercase tracking-wider
                                    ${selectedUserId === user.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                    {user.is_online ? "Online" : "Offline"}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div ref={bottomRef} className="py-2 px-2">
                    {isFetching && userList.length > 0 && (
                         <div className="flex items-center gap-3 p-3 rounded-2xl animate-pulse bg-muted/30">
                            <div className="w-11 h-11 bg-muted/50 rounded-xl flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-muted/50 rounded w-1/2" />
                            </div>
                        </div>
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

export default DirectList