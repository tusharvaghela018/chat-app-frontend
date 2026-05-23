import { useState, useEffect, useRef, useCallback } from "react"
import { Search, MessageSquare, ShieldAlert, Ban } from "lucide-react"
import { useGetApi } from "@/hooks/api"
import useDebounce from "@/hooks/debounce"
import { useSelector } from "react-redux"
import { getUser } from "@/redux/slices/auth.slice"
import type { IUser, IConversation } from "@/types"

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
    const authUser = useSelector(getUser)
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [userList, setUserList] = useState<IUser[]>([])
    const bottomRef = useRef<HTMLDivElement>(null)

    const debouncedSearch = useDebounce(search, 400)
    const isSearching = debouncedSearch.length > 0

    // ── fetch conversations (when NOT searching) ──────────────────────────
    const { data: convData, isFetching: isFetchingConvs } = useGetApi<IConversation[]>(
        "/conversations",
        undefined,
        {
            queryKey: 'conversations',
            enabled: !isSearching,
            staleTime: 0
        }
    )

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
            <div className="px-4 pb-4">
                <div className="relative group">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search users or messages..."
                        className="w-full pl-10 pr-4 py-2 text-sm bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">

                {isFetching && (isSearching ? userList.length === 0 : conversations.length === 0) && <ListSkeleton />}

                {!isFetching && (isSearching ? userList.length === 0 : conversations.length === 0) && (
                    <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                         <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3 text-muted-foreground">
                            {isSearching ? <Search size={20} /> : <MessageSquare size={20} />}
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                            {isSearching ? "No users found" : "No conversations yet"}
                        </p>
                    </div>
                )}

                <div className="space-y-1">
                    {/* ── Search Results ── */}
                    {isSearching && userList.map((user: IUser) => (
                        <div
                            key={user.id}
                            onClick={() => onSelectUser(user)}
                            className={`flex items-center gap-3 p-3 cursor-pointer rounded-2xl transition-all duration-200
                                ${selectedUserId === user.id 
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                                    : "hover:bg-muted text-foreground"}`}
                        >
                            <UserAvatar user={user} isSelected={selectedUserId === user.id} />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold truncate">{user.name}</p>
                                <p className={`text-[11px] font-medium truncate
                                    ${selectedUserId === user.id ? "text-primary-foreground/80" : "text-muted-foreground/80"}`}>
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

                        return (
                            <div
                                key={conv.id}
                                onClick={() => onSelectUser(otherUser)}
                                className={`flex items-center gap-3 p-3 cursor-pointer rounded-2xl transition-all duration-200
                                    ${isSelected 
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                                        : "hover:bg-muted text-foreground"}`}
                            >
                                <UserAvatar user={otherUser} isSelected={isSelected} />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-bold truncate">{otherUser.name}</p>
                                        {lastMsg && (
                                            <span className={`text-[10px] tabular-nums whitespace-nowrap
                                                ${isSelected ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                                                {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className={`text-[11px] font-medium truncate
                                            ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground/80"}`}>
                                            {iBlocked ? (
                                                <span className="flex items-center gap-1 text-red-500/80">
                                                    <Ban size={10} /> Blocked
                                                </span>
                                            ) : isPending && isIRecipient ? (
                                                <span className="flex items-center gap-1 text-primary animate-pulse">
                                                    <ShieldAlert size={10} /> Message Request
                                                </span>
                                            ) : lastMsg ? (
                                                lastMsg.content.startsWith('{') ? 'Encrypted Message' : lastMsg.content
                                            ) : (
                                                `@${otherUser.username}`
                                            )}
                                        </p>
                                        {lastMsg && !lastMsg.is_seen && lastMsg.sender_id !== authUser?.id && !iBlocked && (
                                            <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 shadow-sm" />
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

const UserAvatar = ({ user, isSelected }: { user: IUser, isSelected: boolean }) => (
    <div className="relative flex-shrink-0">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-display font-bold shadow-inner overflow-hidden
            ${isSelected ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"}`}>
            {user.avatar
                ? <img src={user.avatar} className="w-full h-full object-cover" />
                : user.name[0].toUpperCase()
            }
        </div>
        {user.is_online && (
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 bg-green-500
                ${isSelected ? "border-primary" : "border-card"}`} />
        )}
    </div>
)

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