import { useState, useEffect } from "react"
import {
    Plus,
    Sun,
    Moon,
    MessageSquare,
    Users,
    Phone,
    Star,
    Archive,
    Search
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import { getUser } from "@/redux/slices/auth.slice"
import { useQueryClient } from "@tanstack/react-query"
import { useSocket } from "@/hooks/socket"
import { CHAT_EVENTS, GROUP_EVENTS } from "@/pages/chat/constants"
import DirectList from "@/pages/chat/components/sidebar/DirectList"
import GroupList from "@/pages/chat/components/sidebar/GroupList"
import StarredList from "@/pages/chat/components/sidebar/StarredList"
import CallList from "@/pages/chat/components/sidebar/CallList"
import type { IGroup, IUser } from "@/types"
import { ROUTES } from "@/constants/routes"
import { useTheme } from "@/common/ThemeProvider"
import { useGetApi } from "@/hooks/api"

export type SidebarNavTab = "all" | "groups" | "calls" | "starred" | "archived"

interface Props {
    selectedUserId: number | null
    selectedGroupId: number | null
    onSelectUser: (user: IUser) => void
    onSelectGroup: (group: IGroup) => void
    onCreateGroup: () => void
    activeTab: "dm" | "groups" | string
    onTabChange: (tab: any) => void
}

const Sidebar = ({
    selectedUserId,
    selectedGroupId,
    onSelectUser,
    onSelectGroup,
    onCreateGroup,
    activeTab,
    onTabChange,
}: Props) => {
    const navigate = useNavigate()
    const { theme, toggleTheme } = useTheme()
    const authUser = useSelector(getUser)
    const [search, setSearch] = useState("")

    // Map activeTab to navigation tab
    const [navTab, setNavTab] = useState<SidebarNavTab>(
        activeTab === "groups" ? "groups" : "all"
    )

    const socket = useSocket()
    const queryClient = useQueryClient()

    // Real-time synchronization for starred messages counter
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

    const { data: convData } = useGetApi<any[]>("/conversations", undefined, {
        queryKey: "conversations",
        staleTime: 10000,
    })
    const { data: archivedConvData } = useGetApi<any[]>("/conversations?archived=true", undefined, {
        queryKey: "conversations-archived",
        staleTime: 10000,
    })
    const { data: groupData } = useGetApi<any>("/groups", undefined, {
        queryKey: "groups-count",
        staleTime: 10000,
    })
    const { data: starredMsgData } = useGetApi<any[]>("/starred-messages", undefined, {
        queryKey: "starred-messages",
        staleTime: 0,
    })

    const conversationsCount = convData?.data?.length ?? 0
    const archivedCount = archivedConvData?.data?.length ?? 0
    const starredCount = starredMsgData?.data?.length ?? 0
    const groupsCount =
        (groupData?.data as any)?.count ??
        (groupData?.data as any)?.groups?.length ??
        (Array.isArray(groupData?.data) ? groupData.data.length : 0)

    const handleSelectNav = (tab: SidebarNavTab) => {
        setNavTab(tab)
        if (tab === "groups") {
            onTabChange("groups")
        } else if (tab === "all") {
            onTabChange("dm")
        }
    }

    return (
        <div className="flex h-full w-full select-none overflow-hidden bg-card border-r border-slate-200/90 dark:border-slate-800">
            {/* ── 1. LEFT SLIM ICON RAIL (Slack / Discord / WhatsApp style, w-16) ── */}
            <div className="w-16 shrink-0 h-full flex flex-col items-center justify-between py-3.5 border-r border-slate-200/90 dark:border-slate-800/80 bg-slate-50/80 dark:bg-[#0c1220]/70 backdrop-blur-sm">
                {/* Top Section: App Glyph & Main Tabs */}
                <div className="flex flex-col items-center gap-3 w-full">
                    {/* Brand / Home Button */}
                    <button
                        type="button"
                        onClick={() => navigate(ROUTES.HOME.path)}
                        className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-base shadow-md shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        title="NexusApp Home"
                    >
                        N
                    </button>

                    <div className="w-7 h-px bg-slate-200 dark:bg-slate-800/90 my-1" />

                    {/* Navigation Rail Buttons */}
                    <div className="flex flex-col items-center gap-2 w-full px-2">
                        {/* All Chats */}
                        <button
                            type="button"
                            onClick={() => handleSelectNav("all")}
                            className={`relative h-11 w-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer group ${
                                navTab === "all"
                                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/35"
                                    : "text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/80"
                            }`}
                            title="All Chats"
                        >
                            <MessageSquare size={19} className={navTab === "all" ? "stroke-[2.3]" : "stroke-[1.8]"} />
                            {conversationsCount > 0 && (
                                <span className={`absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold leading-tight ${
                                    navTab === "all"
                                        ? "bg-white text-purple-700 shadow-xs ring-2 ring-purple-600"
                                        : "bg-purple-600 text-white shadow-xs"
                                }`}>
                                    {conversationsCount}
                                </span>
                            )}
                        </button>

                        {/* Groups */}
                        <button
                            type="button"
                            onClick={() => handleSelectNav("groups")}
                            className={`relative h-11 w-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer group ${
                                navTab === "groups"
                                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/35"
                                    : "text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/80"
                            }`}
                            title="Groups"
                        >
                            <Users size={19} className={navTab === "groups" ? "stroke-[2.3]" : "stroke-[1.8]"} />
                            {groupsCount > 0 && (
                                <span className={`absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold leading-tight ${
                                    navTab === "groups"
                                        ? "bg-white text-purple-700 shadow-xs ring-2 ring-purple-600"
                                        : "bg-purple-600 text-white shadow-xs"
                                }`}>
                                    {groupsCount}
                                </span>
                            )}
                        </button>

                        {/* Calls */}
                        <button
                            type="button"
                            onClick={() => handleSelectNav("calls")}
                            className={`relative h-11 w-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                                navTab === "calls"
                                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/35"
                                    : "text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/80"
                            }`}
                            title="Calls"
                        >
                            <Phone size={19} className={navTab === "calls" ? "stroke-[2.3]" : "stroke-[1.8]"} />
                        </button>

                        {/* Starred */}
                        <button
                            type="button"
                            onClick={() => handleSelectNav("starred")}
                            className={`relative h-11 w-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                                navTab === "starred"
                                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/35"
                                    : "text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/80"
                            }`}
                            title="Starred"
                        >
                            <Star size={19} className={navTab === "starred" ? "stroke-[2.3]" : "stroke-[1.8]"} />
                            {starredCount > 0 && (
                                <span className={`absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold leading-tight ${
                                    navTab === "starred"
                                        ? "bg-white text-purple-700 shadow-xs ring-2 ring-purple-600"
                                        : "bg-purple-600 text-white shadow-xs"
                                }`}>
                                    {starredCount}
                                </span>
                            )}
                        </button>

                        {/* Archived */}
                        <button
                            type="button"
                            onClick={() => handleSelectNav("archived")}
                            className={`relative h-11 w-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                                navTab === "archived"
                                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/35"
                                    : "text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/80"
                            }`}
                            title="Archived"
                        >
                            <Archive size={19} className={navTab === "archived" ? "stroke-[2.3]" : "stroke-[1.8]"} />
                            {archivedCount > 0 && (
                                <span className={`absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold leading-tight ${
                                    navTab === "archived"
                                        ? "bg-white text-purple-700 shadow-xs ring-2 ring-purple-600"
                                        : "bg-purple-600 text-white shadow-xs"
                                }`}>
                                    {archivedCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Bottom Section: Theme Toggle & User Profile */}
                <div className="flex flex-col items-center gap-3 w-full px-2">
                    {/* Theme Toggle */}
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="h-10 w-10 flex items-center justify-center rounded-2xl bg-slate-200/60 hover:bg-slate-300/70 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
                        aria-label="Toggle theme"
                    >
                        {theme === "light" ? (
                            <Sun size={17} className="text-amber-500" />
                        ) : (
                            <Moon size={17} className="text-indigo-400" />
                        )}
                    </button>

                    {/* Profile Avatar / Settings Shortcut */}
                    <button
                        type="button"
                        onClick={() => navigate(ROUTES.PROFILE.path)}
                        className="relative h-10 w-10 rounded-2xl flex items-center justify-center hover:ring-2 hover:ring-purple-500/50 transition-all cursor-pointer group"
                        title="Profile & Settings"
                    >
                        {authUser?.avatar ? (
                            <img
                                src={authUser.avatar}
                                alt={authUser.name || authUser.username}
                                className="h-9 w-9 rounded-xl object-cover ring-2 ring-white dark:ring-slate-800"
                            />
                        ) : (
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-white dark:ring-slate-800">
                                {(authUser?.name || authUser?.username || "U").slice(0, 2).toUpperCase()}
                            </div>
                        )}
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                    </button>
                </div>
            </div>

            {/* ── 2. RIGHT CONVERSATION PANEL (100% Height for Chats) ── */}
            <div className="flex-1 h-full flex flex-col bg-card overflow-hidden">
                {/* Panel Header */}
                <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200/90 dark:border-slate-800 px-4 py-3.5">
                    <div>
                        <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-foreground tracking-tight">
                            {navTab === "all" && "Messages"}
                            {navTab === "groups" && "Groups"}
                            {navTab === "calls" && "Calls"}
                            {navTab === "starred" && "Starred Messages"}
                            {navTab === "archived" && "Archived"}
                        </h2>
                        <p className="text-[11px] font-medium text-slate-400">
                            {navTab === "all" && `${conversationsCount} active chat${conversationsCount === 1 ? "" : "s"}`}
                            {navTab === "groups" && `${groupsCount} active group${groupsCount === 1 ? "" : "s"}`}
                            {navTab === "calls" && "Voice & video history"}
                            {navTab === "starred" && `${starredCount} saved message${starredCount === 1 ? "" : "s"}`}
                            {navTab === "archived" && `${archivedCount} archived chat${archivedCount === 1 ? "" : "s"}`}
                        </p>
                    </div>

                    {navTab === "groups" && (
                        <button
                            type="button"
                            onClick={onCreateGroup}
                            className="h-8 w-8 rounded-full bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center transition-all cursor-pointer"
                            title="Create New Group"
                        >
                            <Plus size={16} className="stroke-[2.5]" />
                        </button>
                    )}
                </div>

                {/* Search Bar */}
                <div className="px-3.5 pt-3 pb-2 flex-shrink-0">
                    <div className="relative group">
                        <Search
                            size={15}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400"
                        />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={
                                navTab === "groups"
                                    ? "Search groups..."
                                    : navTab === "calls"
                                    ? "Search call history..."
                                    : "Search conversations..."
                            }
                            className="w-full pl-10 pr-12 py-2 text-xs bg-slate-100 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded-md pointer-events-none shadow-2xs">
                            ⌘ K
                        </span>
                    </div>
                </div>

                {/* Section Divider: Recent */}
                {navTab !== "starred" && (
                    <div className="px-4 pt-1.5 pb-1 flex-shrink-0 flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {navTab === "archived" ? "Archived Chats" : "Recent"}
                        </span>
                    </div>
                )}

                {/* Full-Height Scrollable Conversation List */}
                <div className="flex-1 overflow-hidden">
                    {navTab === "all" && (
                        <DirectList
                            selectedUserId={selectedUserId}
                            onSelectUser={onSelectUser}
                            externalSearch={search}
                        />
                    )}

                    {navTab === "groups" && (
                        <GroupList
                            selectedGroupId={selectedGroupId}
                            onSelectGroup={onSelectGroup}
                            externalSearch={search}
                        />
                    )}

                    {navTab === "calls" && (
                        <CallList
                            onSelectUser={onSelectUser}
                            externalSearch={search}
                        />
                    )}

                    {navTab === "starred" && (
                        <StarredList
                            onSelectUser={onSelectUser}
                            onSelectGroup={onSelectGroup}
                            onTabChange={onTabChange}
                            externalSearch={search}
                        />
                    )}

                    {navTab === "archived" && (
                        <DirectList
                            selectedUserId={selectedUserId}
                            onSelectUser={onSelectUser}
                            externalSearch={search}
                            isArchived={true}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default Sidebar