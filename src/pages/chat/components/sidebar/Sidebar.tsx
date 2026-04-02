import { ArrowLeft, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import DirectList from "@/pages/chat/components/sidebar/DirectList"
import GroupList from "@/pages/chat/components/sidebar/GroupList"
import Button from "@/common/Button"
import type { IGroup, IUser } from "@/types"
import { ROUTES } from "@/constants/routes"

type Tab = "direct" | "groups"

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

    return (
        <div className="flex h-full flex-col bg-card">
            {/* header */}
            <div className="flex flex-shrink-0 items-center justify-between border-b px-6 py-5">
                <h1 className="font-display text-xl font-bold text-foreground">Messages</h1>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(ROUTES.HOME.path)}
                    className="text-muted-foreground hover:text-primary"
                >
                    <ArrowLeft size={16} className="mr-1" />
                    Home
                </Button>
            </div>

            {/* tabs */}
            <div className="flex flex-shrink-0 border-b p-1 mx-4 my-4 bg-muted/50 rounded-xl">
                <button
                    onClick={() => onTabChange("direct")}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all
                        ${activeTab === "direct"
                            ? "bg-card text-primary shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Direct
                </button>
                <button
                    onClick={() => onTabChange("groups")}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all
                        ${activeTab === "groups"
                            ? "bg-card text-primary shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Groups
                </button>
            </div>

            {/* Search/Filter Placeholder (Minimal UI) */}
            <div className="px-4 mb-4">
                <div className="flex items-center gap-2 rounded-xl border bg-background/50 px-3 py-2 text-muted-foreground focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                    <span className="text-xs font-medium">Search chats...</span>
                </div>
            </div>

            {/* list */}
            <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
                {activeTab === "direct" ? (
                    <DirectList
                        selectedUserId={selectedUserId}
                        onSelectUser={onSelectUser}
                    />
                ) : (
                    <div className="flex flex-col gap-4">
                         <GroupList
                            selectedGroupId={selectedGroupId}
                            onSelectGroup={onSelectGroup}
                        />
                         <Button 
                            variant="outline" 
                            fullWidth 
                            onClick={onCreateGroup}
                            className="border-dashed border-2 py-6 rounded-2xl hover:bg-primary/5 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all mx-2 w-[calc(100%-16px)]"
                        >
                            <Plus size={18} className="mr-2" />
                            Create New Group
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Sidebar