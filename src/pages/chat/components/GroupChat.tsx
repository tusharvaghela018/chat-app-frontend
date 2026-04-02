import { useState, useRef, useEffect } from "react"
import { Users, Info, UserPlus, UserMinus, MoreVertical, MessageSquare, Shield, ShieldOff, LogOut, Trash2, ChevronRight, Link2, Check, Copy, Send, ChevronLeft } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { useGetApi, useDeleteApi, usePatchApi, usePostApi } from "@/hooks/api"
import { getUser } from "@/redux/slices/auth.slice"
import type { IGroup, IGroupMember, IUser } from "@/types"
import Button from "@/common/Button"
import SidebarPanel from "@/common/Sidebar"
import ConfirmDialog from "@/common/confirmDialog"
import AddMemberModal from "@/pages/chat/components/group/AddMemberModal"
import GroupSettingsModal from "@/pages/chat/components/group/GroupSettingsModal"
import EditGroupModal from "@/pages/chat/components/group/EditGroupModal"
import JoinRequestsModal from "@/pages/chat/components/group/JoinRequestsModal"
import { useGroupChat, type IGroupMessage } from "@/pages/chat/hooks"
import { useSocket } from "@/hooks/socket"

interface Props {
    group: IGroup
    onGroupLeft: () => void
    onOpenDM: (user: IUser) => void
    onBack?: () => void
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
                variant="ghost"
                size="icon"
                onClick={() => setOpen((prev) => !prev)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
                <MoreVertical size={14} />
            </Button>

            {open && (
                <div className="absolute right-0 top-9 z-50 w-44 origin-top-right rounded-xl border bg-popover p-1 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">

                    {/* open DM */}
                    <button
                        onClick={() => { onDM(); setOpen(false) }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground transition-colors hover:bg-accent"
                    >
                        <MessageSquare size={13} className="text-muted-foreground" />
                        Send message
                    </button>

                    {/* make/remove admin — only admins see this */}
                    {isAdmin && (
                        member.role === "member" ? (
                            <button
                                onClick={() => { onMakeAdmin(); setOpen(false) }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground transition-colors hover:bg-accent"
                            >
                                <Shield size={13} className="text-primary" />
                                Make admin
                            </button>
                        ) : (
                            <button
                                onClick={() => { onRemoveAdmin(); setOpen(false) }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground transition-colors hover:bg-accent"
                            >
                                <ShieldOff size={13} className="text-muted-foreground" />
                                Remove as admin
                            </button>
                        )
                    )}

                    {/* remove from group */}
                    {canRemove && (
                        <button
                            onClick={() => { onRemove(); setOpen(false) }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-destructive transition-colors hover:bg-destructive/10"
                        >
                            <UserMinus size={13} />
                            Remove from group
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

const GroupChat = ({ group, onGroupLeft, onOpenDM, onBack }: Props) => {
    const authUser = useSelector(getUser);
    const socket = useSocket();

    const [input, setInput] = useState<string>("");
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const bottomRef = useRef<HTMLDivElement>(null)

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

    const {
        messages,
        setMessages,
        typingUsers,
        sendMessage,
        markSeen,
        emitTypingStart,
        emitTypingStop,
    } = useGroupChat({
        socket,
        groupId: group.id,
        onMemberJoined: () => {
            queryClient.invalidateQueries({ queryKey: [`group-${group.id}`] })
            queryClient.invalidateQueries({ queryKey: ["groups-"], exact: false })
        },
        onMemberLeft: () => {
            queryClient.invalidateQueries({ queryKey: [`group-${group.id}`] })
            queryClient.invalidateQueries({ queryKey: ["groups-"], exact: false })
        },
    })

    // ── load initial messages from API ────────────────────────────────────
    const { data: messagesData } = useGetApi(
        `/groups/${group.id}/messages`,
        undefined,
        { queryKey: `group-messages-${group.id}`, enabled: true }
    )

    useEffect(() => {
        const msgs = (messagesData?.data as any)?.messages ?? []
        if (msgs.length === 0) return
        setMessages(msgs)

        // mark all unseen messages as seen
        const unseenIds = msgs
            .filter((m: IGroupMessage) => m.sender_id !== authUser?.id)
            .map((m: IGroupMessage) => m.id)
        markSeen(unseenIds)
    }, [messagesData])

    // ── auto scroll ───────────────────────────────────────────────────────
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // ── typing ────────────────────────────────────────────────────────────
    const handleTyping = (val: string) => {
        setInput(val)
        emitTypingStart()

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
            emitTypingStop()
        }, 2000)
    }

    // ── send ──────────────────────────────────────────────────────────────
    const handleSend = () => {
        if (!input.trim()) return
        sendMessage(input)
        emitTypingStop()
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        setInput("")
    }


    const { data: liveData } = useGetApi<{ group: IGroup }>(
        `/groups/${group.id}`,
        undefined,
        {
            queryKey: `group-${group.id}`,
            enabled: true,
        }
    )

    const groupDetail = liveData?.data?.group as IGroup | undefined

    const liveGroup = liveData?.data?.group ?? group
    const myRole = liveGroup.members?.find(
        (m: IGroupMember) => m.user?.id === authUser?.id
    )?.role ?? group.members?.[0]?.role
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
        <div className="flex-1 flex flex-col overflow-hidden bg-background">

            {/* header */}
            <div className="h-16 flex-shrink-0 flex items-center justify-between border-b bg-card px-4 shadow-sm sm:px-6">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={onBack} 
                            className="mr-1 lg:hidden rounded-full"
                        >
                            <ChevronLeft size={24} />
                        </Button>
                    )}
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 font-bold shadow-inner">
                        {group.avatar
                            ? <img src={group.avatar} className="h-full w-full rounded-xl object-cover" />
                            : <Users size={20} />
                        }
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">{liveGroup.name}</p>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            {memberCount} member{memberCount !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowInfo((prev) => !prev)}
                    className={`rounded-full transition-all duration-200
                        ${showInfo ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                    <Info size={20} />
                </Button>
            </div>

            {/* messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-background/50">
                {messages.length === 0 && (
                    <div className="flex h-full flex-col items-center justify-center space-y-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <MessageSquare size={32} />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">No messages yet — say hello 👋</p>
                    </div>
                )}

                {messages.map((msg: IGroupMessage) => {
                    const isMine = msg.sender_id === authUser?.id
                    const isSystem = msg.type === "system"

                    if (isSystem) {
                        return (
                            <div key={msg.id} className="flex justify-center my-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-4 py-1 rounded-full border border-border">
                                    {msg.content}
                                </span>
                            </div>
                        )
                    }

                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isMine ? "justify-end" : "justify-start"} gap-2`}
                        >
                            {!isMine && (
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600 font-bold text-[10px] mt-1 shadow-inner overflow-hidden">
                                    {msg.sender?.avatar
                                        ? <img src={msg.sender.avatar} className="h-full w-full object-cover" />
                                        : msg.sender?.name?.[0]?.toUpperCase()
                                    }
                                </div>
                            )}

                            <div className="max-w-[80%] sm:max-w-md">
                                {!isMine && (
                                    <p className="text-[10px] font-bold text-muted-foreground mb-1 ml-1 truncate">
                                        {msg.sender?.name}
                                    </p>
                                )}
                                <div className={`relative px-4 py-2.5 rounded-2xl text-sm break-words shadow-sm
                                    ${isMine
                                        ? "bg-primary text-primary-foreground rounded-br-none"
                                        : "bg-card text-foreground rounded-bl-none border border-border"
                                    }`}
                                >
                                    {msg.content}
                                    <div className={`text-[10px] tabular-nums mt-1 text-right 
                                        ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                                    >
                                        {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}

                {/* typing indicator */}
                {typingUsers.length > 0 && (
                    <div className="flex justify-start gap-2 animate-in slide-in-from-left-2">
                        <div className="px-4 py-2 bg-muted rounded-2xl rounded-bl-none border border-border">
                            <p className="text-xs font-medium text-primary animate-pulse italic">
                                {typingUsers.length === 1
                                    ? `${typingUsers[0].senderName} is typing...`
                                    : `${typingUsers.length} people are typing...`
                                }
                            </p>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* input */}
            <div className="border-t bg-card p-4 sm:px-6">
                {liveGroup.settings?.who_can_send === "admins" && !isAdmin ? (
                    <div className="flex items-center justify-center p-2 bg-muted rounded-xl border border-dashed">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Shield size={14} /> Only admins can send messages
                        </p>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 max-w-4xl mx-auto">
                        <input
                            value={input}
                            onChange={(e) => handleTyping(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder={`Message ${liveGroup.name}...`}
                            className="flex-1 rounded-2xl border bg-background px-4 py-3 text-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="h-11 w-11 shrink-0 rounded-2xl shadow-lg shadow-primary/20"
                        >
                            <Send size={18} />
                        </Button>
                    </div>
                )}
            </div>

            {/* info sidebar */}
            <SidebarPanel
                open={showInfo}
                onClose={() => setShowInfo(false)}
                position="right"
                width="w-full sm:w-80"
                title="Group Info"
            >
                <div className="space-y-8 px-2">
                    {/* ── header info ── */}
                    <div className="flex flex-col items-center text-center">
                        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-purple-100 text-purple-600 font-bold text-3xl shadow-xl mb-4">
                            {liveGroup.avatar
                                ? <img src={liveGroup.avatar} className="h-full w-full rounded-3xl object-cover" />
                                : <Users size={40} />
                            }
                        </div>
                        <h2 className="text-xl font-bold text-foreground">{liveGroup.name}</h2>
                        <p className="text-sm text-muted-foreground mt-1">Group · {memberCount} members</p>
                    </div>

                    {/* ── description ── */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">About</h3>
                            {canEditInfo && (
                                <button onClick={() => setShowEditGroup(true)} className="text-xs font-bold text-primary hover:underline">Edit</button>
                            )}
                        </div>
                        <div className="rounded-2xl border bg-muted/30 p-4">
                            <p className="text-sm text-foreground leading-relaxed">
                                {liveGroup.description || "No description provided."}
                            </p>
                        </div>
                    </div>

                    {/* ── members list ── */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                                Members ({groupDetail?.members?.length || memberCount})
                            </h3>
                            {canAddMembers && (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setShowAddMember(true)}
                                    className="h-7 px-3 rounded-lg text-xs"
                                >
                                    <UserPlus size={12} className="mr-1.5" /> Add
                                </Button>
                            )}
                        </div>

                        <div className="space-y-1">
                            {groupDetail?.members?.map((m: IGroupMember) => (
                                <div key={m.id} className="flex items-center gap-3 py-2 px-3 rounded-xl transition-colors hover:bg-muted/50 group/member">
                                    <div className="relative flex-shrink-0">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-600 font-bold text-xs shadow-inner">
                                            {m.user?.avatar
                                                ? <img src={m.user.avatar} className="h-full w-full rounded-xl object-cover" />
                                                : m.user?.name?.[0]?.toUpperCase()
                                            }
                                        </div>
                                        {m.user?.is_online && (
                                            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-green-500" />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-foreground truncate">
                                            {m.user?.name}
                                            {m.user?.id === authUser?.id && <span className="font-normal text-muted-foreground"> (you)</span>}
                                        </p>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{m.role}</p>
                                    </div>

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

                    {/* ── invite ── */}
                    {canShareLink && (
                        <div>
                             <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">Invite Link</h3>
                             {!inviteLink ? (
                                <Button 
                                    variant="secondary" 
                                    fullWidth 
                                    onClick={handleGenerateLink} 
                                    loading={isGenerating}
                                    className="rounded-xl h-10 text-xs font-bold"
                                >
                                    <Link2 size={14} className="mr-2" /> Generate Link
                                </Button>
                             ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 rounded-xl border bg-muted/50 p-2 pr-3">
                                        <p className="flex-1 truncate text-xs font-medium pl-1">{inviteLink}</p>
                                        <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground">
                                            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                    <button onClick={handleGenerateLink} className="text-[10px] font-bold text-primary uppercase tracking-wider hover:underline px-1">Regenerate Link</button>
                                </div>
                             )}
                        </div>
                    )}

                    {/* ── settings ── */}
                    {isAdmin && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Permissions</h3>
                                <button onClick={() => setShowSettings(true)} className="text-xs font-bold text-primary hover:underline">Edit</button>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { label: "Messaging", value: liveGroup.settings?.who_can_send },
                                    { label: "Editing Info", value: liveGroup.settings?.who_can_edit_info },
                                    { label: "Adding Members", value: liveGroup.settings?.who_can_add_members },
                                ].map((s) => (
                                    <div key={s.label} className="flex items-center justify-between rounded-xl border border-dashed p-3">
                                        <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                                            {s.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── danger zone ── */}
                    <div className="pt-4 border-t">
                         <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-destructive mb-3">Danger Zone</h3>
                         <div className="space-y-2">
                            {isAdmin && liveGroup.join_mode === "approval" && (
                                <Button
                                    variant="ghost"
                                    fullWidth
                                    onClick={() => setShowJoinRequests(true)}
                                    className="justify-between rounded-xl h-11 px-4 text-primary hover:bg-primary/5 border border-primary/20"
                                >
                                    <span className="flex items-center gap-2 font-bold text-sm"><Users size={16} /> Join Requests</span>
                                    <ChevronRight size={14} />
                                </Button>
                            )}

                            <Button
                                variant="ghost"
                                fullWidth
                                onClick={() => setShowLeaveConfirm(true)}
                                className="justify-between rounded-xl h-11 px-4 text-amber-600 hover:bg-amber-50 border border-amber-200"
                            >
                                <span className="flex items-center gap-2 font-bold text-sm"><LogOut size={16} /> Leave Group</span>
                                <ChevronRight size={14} />
                            </Button>

                            {isAdmin && (
                                <Button
                                    variant="ghost"
                                    fullWidth
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="justify-between rounded-xl h-11 px-4 text-destructive hover:bg-destructive/5 border border-destructive/20"
                                >
                                    <span className="flex items-center gap-2 font-bold text-sm"><Trash2 size={16} /> Delete Group</span>
                                    <ChevronRight size={14} />
                                </Button>
                            )}
                         </div>
                    </div>
                </div>
            </SidebarPanel>

            {/* Dialogs... (keep existing logic but update styling if needed) */}
            <ConfirmDialog open={showLeaveConfirm} onClose={() => setShowLeaveConfirm(false)} onConfirm={handleLeaveConfirm} title="Leave Group" message={`Are you sure you want to leave "${liveGroup.name}"?`} confirmText="Leave Group" variant="warning" isLoading={isLeaving} />
            <ConfirmDialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={handleDeleteConfirm} title="Delete Group" message={`Are you sure you want to delete "${liveGroup.name}"? This action is permanent.`} confirmText="Delete Group" variant="danger" isLoading={isDeleting} />
            <ConfirmDialog open={!!memberToRemove} onClose={() => setMemberToRemove(null)} onConfirm={handleRemoveConfirm} title="Remove Member" message={`Remove ${memberToRemove?.user?.name} from the group?`} confirmText="Remove" variant="danger" isLoading={isRemoving} />
            <ConfirmDialog open={!!memberToUpdateRole} onClose={() => setMemberToUpdateRole(null)} onConfirm={handleRoleConfirm} title={memberToUpdateRole?.newRole === "admin" ? "Make Admin" : "Remove Admin"} message={memberToUpdateRole?.newRole === "admin" ? `Promote ${memberToUpdateRole?.member.user?.name} to admin?` : `Remove admin rights for ${memberToUpdateRole?.member.user?.name}?`} confirmText="Confirm" variant="info" isLoading={isUpdatingRole} />

            <AddMemberModal open={showAddMember} onClose={() => setShowAddMember(false)} groupId={group.id} />
            {liveGroup.settings && <GroupSettingsModal open={showSettings} onClose={() => setShowSettings(false)} groupId={group.id} settings={liveGroup.settings} />}
            <EditGroupModal open={showEditGroup} onClose={() => setShowEditGroup(false)} group={liveGroup} />
            <JoinRequestsModal open={showJoinRequests} onClose={() => setShowJoinRequests(false)} groupId={group.id} />
        </div>
    )
}

export default GroupChat