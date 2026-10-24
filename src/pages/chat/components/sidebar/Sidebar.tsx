import { Home, Plus, Sun, Moon, MessageSquare, Users } from "lucide-react"
import { useNavigate } from "react-router-dom"
import DirectList from "@/pages/chat/components/sidebar/DirectList"
import GroupList from "@/pages/chat/components/sidebar/GroupList"
import Button from "@/common/Button"
import type { IGroup, IUser } from "@/types"
import { ROUTES } from "@/constants/routes"
import { useTheme } from "@/common/ThemeProvider"

type Tab = "dm" | "groups"

interface Props {
    selectedUserId: number | null
    selectedGroupId: number | null
    onSelectUser: (user: IUser) => void
    onSelectGroup: (group: IGroup) => void
    onCreateGroup: () => void
    activeTab: Tab
    onTabChange: (tab: Tab) => void
}

const Sidebar = ({ selectedUserId, selectedGroupId, onSelectUser, onSelectGroup, onCreateGroup, activeTab, onTabChange }: Props) => {
    const navigate = useNavigate()
    const { theme, toggleTheme } = useTheme()

    return (
        <div className="flex h-full flex-col bg-card select-none">
            {/* Header: All Conversations + Actions */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200/90 dark:border-slate-800 px-5 py-4">
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-indigo-600/25">
                        N
                    </div>
                    <div>
                        <h1 className="font-display text-base font-extrabold text-slate-900 dark:text-foreground leading-tight">
                            All Conversations
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    {/* Theme Toggle */}
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
                        aria-label="Toggle theme"
                    >
                        {theme === "light" ? <Sun size={15} className="text-amber-500" /> : <Moon size={15} className="text-indigo-400" />}
                    </button>

                    {/* Back to Home */}
                    <button
                        type="button"
                        onClick={() => navigate(ROUTES.HOME.path)}
                        className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        title="Back to Home"
                    >
                        <Home size={15} />
                    </button>
                </div>
            </div>

            {/* Segmented Filter Pills */}
            <div className="px-4 pt-3 pb-2 flex-shrink-0">
                <div className="flex items-center gap-2 p-1 bg-slate-100/90 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
                    <button
                        type="button"
                        onClick={() => onTabChange("dm")}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition-all duration-200 cursor-pointer ${
                            activeTab === "dm"
                                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50"
                        }`}
                    >
                        <MessageSquare size={13} className="stroke-[2.2]" />
                        <span>Direct Messages</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onTabChange("groups")}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition-all duration-200 cursor-pointer ${
                            activeTab === "groups"
                                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50"
                        }`}
                    >
                        <Users size={13} className="stroke-[2.2]" />
                        <span>Groups</span>
                    </button>
                </div>
            </div>

            {/* List container */}
            <div className="flex-1 overflow-hidden">
                {activeTab === "dm" ? (
                    <DirectList
                        selectedUserId={selectedUserId}
                        onSelectUser={onSelectUser}
                    />
                ) : (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex-1 overflow-hidden">
                            <GroupList
                                selectedGroupId={selectedGroupId}
                                onSelectGroup={onSelectGroup}
                            />
                        </div>
                        <div className="p-3 border-t border-slate-200/90 dark:border-slate-800 bg-card">
                            <Button 
                                variant="primary" 
                                fullWidth 
                                onClick={onCreateGroup}
                                className="py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={16} className="stroke-[2.5]" />
                                <span>Create New Group</span>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Sidebar