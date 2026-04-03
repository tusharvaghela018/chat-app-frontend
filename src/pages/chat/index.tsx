import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import Sidebar from "@/pages/chat/components/sidebar/Sidebar"
import DirectChat from "@/pages/chat/components/DirectChat"
import GroupChat from "@/pages/chat/components/GroupChat"
import CreateGroupModal from "@/pages/chat/components/group/CreateGroupModal"
import type { IUser } from "@/types"
import type { IGroup } from "@/types"
import { useGetApi } from "@/hooks/api"
import { Menu } from "lucide-react"
import Button from "@/common/Button"

const ChatPage = () => {
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null)
    const [selectedGroup, setSelectedGroup] = useState<IGroup | null>(null)
    const [showCreateGroup, setShowCreateGroup] = useState<boolean>(false)
    const [activeTab, setActiveTab] = useState<"direct" | "groups" | "all">("direct")
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    const location = useLocation()
    const openGroupId = location.state?.openGroupId

    // fetch group detail if redirected from invite link
    const { data: redirectGroupData } = useGetApi<{ group: IGroup }>(
        `/groups/${openGroupId}`,
        undefined,
        {
            queryKey: `group-${openGroupId}`,
            enabled: !!openGroupId,
        }
    )

    useEffect(() => {
        if (!openGroupId || !redirectGroupData) return
        const group = (redirectGroupData as any)?.data?.group
        if (group) {
            setSelectedGroup(group)
            setSelectedUser(null)
            setActiveTab("groups")
            setIsSidebarOpen(false) // Close sidebar on mobile when group is selected
        }
    }, [redirectGroupData, openGroupId])

    const handleSelectUser = (user: IUser) => {
        setSelectedUser(user)
        setSelectedGroup(null)
        setActiveTab("direct")
        setIsSidebarOpen(false) // Close sidebar on mobile
    }

    const handleSelectGroup = (group: IGroup) => {
        setSelectedGroup(group)
        setSelectedUser(null)
        setActiveTab("groups")
        setIsSidebarOpen(false) // Close sidebar on mobile
    }

    const handleGroupCreated = (group: IGroup) => {
        setSelectedGroup(group)
        setSelectedUser(null)
        setActiveTab("groups")
        setIsSidebarOpen(false)
    }

    const handleGroupLeft = () => {
        setSelectedGroup(null)
        setIsSidebarOpen(true)
    }

    const handleOpenDM = (user: IUser) => {
        setSelectedUser(user)
        setSelectedGroup(null)
        setActiveTab("direct")
        setIsSidebarOpen(false)
    }

    return (
        <div className="h-[calc(100vh-64px)] flex bg-background overflow-hidden relative">
            
            {/* Sidebar with responsive classes */}
            <div className={`
                absolute inset-y-0 left-0 z-30 w-[85%] sm:w-80 md:w-96 lg:w-[400px] transform transition-transform duration-300 ease-in-out bg-card border-r shadow-xl lg:shadow-none
                ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:static lg:block"}
            `}>
                <Sidebar
                    selectedUserId={selectedUser?.id ?? null}
                    selectedGroupId={selectedGroup?.id ?? null}
                    onSelectUser={handleSelectUser}
                    onSelectGroup={handleSelectGroup}
                    onCreateGroup={() => setShowCreateGroup(true)}
                    activeTab={activeTab === "all" ? "direct" : activeTab}
                    onTabChange={(tab) => setActiveTab(tab)}
                />
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col overflow-hidden w-full relative h-full">
                {/* Mobile Toggle Button (only visible when sidebar is closed on mobile) */}
                {(!selectedUser && !selectedGroup) && !isSidebarOpen && (
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="lg:hidden absolute top-4 left-4 z-20 p-2 rounded-lg bg-background border border-border text-foreground shadow-sm"
                    >
                        <Menu size={20} />
                    </button>
                )}

                {!selectedUser && !selectedGroup && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/20">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 text-muted-foreground">
                            <Menu size={40} />
                        </div>
                        <h2 className="text-xl font-bold text-foreground mb-2">Select a conversation</h2>
                        <p className="text-muted-foreground max-w-xs">
                            Choose a friend or group from the sidebar to start chatting.
                        </p>
                        <Button 
                            variant="primary" 
                            className="mt-6 lg:hidden"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            Open Sidebar
                        </Button>
                    </div>
                )}

                {selectedUser && (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        <DirectChat user={selectedUser} onBack={() => setIsSidebarOpen(true)} />
                    </div>
                )}

                {selectedGroup && (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        <GroupChat
                            group={selectedGroup}
                            onGroupLeft={handleGroupLeft}
                            onOpenDM={handleOpenDM}
                            onBack={() => setIsSidebarOpen(true)}
                        />
                    </div>
                )}
            </div>

            <CreateGroupModal
                open={showCreateGroup}
                onClose={() => setShowCreateGroup(false)}
                onCreated={handleGroupCreated}
            />
            
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-20 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    )
}

export default ChatPage