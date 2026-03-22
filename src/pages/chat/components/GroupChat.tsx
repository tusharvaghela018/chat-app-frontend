import { useState, useRef, useEffect } from "react"
import { Users, Info, UserPlus, UserMinus, MoreVertical, MessageSquare, Shield, ShieldOff, LogOut, Trash2, ChevronRight, Link2, Check, Copy } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { useGetApi, useDeleteApi, usePatchApi, usePostApi } from "@/hooks/api"
import { getUser } from "@/redux/slices/auth.slice"
import SidebarPanel from "@/common/Sidebar"
import ConfirmDialog from "@/common/confirmDialog"
import AddMemberModal from "@/pages/chat/components/group/AddMemberModal"
import GroupSettingsModal from "@/pages/chat/components/group/GroupSettingsModal"
import EditGroupModal from "@/pages/chat/components/group/EditGroupModal"
import JoinRequestsModal from "@/pages/chat/components/group/JoinRequestsModal"
import type { IGroup, IGroupMember, IUser } from "@/types"
import Button from "@/common/Button"

interface Props {
    group: IGroup
    onGroupLeft: () => void
    onOpenDM: (user: IUser) => void
}

// three dots menu for each member
const MemberMenu = ({
    member,
    isAdmin,
    canRemove,
    onDM,
    onMakeAdmin,
    onRemoveAdmin,
    onRemove,
}: {
    member: IGroupMember
    isAdmin: boolean
    canRemove: boolean
    onDM: () => void
    onMakeAdmin: () => void
    onRemoveAdmin: () => void
    onRemove: () => void
}) => {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [])

    return (
        <div className="relative" ref={ref}>
            <Button
                onClick={() => setOpen((prev) => !prev)}
                className="p-1 rounded text-gray-500 hover:text-gray-300 transition"
            >
                <MoreVertical size={14} />
            </Button>

            {open && (
                <div className="absolute right-0 top-6 z-50 w-44 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">

                    {/* open DM */}
                    <Button
                        onClick={() => { onDM(); setOpen(false) }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 transition"
                    >
                        <MessageSquare size={13} />
                        Send message
                    </Button>

                    {/* make/remove admin — only admins see this */}
                    {isAdmin && (
                        member.role === "member" ? (
                            <Button
                                onClick={() => { onMakeAdmin(); setOpen(false) }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 transition"
                            >
                                <Shield size={13} />
                                Make admin
                            </Button>
                        ) : (
                            <Button
                                onClick={() => { onRemoveAdmin(); setOpen(false) }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 transition"
                            >
                                <ShieldOff size={13} />
                                Remove as admin
                            </Button>
                        )
                    )}

                    {/* remove from group */}
                    {canRemove && (
                        <Button
                            onClick={() => { onRemove(); setOpen(false) }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-gray-700 transition"
                        >
                            <UserMinus size={13} />
                            Remove from group
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}

const GroupChat = ({ group, onGroupLeft, onOpenDM }: Props) => {
    const authUser = useSelector(getUser)
    const queryClient = useQueryClient()

    const [showInfo, setShowInfo] = useState(false)
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showAddMember, setShowAddMember] = useState(false)
    const [memberToRemove, setMemberToRemove] = useState<IGroupMember | null>(null)
    const [memberToUpdateRole, setMemberToUpdateRole] = useState<{ member: IGroupMember; newRole: "admin" | "member" } | null>(null)
    const [showSettings, setShowSettings] = useState(false)
    const [showEditGroup, setShowEditGroup] = useState(false)
    const [inviteLink, setInviteLink] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [showJoinRequests, setShowJoinRequests] = useState(false)


    const { data: liveData, isLoading } = useGetApi<{ group: IGroup }>(
        `/groups/${group.id}`,
        undefined,
        {
            queryKey: `group-${group.id}`,
            enabled: true,
        }
    )

    const groupDetail = liveData?.data?.group as IGroup | undefined

    const liveGroup = liveData?.data?.group ?? group
    const myRole = group.members?.[0]?.role
    const isAdmin = myRole === "admin"
    const memberCount = group.member_count ?? 0

    const canAddMembers =
        liveGroup.settings?.who_can_add_members === "members" ||
        (liveGroup.settings?.who_can_add_members === "admins" && isAdmin)

    const canRemoveMembers =
        liveGroup.settings?.who_can_remove_members === "members" ||
        (liveGroup.settings?.who_can_remove_members === "admins" && isAdmin)

    const canEditInfo =
        liveGroup.settings?.who_can_edit_info === "members" ||
        (liveGroup.settings?.who_can_edit_info === "admins" && isAdmin)

    const canShareLink =
        liveGroup.settings?.who_can_share_link === "members" ||
        (liveGroup.settings?.who_can_share_link === "admins" && isAdmin)

    // ── leave ─────────────────────────────────────────────────────────────
    const { mutate: leaveGroup, isPending: isLeaving } = useDeleteApi(`/groups/${group.id}/leave`)

    const handleLeaveConfirm = () => {
        leaveGroup("" as any, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["groups-"], exact: false })
                setShowLeaveConfirm(false)
                onGroupLeft()
            },
            onError: () => setShowLeaveConfirm(false)
        })
    }

    // ── delete ────────────────────────────────────────────────────────────
    const { mutate: deleteGroup, isPending: isDeleting } = useDeleteApi(`/groups`)

    const handleDeleteConfirm = () => {
        deleteGroup(group.id, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["groups-"], exact: false })
                setShowDeleteConfirm(false)
                onGroupLeft()
            },
            onError: () => setShowDeleteConfirm(false)
        })
    }

    // ── remove member ─────────────────────────────────────────────────────
    const { mutate: removeMember, isPending: isRemoving } = useDeleteApi(`/groups/${group.id}/members`)

    const handleRemoveConfirm = () => {
        if (!memberToRemove) return
        removeMember(memberToRemove.user?.id as any, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: [`group-${group.id}`] })
                queryClient.invalidateQueries({ queryKey: ["groups-"], exact: false })
                setMemberToRemove(null)
            },
        })
    }

    // ── update role ───────────────────────────────────────────────────────
    const { mutate: updateRole, isPending: isUpdatingRole } = usePatchApi(`/groups/${group.id}/members`)

    // generate invite link
    const { mutate: generateInvite, isPending: isGenerating } = usePostApi(
        `/groups/${group.id}/invite`
    )

    const handleGenerateLink = () => {
        generateInvite({} as any, {
            onSuccess: (res: any) => {
                setInviteLink(res?.data?.invite_link)
            },
        })
    }

    const handleRoleConfirm = () => {
        if (!memberToUpdateRole) return
        updateRole(
            { id: memberToUpdateRole.member.user?.id, body: { role: memberToUpdateRole.newRole } },
            {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: [`group-${group.id}`] })
                    setMemberToUpdateRole(null)
                },
            }
        )
    }

    const handleCopy = () => {
        if (!inviteLink) return
        navigator.clipboard.writeText(inviteLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    useEffect(() => {
        setInviteLink(null)
    }, [group.id])

    return (
        <div className="flex-1 flex flex-col overflow-hidden">

            {/* header */}
            <div className="h-16 bg-white border-b flex items-center justify-between px-6 flex-shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center">
                        {group.avatar
                            ? <img src={group.avatar} className="w-9 h-9 rounded-full object-cover" />
                            : <Users size={16} className="text-purple-600" />
                        }
                    </div>
                    <div>
                        <p className="font-semibold text-sm leading-tight">{liveGroup.name}</p>
                        <p className="text-xs text-gray-400 leading-tight">
                            {memberCount} member{memberCount !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>

                <Button
                    onClick={() => setShowInfo((prev) => !prev)}
                    className={`p-2 rounded-lg transition 
                        ${showInfo ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                >
                    <Info size={20} />
                </Button>
            </div>

            {/* messages placeholder */}
            <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-400 text-sm">Messages coming soon</p>
            </div>

            {/* info sidebar */}
            <SidebarPanel
                open={showInfo}
                onClose={() => setShowInfo(false)}
                position="right"
                width="w-72"
                title="Group info"
            >
                <div className="space-y-6">

                    {/* ── about ─────────────────────────────────────────── */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-gray-400 uppercase tracking-wide">About</p>
                            {canEditInfo && (
                                <Button
                                    onClick={() => setShowEditGroup(true)}
                                    className="text-xs text-blue-400 hover:text-blue-300 transition"
                                >
                                    Edit
                                </Button>
                            )}
                        </div>
                        <p className="text-sm font-medium text-white">{liveGroup.name}</p>
                        {liveGroup.description && (
                            <p className="text-xs text-gray-400 mt-1">{liveGroup.description}</p>
                        )}
                    </div>

                    {/* ── members ───────────────────────────────────────── */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-gray-400 uppercase tracking-wide">
                                Members {groupDetail ? `(${groupDetail.members?.length})` : `(${memberCount})`}
                            </p>
                            {canAddMembers && (
                                <Button
                                    onClick={() => setShowAddMember(true)}
                                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition"
                                >
                                    <UserPlus size={14} />
                                    Add
                                </Button>
                            )}
                        </div>

                        {isLoading && (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-2 animate-pulse">
                                        <div className="w-8 h-8 bg-gray-700 rounded-full flex-shrink-0" />
                                        <div className="flex-1 space-y-1">
                                            <div className="h-3 bg-gray-700 rounded w-2/3" />
                                            <div className="h-2 bg-gray-700 rounded w-1/3" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-1">
                            {groupDetail?.members?.map((m: IGroupMember) => (
                                <div key={m.id} className="flex items-center gap-2 py-1.5 group/member">
                                    <div className="relative flex-shrink-0">
                                        <div className="w-8 h-8 bg-purple-900 rounded-full flex items-center justify-center">
                                            {m.user?.avatar
                                                ? <img src={m.user.avatar} className="w-8 h-8 rounded-full object-cover" />
                                                : <Users size={14} className="text-purple-300" />
                                            }
                                        </div>
                                        {m.user?.is_online && (
                                            <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-gray-900" />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium truncate text-white">
                                            {m.user?.name}
                                            {m.user?.id === authUser?.id && (
                                                <span className="text-gray-400 font-normal"> (you)</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-400 capitalize">{m.role}</p>
                                    </div>

                                    {/* three dots — not for self */}
                                    {m.user?.id !== authUser?.id && (
                                        <MemberMenu
                                            member={m}
                                            isAdmin={isAdmin}
                                            canRemove={canRemoveMembers}
                                            onDM={() => {
                                                if (m.user) onOpenDM(m.user as IUser)
                                                setShowInfo(false)
                                            }}
                                            onMakeAdmin={() => setMemberToUpdateRole({ member: m, newRole: "admin" })}
                                            onRemoveAdmin={() => setMemberToUpdateRole({ member: m, newRole: "member" })}
                                            onRemove={() => setMemberToRemove(m)}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── invite link ───────────────────────────────────── */}
                    {canShareLink && (
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Invite link</p>

                            {!inviteLink ? (
                                <button
                                    onClick={handleGenerateLink}
                                    disabled={isGenerating}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition text-xs text-gray-300 disabled:opacity-40"
                                >
                                    <Link2 size={13} />
                                    {isGenerating ? "Generating..." : "Generate invite link"}
                                </button>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800">
                                        <p className="text-xs text-gray-300 truncate flex-1">{inviteLink}</p>
                                        <button
                                            onClick={handleCopy}
                                            className="flex-shrink-0 text-gray-400 hover:text-white transition"
                                            title="Copy link"
                                        >
                                            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleGenerateLink}
                                        disabled={isGenerating}
                                        className="text-xs text-gray-500 hover:text-gray-300 transition disabled:opacity-40"
                                    >
                                        Regenerate
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── settings — admin only ──────────────────────────── */}
                    {isAdmin && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Settings</p>
                                <Button
                                    onClick={() => setShowSettings(true)}
                                    className="text-xs text-blue-400 hover:text-blue-300 transition"
                                >
                                    Edit
                                </Button>
                            </div>
                            <div className="space-y-1">
                                {[
                                    { label: "Who can send messages", value: liveGroup.settings?.who_can_send },
                                    { label: "Who can edit info", value: liveGroup.settings?.who_can_edit_info },
                                    { label: "Who can add members", value: liveGroup.settings?.who_can_add_members },
                                    { label: "Who can remove members", value: liveGroup.settings?.who_can_remove_members },
                                    { label: "Who can share invite link", value: liveGroup.settings?.who_can_share_link },
                                ].map((s) => (
                                    <div key={s.label} className="flex items-center justify-between py-1.5">
                                        <p className="text-xs text-gray-400">{s.label}</p>
                                        <span className="text-xs text-gray-300 capitalize bg-gray-700 px-2 py-0.5 rounded">
                                            {s.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── danger zone ────────────────────────────────────── */}
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Actions</p>
                        <div className="space-y-1">

                            {isAdmin && liveGroup.join_mode === "approval" && (
                                <Button
                                    onClick={() => setShowJoinRequests(true)}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-blue-600 hover:bg-gray-100 transition text-sm"
                                >
                                    <div className="flex items-center gap-2">
                                        <Users size={15} />
                                        Join requests
                                    </div>
                                    <ChevronRight size={14} />
                                </Button>
                            )}

                            <Button
                                onClick={() => setShowLeaveConfirm(true)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-orange-400 hover:bg-gray-800 transition text-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <LogOut size={15} />
                                    Leave group
                                </div>
                                <ChevronRight size={14} />
                            </Button>

                            {isAdmin && (
                                <Button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-red-400 hover:bg-gray-800 transition text-sm"
                                >
                                    <div className="flex items-center gap-2">
                                        <Trash2 size={15} />
                                        Delete group
                                    </div>
                                    <ChevronRight size={14} />
                                </Button>
                            )}

                        </div>
                    </div>

                </div>
            </SidebarPanel>

            {/* leave confirm */}
            <ConfirmDialog
                open={showLeaveConfirm}
                onClose={() => setShowLeaveConfirm(false)}
                onConfirm={handleLeaveConfirm}
                title="Leave group"
                message={`Are you sure you want to leave "${liveGroup.name}"?`}
                confirmText="Leave"
                variant="warning"
                isLoading={isLeaving}
            />

            {/* delete confirm */}
            <ConfirmDialog
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete group"
                message={`Are you sure you want to delete "${liveGroup.name}"? This cannot be undone.`}
                confirmText="Delete"
                variant="danger"
                isLoading={isDeleting}
            />

            {/* remove member confirm */}
            <ConfirmDialog
                open={!!memberToRemove}
                onClose={() => setMemberToRemove(null)}
                onConfirm={handleRemoveConfirm}
                title="Remove member"
                message={`Are you sure you want to remove ${memberToRemove?.user?.name} from the group?`}
                confirmText="Remove"
                variant="danger"
                isLoading={isRemoving}
            />

            {/* update role confirm */}
            <ConfirmDialog
                open={!!memberToUpdateRole}
                onClose={() => setMemberToUpdateRole(null)}
                onConfirm={handleRoleConfirm}
                title={memberToUpdateRole?.newRole === "admin" ? "Make admin" : "Remove as admin"}
                message={
                    memberToUpdateRole?.newRole === "admin"
                        ? `Make ${memberToUpdateRole?.member.user?.name} an admin?`
                        : `Remove ${memberToUpdateRole?.member.user?.name} as admin?`
                }
                confirmText={memberToUpdateRole?.newRole === "admin" ? "Make admin" : "Remove admin"}
                variant="info"
                isLoading={isUpdatingRole}
            />

            {/* add member modal */}
            <AddMemberModal
                open={showAddMember}
                onClose={() => setShowAddMember(false)}
                groupId={group.id}
            />

            {/* settings model */}
            {liveGroup.settings && (
                <GroupSettingsModal
                    open={showSettings}
                    onClose={() => setShowSettings(false)}
                    groupId={group.id}
                    settings={liveGroup.settings}
                />
            )}

            <EditGroupModal
                open={showEditGroup}
                onClose={() => setShowEditGroup(false)}
                group={liveGroup}
            />

            <JoinRequestsModal
                open={showJoinRequests}
                onClose={() => setShowJoinRequests(false)}
                groupId={group.id}
            />
        </div>
    )
}

export default GroupChat