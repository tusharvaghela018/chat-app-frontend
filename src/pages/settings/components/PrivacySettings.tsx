import { useState, useMemo, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Lock, Eye, Image as ImageIcon, Check, Ban, Search, Loader2, MoreVertical, ChevronDown, ChevronRight } from "lucide-react"
import { useGetApi, usePatchApi } from "@/hooks/api"
import { useQueryClient } from "@tanstack/react-query"
import { type RootState } from "@/redux/store"
import { setUser } from "@/redux/slices/auth.slice"

interface BlockedUser {
    id: number
    blocked_at: string
    user: {
        id: number
        name: string
        username: string
        avatar: string | null
    }
}

interface Props {
    isExpanded?: boolean
    onToggle?: () => void
}

const dbToUi = (val?: string) => {
    if (val === "everyone") return "Everyone"
    if (val === "nobody") return "Nobody"
    return "My contacts"
}

const uiToDb = (val: string) => {
    if (val === "Everyone") return "everyone"
    if (val === "Nobody") return "nobody"
    return "contacts"
}

const PrivacySettings = ({ isExpanded = true, onToggle }: Props) => {
    const queryClient = useQueryClient()
    const dispatch = useDispatch()
    const user = useSelector((state: RootState) => state.auth.user)

    const [isOpen, setIsOpen] = useState(isExpanded)
    const [searchQuery, setSearchQuery] = useState("")
    const [lastSeenStatus, setLastSeenStatus] = useState(() => dbToUi(user?.last_seen_privacy))
    const [photoVisibility, setPhotoVisibility] = useState(() => dbToUi(user?.avatar_privacy))
    const [readReceipts, setReadReceipts] = useState(() => user?.read_receipts !== false)

    useEffect(() => {
        if (user) {
            setLastSeenStatus(dbToUi(user.last_seen_privacy))
            setPhotoVisibility(dbToUi(user.avatar_privacy))
            setReadReceipts(user.read_receipts !== false)
        }
    }, [user])

    const { mutate: updateSettings } = usePatchApi("/users/settings")

    const handleLastSeenChange = (uiVal: string) => {
        setLastSeenStatus(uiVal)
        const dbVal = uiToDb(uiVal)
        updateSettings({ body: { last_seen_privacy: dbVal } }, {
            onSuccess: (res: any) => {
                if (res.data?.user) dispatch(setUser(res.data.user))
            }
        })
    }

    const handlePhotoVisibilityChange = (uiVal: string) => {
        setPhotoVisibility(uiVal)
        const dbVal = uiToDb(uiVal)
        updateSettings({ body: { avatar_privacy: dbVal } }, {
            onSuccess: (res: any) => {
                if (res.data?.user) dispatch(setUser(res.data.user))
            }
        })
    }

    const handleReadReceiptsToggle = () => {
        const nextVal = !readReceipts
        setReadReceipts(nextVal)
        updateSettings({ body: { read_receipts: nextVal } }, {
            onSuccess: (res: any) => {
                if (res.data?.user) dispatch(setUser(res.data.user))
            }
        })
    }

    const toggleOpen = () => {
        if (onToggle) onToggle()
        else setIsOpen(!isOpen)
    }

    const currentOpen = onToggle ? isExpanded : isOpen

    const { data: blockedData, isLoading } = useGetApi<BlockedUser[]>(
        "/conversations/blocked",
        undefined,
        { queryKey: 'blocked-users' }
    )

    const blockedUsers = useMemo(() => {
        return (blockedData?.data || []) as BlockedUser[]
    }, [blockedData])

    const filteredBlockedUsers = useMemo(() => {
        if (!searchQuery.trim()) return blockedUsers
        const q = searchQuery.toLowerCase()
        return blockedUsers.filter(b => 
            b.user.name?.toLowerCase().includes(q) ||
            b.user.username?.toLowerCase().includes(q)
        )
    }, [blockedUsers, searchQuery])

    const { mutate: updateBlockStatus, isPending } = usePatchApi("/conversations")

    const handleUnblock = (conversationId: number) => {
        updateBlockStatus({ 
            id: `${conversationId}/block`,
            body: { block: false } 
        }, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['blocked-users'] })
                queryClient.invalidateQueries({ queryKey: ['conversations'] })
            }
        })
    }

    return (
        <div id="section-privacy" className="overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm transition-all">
            {/* Accordion Header */}
            <button
                type="button"
                onClick={toggleOpen}
                className="flex w-full items-center justify-between p-5 sm:p-6 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 text-left cursor-pointer"
            >
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                    <div className="flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shadow-2xs">
                        <Lock size={20} className="stroke-[2.5]" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                            Privacy
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            Control who can see your information and manage blocked users.
                        </p>
                    </div>
                </div>
                <ChevronDown 
                    size={20} 
                    className={`text-slate-400 transition-transform duration-300 flex-shrink-0 ml-2 ${currentOpen ? "rotate-180 text-purple-600 dark:text-purple-400" : ""}`} 
                />
            </button>

            {currentOpen && (
                <div className="border-t border-slate-100 dark:border-slate-800/80 p-5 sm:p-7 pt-4 space-y-6 animate-in slide-in-from-top-2 duration-200">
                    
                    {/* Privacy Settings Options List */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {/* 1. Last seen & online status */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 first:pt-1">
                            <div className="flex items-start gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                                    <Eye size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                                        Last seen & online status
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        Choose who can see when you were last active and if you're online.
                                    </p>
                                </div>
                            </div>
                            <div className="flex-shrink-0 sm:ml-4">
                                <select
                                    value={lastSeenStatus}
                                    onChange={(e) => handleLastSeenChange(e.target.value)}
                                    className="w-full sm:w-auto px-3.5 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
                                >
                                    <option value="Everyone">Everyone</option>
                                    <option value="My contacts">My contacts</option>
                                    <option value="Nobody">Nobody</option>
                                </select>
                            </div>
                        </div>

                        {/* 2. Profile photo visibility */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                            <div className="flex items-start gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                                    <ImageIcon size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                                        Profile photo visibility
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        Choose who can see your profile photo.
                                    </p>
                                </div>
                            </div>
                            <div className="flex-shrink-0 sm:ml-4">
                                <select
                                    value={photoVisibility}
                                    onChange={(e) => handlePhotoVisibilityChange(e.target.value)}
                                    className="w-full sm:w-auto px-3.5 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
                                >
                                    <option value="Everyone">Everyone</option>
                                    <option value="My contacts">My contacts</option>
                                    <option value="Nobody">Nobody</option>
                                </select>
                            </div>
                        </div>

                        {/* 3. Read receipts */}
                        <div className="flex items-center justify-between gap-3 py-4">
                            <div className="flex items-start gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                                    <Check size={16} className="stroke-[2.5]" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                                        Read receipts
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        Let others know when you've read their messages.
                                    </p>
                                </div>
                            </div>
                            {/* Toggle Switch */}
                            <button
                                type="button"
                                role="switch"
                                aria-checked={readReceipts}
                                onClick={handleReadReceiptsToggle}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 ${
                                    readReceipts ? "bg-purple-600" : "bg-slate-300 dark:bg-slate-700"
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                        readReceipts ? "translate-x-5" : "translate-x-0"
                                    }`}
                                />
                            </button>
                        </div>

                        {/* 4. Blocked users overview row */}
                        <div className="flex items-center justify-between gap-3 py-4">
                            <div className="flex items-start gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center shrink-0 mt-0.5">
                                    <Ban size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                                        Blocked users
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        Manage users you have blocked. They won't be able to message or call you.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                <span>{blockedUsers.length} blocked</span>
                                <ChevronRight size={14} className="text-slate-400" />
                            </div>
                        </div>
                    </div>

                    {/* Blocked Users Embedded Section */}
                    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-4 sm:p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <span>Blocked Users</span>
                                <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 text-[10px] font-bold">
                                    {blockedUsers.length}
                                </span>
                            </h3>

                            {/* Search blocked users input */}
                            <div className="relative w-full sm:w-64">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search blocked users..."
                                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                />
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 size={22} className="animate-spin text-purple-600" />
                            </div>
                        ) : filteredBlockedUsers.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {searchQuery ? "No blocked users match your search." : "No blocked users."}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
                                {filteredBlockedUsers.map((item) => (
                                    <div 
                                        key={item.id} 
                                        className="flex items-center justify-between p-3 sm:p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors gap-3"
                                    >
                                        {/* Avatar & User Details */}
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                                                {item.user.avatar ? (
                                                    <img src={item.user.avatar} className="h-full w-full object-cover" />
                                                ) : (
                                                    (item.user.name?.[0] || item.user.username?.[0] || "U").toUpperCase()
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                                    {item.user.name}
                                                </p>
                                                <p className="text-[11px] text-slate-400 truncate">
                                                    @{item.user.username}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Blocked date & Unblock action */}
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="hidden md:inline text-[11px] text-slate-400">
                                                Blocked on {new Date(item.blocked_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => handleUnblock(item.id)}
                                                disabled={isPending}
                                                className="px-3.5 py-1.5 rounded-full border border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                                            >
                                                Unblock
                                            </button>

                                            <button
                                                type="button"
                                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default PrivacySettings
