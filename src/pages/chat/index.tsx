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

const ChatPage = () => {
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null)
    const [selectedGroup, setSelectedGroup] = useState<IGroup | null>(null)
    const [showCreateGroup, setShowCreateGroup] = useState<boolean>(false)
    const [activeTab, setActiveTab] = useState<"dm" | "groups" | "all">("dm")

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
        }
    }, [redirectGroupData, openGroupId])

    const handleSelectUser = (user: IUser) => {
        setSelectedUser(user)
        setSelectedGroup(null)
        setActiveTab("dm")
    }

    const handleSelectGroup = (group: IGroup) => {
        setSelectedGroup(group)
        setSelectedUser(null)
        setActiveTab("groups")
    }

    const handleGroupCreated = (group: IGroup) => {
        setSelectedGroup(group)
        setSelectedUser(null)
        setActiveTab("groups")
    }

    const handleGroupLeft = () => {
        setSelectedGroup(null)
    }

    const handleOpenDM = (user: IUser) => {
        setSelectedUser(user)
        setSelectedGroup(null)
        setActiveTab("dm")
    }

    const handleBack = () => {
        setSelectedUser(null)
        setSelectedGroup(null)
    }

    return (
        <div className="h-full flex bg-background overflow-hidden relative">

            {/* Sidebar Container */}
            <div className={`
                ${(selectedUser || selectedGroup) ? "hidden lg:block" : "block"}
                w-full lg:w-80 md:lg:w-96 lg:lg:w-[400px] shrink-0 bg-card border-r h-full
            `}>
                <Sidebar
                    selectedUserId={selectedUser?.id ?? null}
                    selectedGroupId={selectedGroup?.id ?? null}
                    onSelectUser={handleSelectUser}
                    onSelectGroup={handleSelectGroup}
                    onCreateGroup={() => setShowCreateGroup(true)}
                    activeTab={activeTab === "all" ? "dm" : activeTab}
                    onTabChange={(tab) => setActiveTab(tab)}
                />
            </div>

            {/* Main Chat Area */}
            <div className={`
                ${(selectedUser || selectedGroup) ? "block" : "hidden lg:flex"}
                flex-1 flex flex-col overflow-hidden w-full relative h-full
            `}>
                {!selectedUser && !selectedGroup && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/20">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 text-muted-foreground">
                            <Menu size={40} />
                        </div>
                        <h2 className="text-xl font-bold text-foreground mb-2">Select a conversation</h2>
                        <p className="text-muted-foreground max-w-xs">
                            Choose a friend or group from the sidebar to start chatting.
                        </p>
                    </div>
                )}

                {selectedUser && (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        <DirectChat
                            user={selectedUser}
                            onBack={handleBack}
                            onClose={() => setSelectedUser(null)}
                        />
                    </div>
                )}

                {selectedGroup && (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        <GroupChat
                            group={selectedGroup}
                            onGroupLeft={handleGroupLeft}
                            onOpenDM={handleOpenDM}
                            onBack={handleBack}
                            onClose={() => setSelectedGroup(null)}
                        />
                    </div>
                )}
            </div>

            <CreateGroupModal
                open={showCreateGroup}
                onClose={() => setShowCreateGroup(false)}
                onCreated={handleGroupCreated}
            />
        </div>
    )
}

export default ChatPage