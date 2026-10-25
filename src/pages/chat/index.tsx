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

            {/* Sidebar Container with Slim Icon Rail */}
            <div className={`
                ${(selectedUser || selectedGroup) ? "hidden lg:block" : "block"}
                w-full md:w-[380px] lg:w-[420px] shrink-0 bg-card border-r border-slate-200/90 dark:border-slate-800 h-full
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
                flex-1 flex flex-col overflow-hidden w-full relative h-full bg-slate-50/50 dark:bg-[#0c1220]/50
            `}>
                {!selectedUser && !selectedGroup && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden select-none">
                        {/* Ambient glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col items-center max-w-sm">
                            <div className="h-20 w-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-600/25 mb-6 text-white font-extrabold text-3xl font-display">
                                N
                            </div>
                            <h2 className="text-2xl font-display font-extrabold text-slate-900 dark:text-foreground mb-2 tracking-tight">
                                NexusApp Messages
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                Choose a contact or group from the left panel to start an encrypted, real-time conversation.
                            </p>
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>End-to-End Encrypted & Private</span>
                            </div>
                        </div>
                    </div>
                )}

                {selectedUser && (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        <DirectChat
                            key={`direct-${selectedUser.id}`}
                            user={selectedUser}
                            onBack={handleBack}
                            onClose={() => setSelectedUser(null)}
                        />
                    </div>
                )}

                {selectedGroup && (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        <GroupChat
                            key={`group-${selectedGroup.id}`}
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