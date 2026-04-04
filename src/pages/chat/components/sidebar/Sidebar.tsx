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
            <div className="px-4 py-2 flex-shrink-0">
                <div className="flex p-1 bg-muted/50 rounded-xl border border-border">
                    <button
                        onClick={() => onTabChange("direct")}
                        className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all duration-200
                            ${activeTab === "direct"
                                ? "bg-card text-primary shadow-sm ring-1 ring-black/5"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                    >
                        Direct
                    </button>
                    <button
                        onClick={() => onTabChange("groups")}
                        className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all duration-200
                            ${activeTab === "groups"
                                ? "bg-card text-primary shadow-sm ring-1 ring-black/5"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                    >
                        Groups
                    </button>
                </div>
            </div>

            {/* list container */}
            <div className="flex-1 overflow-hidden">
                {activeTab === "direct" ? (
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
                        <div className="p-4 border-t bg-card">
                            <Button 
                                variant="outline" 
                                fullWidth 
                                onClick={onCreateGroup}
                                className="border-dashed border-2 py-6 rounded-2xl hover:bg-primary/5 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all"
                            >
                                <Plus size={18} className="mr-2" />
                                Create New Group
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Sidebar