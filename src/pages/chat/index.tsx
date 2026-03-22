import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import Sidebar from "@/pages/chat/components/sidebar/Sidebar"
import DirectChat from "@/pages/chat/components/DirectChat"
import GroupChat from "@/pages/chat/components/GroupChat"
import CreateGroupModal from "@/pages/chat/components/group/CreateGroupModal"
import type { IUser } from "@/types"
import type { IGroup } from "@/types"
import { useGetApi } from "@/hooks/api"

const ChatPage = () => {
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null)
    const [selectedGroup, setSelectedGroup] = useState<IGroup | null>(null)
    const [showCreateGroup, setShowCreateGroup] = useState<boolean>(false)
    const [activeTab, setActiveTab] = useState<"direct" | "groups">("direct")

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
        setActiveTab("direct")  // ← switch tab
    }

    const handleSelectGroup = (group: IGroup) => {
        setSelectedGroup(group)
        setSelectedUser(null)
        setActiveTab("groups")  // ← switch tab
    }

    const handleGroupCreated = (group: IGroup) => {
        setSelectedGroup(group)
        setSelectedUser(null)
        setActiveTab("groups")  // ← switch tab
    }

    const handleGroupLeft = () => {
        setSelectedGroup(null)
    }

    const handleOpenDM = (user: IUser) => {
        setSelectedUser(user)
        setSelectedGroup(null)
        setActiveTab("direct")  // ← switch tab to direct
    }

    return (
        <div className="h-[calc(100vh-60px)] flex bg-gray-100 overflow-hidden">

            <Sidebar
                selectedUserId={selectedUser?.id ?? null}
                selectedGroupId={selectedGroup?.id ?? null}
                onSelectUser={handleSelectUser}
                onSelectGroup={handleSelectGroup}
                onCreateGroup={() => setShowCreateGroup(true)}
                activeTab={activeTab}               // ← pass down
                onTabChange={setActiveTab}          // ← pass down
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                {!selectedUser && !selectedGroup && (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-gray-400 text-sm">
                            Select a chat or group to get started
                        </p>
                    </div>
                )}

                {selectedUser && <DirectChat user={selectedUser} />}

                {selectedGroup && (
                    <GroupChat
                        group={selectedGroup}
                        onGroupLeft={handleGroupLeft}
                        onOpenDM={handleOpenDM}
                    />
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