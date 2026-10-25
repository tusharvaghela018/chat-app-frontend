import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from "react"
import { 
    Users, UserPlus, UserMinus, MoreVertical, MoreHorizontal, MessageSquare, 
    Shield, ShieldOff, LogOut, ChevronRight, Link2, Check, 
    Copy, ChevronLeft, X, Lock, Loader2, Video, Phone, Search, 
    Smile, Star, ChevronUp, ChevronDown, Camera, Pencil, Settings, 
    FileText, Image as ImageIcon 
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { useGetApi, useDeleteApi, usePatchApi, usePostApi } from "@/hooks/api"
import axiosInstance from "@/api/axios"
import { getUser } from "@/redux/slices/auth.slice"
import type { IGroup, IGroupMember, IUser } from "@/types"
import Button from "@/common/Button"
import SidebarPanel from "@/common/Sidebar"
import ConfirmDialog from "@/common/confirmDialog"
import AddMemberModal from "@/pages/chat/components/group/AddMemberModal"
import GroupSettingsModal from "@/pages/chat/components/group/GroupSettingsModal"
import EditGroupModal from "@/pages/chat/components/group/EditGroupModal"
import JoinRequestsModal from "@/pages/chat/components/group/JoinRequestsModal"
import { useGroupChat, type IGroupMessage, type IGroupMessageReaction, type IStarredItem } from "@/pages/chat/hooks"
import { useSocket } from "@/hooks/socket"
import { 
    encryptGroupPayload, 
    decryptGroupPayload, 
    generateGroupKey, 
    encryptGroupKeyForMember, 
    decryptGroupKey, 
    getSessionKeys, 
    type EncryptedMessage 
} from "@/utils/crypto"
import DocumentCard from "@/pages/chat/components/media/DocumentCard"
import AudioPlayerBubble from "@/pages/chat/components/media/AudioPlayerBubble"
import AudioRecorderBar from "@/pages/chat/components/media/AudioRecorderBar"
import ImageBubble from "@/pages/chat/components/media/ImageBubble"
import RichTextRenderer from "@/pages/chat/components/RichTextRenderer"
import RichMessageInput from "@/pages/chat/components/input/RichMessageInput"

interface Props {
    group: IGroup
    onGroupLeft: () => void
    onOpenDM: (user: IUser) => void
    onBack?: () => void
    onClose?: () => void
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
                <MoreHorizontal size={15} />
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

import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react"

const COMMON_EMOJIS = ["❤️", "👍", "🔥", "😂", "🤩", "🎉"]

const GroupChat = ({ group, onGroupLeft, onOpenDM, onBack, onClose }: Props) => {
    const authUser = useSelector(getUser);
    const socket = useSocket();
    const myKeys = getSessionKeys()

    const [input, setInput] = useState<string>("");
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const [hasMore, setHasMore] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const topRef = useRef<HTMLDivElement>(null)

    const isInitialScrollDone = useRef(false)
    const lastMessageIdRef = useRef<number | null>(null)
    const decryptCache = useRef<Map<string, string | null>>(new Map())

    const [hoveredMsgId, setHoveredMsgId] = useState<number | null>(null)
    const [moreEmojiMsgId, setMoreEmojiMsgId] = useState<number | null>(null)

    // Chat search state
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
    const searchInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const handleDocumentClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (!target.closest('.emoji-picker-container') && !target.closest('.epr-main')) {
                setMoreEmojiMsgId(null)
            }
        }
        document.addEventListener("mousedown", handleDocumentClick)
        return () => document.removeEventListener("mousedown", handleDocumentClick)
    }, [])

    const [copiedId, setCopiedId] = useState<number | null>(null)

    const handleCopyText = (id: number, text: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 1500)
    }

    interface AggregatedReaction {
        emoji: string
        count: number
        hasReacted: boolean
    }

    const getAggregatedReactions = (msgReactions: IGroupMessageReaction[] | undefined, currentUserId: number): AggregatedReaction[] => {
        if (!msgReactions || msgReactions.length === 0) return []
        const map = new Map<string, { count: number; hasReacted: boolean }>()
        for (const r of msgReactions) {
            const item = map.get(r.emoji) || { count: 0, hasReacted: false }
            item.count += 1
            if (r.user_id === currentUserId) {
                item.hasReacted = true
            }
            map.set(r.emoji, item)
        }
        return Array.from(map.entries()).map(([emoji, data]) => ({
            emoji,
            count: data.count,
            hasReacted: data.hasReacted,
        }))
    }

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
    const [infoTab, setInfoTab] = useState<"members" | "media" | "files">("members")
    const [memberSearch, setMemberSearch] = useState("")

    // Media and voice note state
    const [isRecordingAudio, setIsRecordingAudio] = useState(false)
    const [isUploadingMedia, setIsUploadingMedia] = useState(false)
    const [uploadingFile, setUploadingFile] = useState<{ name: string; size?: number; type?: string } | null>(null)

    // ── initial load ────────────────────────────────────
    const { data: messagesData, isFetching, isSuccess } = useGetApi<{ messages: IGroupMessage[], hasMore: boolean }>(
        `/groups/${group.id}/messages`,
        { limit: 30 },
        { queryKey: `group-messages-${group.id}`, enabled: true, staleTime: 30 * 1000 }
    )

    const initialMsgs = (messagesData?.data as any)?.messages ?? []

    const {
        messages,
        setMessages,
        typingUsers,
        sendMessage,
        markSeen,
        emitTypingStart,
        emitTypingStop,
        emitToggleReaction,
    } = useGroupChat({
        socket,
        groupId: group.id,
        currentUserId: authUser?.id,
        initialMessages: initialMsgs,
        onMemberJoined: () => {
            queryClient.invalidateQueries({ queryKey: [`group-${group.id}`] })
            queryClient.invalidateQueries({ queryKey: ["groups-"], exact: false })
        },
        onMemberLeft: () => {
            queryClient.invalidateQueries({ queryKey: [`group-${group.id}`] })
            queryClient.invalidateQueries({ queryKey: ["groups-"], exact: false })
        },
    })

    const handleToggleStar = async (groupMessageId: number) => {
        if (!authUser?.id) return

        // 1. Instant optimistic star update
        setMessages((prev) =>
            prev.map((m) => {
                if (Number(m.id) !== Number(groupMessageId)) return m
                const current = m.starred || []
                const isCurrentlyStarred = current.some((s) => Number(s.user_id) === Number(authUser.id))
                let nextStarred: IStarredItem[]
                if (isCurrentlyStarred) {
                    nextStarred = current.filter((s) => Number(s.user_id) !== Number(authUser.id))
                } else {
                    nextStarred = [...current, { user_id: Number(authUser.id), group_message_id: Number(groupMessageId) }]
                }
                return { ...m, starred: nextStarred }
            })
        )

        try {
            const res = await axiosInstance.post("/starred-messages/toggle", { groupMessageId })
            const serverStarred = res.data?.data?.isStarred
            if (typeof serverStarred === "boolean") {
                setMessages((prev) =>
                    prev.map((m) => {
                        if (Number(m.id) !== Number(groupMessageId)) return m
                        const current = (m.starred || []).filter((s) => Number(s.user_id) !== Number(authUser.id))
                        return {
                            ...m,
                            starred: serverStarred
                                ? [...current, { user_id: Number(authUser.id), group_message_id: Number(groupMessageId) }]
                                : current,
                        }
                    })
                )
            }
            queryClient.invalidateQueries({ queryKey: ["starred-messages"] })
            queryClient.invalidateQueries({ queryKey: ["starred-messages-ids"] })
            queryClient.invalidateQueries({ queryKey: [`group-messages-${group.id}`] })
        } catch (err) {
            console.error("Failed to toggle group star:", err)
        }
    }

    const handleToggleReaction = (groupMessageId: number, emoji: string) => {
        if (!authUser?.id) return

        // Instant optimistic update
        setMessages((prev) =>
            prev.map((m) => {
                if (m.id !== groupMessageId) return m
                const current = m.reactions || []
                const existingIdx = current.findIndex(
                    (r) => r.emoji === emoji && r.user_id === authUser.id
                )
                let nextReactions: IGroupMessageReaction[]
                if (existingIdx >= 0) {
                    nextReactions = current.filter((_, idx) => idx !== existingIdx)
                } else {
                    nextReactions = [
                        ...current,
                        {
                            id: -Date.now(),
                            group_message_id: groupMessageId,
                            user_id: authUser.id,
                            emoji,
                        },
                    ]
                }
                return { ...m, reactions: nextReactions }
            })
        )

        emitToggleReaction(groupMessageId, emoji)
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

    // Helper to decrypt messages with O(1) caching
    const decryptMessage = useCallback((msg: IGroupMessage) => {
        if (msg.type === "system") return msg.content
        const cacheKey = `${msg.id}_${msg.content}`
        if (decryptCache.current.has(cacheKey)) {
            return decryptCache.current.get(cacheKey)!
        }

        let decrypted: string | null = msg.content
        try {
            const parsed = JSON.parse(msg.content) as EncryptedMessage
            if (parsed.c && parsed.n && myKeys && msg.encrypted_keys) {
                // Find my encrypted group key
                const myEncryptedKey = msg.encrypted_keys[authUser?.id as number]
                if (!myEncryptedKey) return null

                // Get sender's public key (from groupDetail members)
                const sender = groupDetail?.members?.find(m => m.user?.id === msg.sender_id)
                const senderPublicKey = sender?.user?.public_key
                if (!senderPublicKey) return null

                // 1. Decrypt the Group Key
                const groupKey = decryptGroupKey(myEncryptedKey, senderPublicKey, myKeys.secretKey)
                if (!groupKey) return null

                // 2. Decrypt the payload
                decrypted = decryptGroupPayload(parsed, groupKey)
            }
        } catch (e) {
            decrypted = msg.content // Not encrypted or fallback
        }

        decryptCache.current.set(cacheKey, decrypted)
        return decrypted
    }, [groupDetail?.members, myKeys, authUser?.id])

    // ── search within group conversation ─────────────────────────────────
    const matchingMessageIds = useMemo(() => {
        if (!searchQuery.trim()) return []
        const q = searchQuery.toLowerCase().trim()
        const ids: number[] = []
        for (const m of messages) {
            const content = decryptMessage(m)
            if (!content) continue
            let textToSearch = content
            try {
                if (content.startsWith('{"type":')) {
                    const parsed = JSON.parse(content)
                    textToSearch = parsed.name || parsed.caption || content
                }
            } catch {}
            if (textToSearch.toLowerCase().includes(q)) {
                ids.push(m.id)
            }
        }
        return ids
    }, [messages, searchQuery, decryptMessage])

    useEffect(() => {
        if (isSearchOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 60)
        } else {
            setSearchQuery("")
            setCurrentMatchIndex(0)
        }
    }, [isSearchOpen])

    useEffect(() => {
        if (matchingMessageIds.length > 0) {
            setCurrentMatchIndex(matchingMessageIds.length - 1)
        } else {
            setCurrentMatchIndex(0)
        }
    }, [matchingMessageIds.length, searchQuery])

    useEffect(() => {
        if (isSearchOpen && matchingMessageIds.length > 0 && currentMatchIndex >= 0 && currentMatchIndex < matchingMessageIds.length) {
            const targetId = matchingMessageIds[currentMatchIndex]
            const el = document.getElementById(`group-msg-${targetId}`)
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" })
            }
        }
    }, [isSearchOpen, currentMatchIndex, matchingMessageIds])

    const goToNextMatch = () => {
        if (matchingMessageIds.length <= 1) return
        setCurrentMatchIndex((prev) => (prev + 1) % matchingMessageIds.length)
    }

    const goToPrevMatch = () => {
        if (matchingMessageIds.length <= 1) return
        setCurrentMatchIndex((prev) => (prev - 1 + matchingMessageIds.length) % matchingMessageIds.length)
    }

    const closeSearch = () => {
        setIsSearchOpen(false)
        setSearchQuery("")
        setCurrentMatchIndex(0)
    }

    // ── sync state when messagesData arrives/updates ─────
    useEffect(() => {
        if (messagesData?.data) {
            const msgs = (messagesData?.data as any)?.messages ?? []
            const more = (messagesData?.data as any)?.hasMore ?? false
            
            setMessages(msgs)
            setHasMore(more)

            // mark all unseen messages as seen
            const unseenIds = msgs
                .filter((m: IGroupMessage) => m.sender_id !== authUser?.id)
                .map((m: IGroupMessage) => m.id)
            if (unseenIds.length > 0) markSeen(unseenIds)
        }
    }, [messagesData, group.id, authUser?.id])

    // Instant synchronous scroll to bottom before paint on initial load
    useLayoutEffect(() => {
        if (messages.length > 0 && !isInitialScrollDone.current) {
            const container = scrollContainerRef.current
            if (container) {
                container.scrollTop = container.scrollHeight
                isInitialScrollDone.current = true
                lastMessageIdRef.current = messages[messages.length - 1]?.id ?? null
            }
        }
    }, [messages])

    // Backup rAF for layout adjustments
    useEffect(() => {
        if (messages.length > 0 && !isInitialScrollDone.current) {
            const raf = requestAnimationFrame(() => {
                const container = scrollContainerRef.current
                if (container) {
                    container.scrollTop = container.scrollHeight
                    isInitialScrollDone.current = true
                    lastMessageIdRef.current = messages[messages.length - 1]?.id ?? null
                }
            })
            return () => cancelAnimationFrame(raf)
        }
    }, [messages])

    // ── fetch more ────────────────────────────────────────────────────────
    const fetchMoreMessages = async () => {
        if (!hasMore || isLoadingMore || messages.length === 0) return

        setIsLoadingMore(true)
        const before = messages[0].id
        
        try {
            const { data: axiosData } = await axiosInstance.get(`/groups/${group.id}/messages`, {
                params: { before, limit: 30 }
            })
            
            const newMessages = axiosData?.data?.messages ?? []
            const more = axiosData?.data?.hasMore ?? false

            if (newMessages.length > 0) {
                const container = scrollContainerRef.current
                const previousHeight = container?.scrollHeight ?? 0

                setMessages(prev => [...newMessages, ...prev])
                setHasMore(more)

                requestAnimationFrame(() => {
                    if (container) {
                        const newHeight = container.scrollHeight
                        container.scrollTop = newHeight - previousHeight
                    }
                })
            } else {
                setHasMore(false)
            }
        } catch (error) {
            console.error("Failed to load more group messages", error)
        } finally {
            setIsLoadingMore(false)
        }
    }

    // ── intersection observer ─────────────────────────────────────────────
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    fetchMoreMessages()
                }
            },
            { threshold: 0.5 }
        )

        if (topRef.current) {
            observer.observe(topRef.current)
        }

        return () => observer.disconnect()
    }, [hasMore, isLoadingMore, messages])

    // ── auto scroll on new message appended ───────────────
    useEffect(() => {
        const container = scrollContainerRef.current
        if (!container || !isInitialScrollDone.current) return

        const lastMessage = messages[messages.length - 1]
        const isNewLastMessage = lastMessage && lastMessage.id !== lastMessageIdRef.current
        lastMessageIdRef.current = lastMessage?.id ?? null

        if (isNewLastMessage) {
            const isMine = lastMessage.sender_id === authUser?.id
            const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150

            if (isMine || isNearBottom) {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" })
            }
        }
    }, [messages, authUser?.id])

    // ── typing ────────────────────────────────────────────────────────────
    const handleTyping = (val: string) => {
        setInput(val)
        emitTypingStart()

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
            emitTypingStop()
        }, 2000)
    }

    // ── send encrypted payload helper ────────────────────────────────────
    const sendGroupEncryptedMessage = (rawContent: string) => {
        let finalContent = rawContent
        let encryptedKeys: Record<number, EncryptedMessage> = {}

        const membersWithPK = groupDetail?.members?.filter(m => !!m.user?.public_key)

        if (membersWithPK?.length && myKeys) {
            // 1. Generate Group Key
            const groupKey = generateGroupKey()

            // 2. Encrypt Payload
            const encryptedPayload = encryptGroupPayload(rawContent, groupKey)
            finalContent = JSON.stringify(encryptedPayload)

            // 3. Encrypt Group Key for each member
            membersWithPK.forEach(member => {
                if (member.user?.id && member.user.public_key) {
                    encryptedKeys[member.user.id] = encryptGroupKeyForMember(
                        groupKey,
                        member.user.public_key,
                        myKeys.secretKey
                    )
                }
            })
        }

        const optimisticMsg: IGroupMessage = {
            id: -Date.now(),
            group_id: group.id,
            sender_id: authUser?.id ?? null,
            content: finalContent,
            type: "text",
            encrypted_keys: encryptedKeys,
            created_at: new Date().toISOString(),
            is_pending: true,
            sender: {
                id: authUser?.id ?? 0,
                name: authUser?.name ?? "Me",
                avatar: authUser?.avatar ?? null,
            }
        }

        sendMessage(finalContent, encryptedKeys, optimisticMsg)
    }

    // ── send text message ──────────────────────────────────────────────────
    const handleSend = () => {
        if (!input.trim()) return

        const text = input.trim()
        setInput("")
        emitTypingStop()
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

        sendGroupEncryptedMessage(text)
    }

    // ── send audio note ────────────────────────────────────────────────────
    const handleSendAudioNote = async (blob: Blob, duration: number) => {
        setIsUploadingMedia(true)

        try {
            const formData = new FormData()
            formData.append("file", blob, `group_voice_${Date.now()}.webm`)
            formData.append("duration", String(duration))

            const response = await axiosInstance.post("/upload/media", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })

            const mediaData = response.data?.data
            if (mediaData?.url) {
                const payload = JSON.stringify({
                    type: "audio",
                    url: mediaData.url,
                    duration: mediaData.duration || duration,
                })
                sendGroupEncryptedMessage(payload)
            }
        } catch (err) {
            console.error("Audio note upload failed:", err)
        } finally {
            setIsUploadingMedia(false)
            setIsRecordingAudio(false)
        }
    }

    // ── send photo attachment (direct preview like WhatsApp) ───────────────
    const handleSendPhoto = async (file: File) => {
        if (!file) return
        setIsUploadingMedia(true)
        setUploadingFile({ name: file.name, size: file.size, type: file.type })
        try {
            const formData = new FormData()
            formData.append("file", file)

            const response = await axiosInstance.post("/upload/media", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })

            const mediaData = response.data?.data
            if (mediaData?.url) {
                const payload = JSON.stringify({
                    type: "image",
                    url: mediaData.url,
                    name: mediaData.name || file.name,
                    size: mediaData.size || file.size,
                })
                sendGroupEncryptedMessage(payload)
            }
        } catch (err: any) {
            console.error("Photo upload failed:", err)
            const msg = err.response?.data?.message || "Failed to upload photo"
            alert(msg)
        } finally {
            setIsUploadingMedia(false)
            setUploadingFile(null)
        }
    }

    // ── send document / PDF (direct download) ───────────────────────────────
    const handleSendPdf = async (file: File) => {
        if (!file) return
        setIsUploadingMedia(true)
        setUploadingFile({ name: file.name, size: file.size, type: file.type })
        try {
            const formData = new FormData()
            formData.append("file", file)

            const response = await axiosInstance.post("/upload/media", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })

            const mediaData = response.data?.data
            if (mediaData?.url) {
                const payload = JSON.stringify({
                    type: "file",
                    url: mediaData.url,
                    name: mediaData.name || file.name,
                    size: mediaData.size || file.size,
                })
                sendGroupEncryptedMessage(payload)
            }
        } catch (err: any) {
            console.error("PDF upload failed:", err)
            const msg = err.response?.data?.message || "Failed to upload document"
            alert(msg)
        } finally {
            setIsUploadingMedia(false)
            setUploadingFile(null)
        }
    }

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
        leaveGroup(undefined, {
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
    const { mutate: generateInvite } = usePostApi(
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
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/70 dark:bg-[#0b1120]">

            {/* header matching mockup */}
            <div className="h-16 flex-shrink-0 flex items-center justify-between border-b border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md px-3 sm:px-6 shadow-xs z-10">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
                    {onBack && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={onBack} 
                            className="mr-0.5 sm:mr-1 lg:hidden rounded-full text-slate-600 dark:text-slate-300 flex-shrink-0"
                            aria-label="Back"
                        >
                            <ChevronLeft size={22} />
                        </Button>
                    )}
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-bold shadow-xs overflow-hidden flex-shrink-0">
                        {group.avatar
                            ? <img src={group.avatar} className="h-full w-full object-cover" />
                            : <Users size={18} />
                        }
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{liveGroup.name}</p>
                            <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-tight flex-shrink-0">
                                <Lock size={8} strokeWidth={3} /> E2EE
                            </div>
                        </div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                            {memberCount} member{memberCount !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                    {/* End-to-end encrypted pill matching mockup */}
                    <div className="hidden md:flex items-center gap-1.5 px-3 py-1 mr-1 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200/80 dark:border-slate-700/60">
                        <Lock size={12} className="text-slate-600 dark:text-slate-400" />
                        <span>End-to-end encrypted</span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsSearchOpen((prev) => !prev)}
                        className={`p-2 rounded-full transition-colors ${
                            isSearchOpen 
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 ring-1 ring-purple-500/30" 
                                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                        title="Search in group"
                        aria-label="Search in group"
                    >
                        <Search size={18} />
                    </button>
                    <button
                        type="button"
                        className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Start group video call"
                        aria-label="Start group video call"
                    >
                        <Video size={18} />
                    </button>
                    <button
                        type="button"
                        className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Start group voice call"
                        aria-label="Start group voice call"
                    >
                        <Phone size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowInfo((prev) => !prev)}
                        className={`p-2 rounded-full transition-colors ${
                            showInfo 
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300" 
                                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                        title="Group info & options"
                        aria-label="Group info & options"
                    >
                        <MoreVertical size={18} />
                    </button>
                    {onClose && (
                        <div className="hidden sm:block border-l border-slate-200 dark:border-slate-800 ml-1 pl-1">
                            <button
                                type="button"
                                onClick={onClose} 
                                className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Close chat"
                                aria-label="Close chat"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Workable search banner */}
            {isSearchOpen && (
                <div className="flex items-center gap-2 px-3 sm:px-6 py-2 bg-white/95 dark:bg-[#111827]/95 border-b border-slate-200/90 dark:border-slate-800/80 backdrop-blur-md z-15 shadow-2xs animate-in slide-in-from-top-2 duration-150">
                    <div className="relative flex-1 flex items-center">
                        <Search size={15} className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault()
                                    if (e.shiftKey) goToPrevMatch()
                                    else goToNextMatch()
                                } else if (e.key === "Escape") {
                                    closeSearch()
                                }
                            }}
                            placeholder="Search in group..."
                            className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                        {searchQuery.trim() ? (
                            matchingMessageIds.length > 0 ? (
                                <>
                                    <span className="font-semibold text-purple-600 dark:text-purple-400 tabular-nums px-1 text-[11px] sm:text-xs">
                                        {currentMatchIndex + 1} of {matchingMessageIds.length}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={goToPrevMatch}
                                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                                        title="Previous match (Shift+Enter)"
                                    >
                                        <ChevronUp size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={goToNextMatch}
                                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                                        title="Next match (Enter)"
                                    >
                                        <ChevronDown size={16} />
                                    </button>
                                </>
                            ) : (
                                <span className="text-slate-400 italic text-[11px] sm:text-xs px-1">No matches</span>
                            )
                        ) : null}
                    </div>

                    <button
                        type="button"
                        onClick={closeSearch}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                        title="Close search (Esc)"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* messages area */}
            <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4 custom-scrollbar"
            >
                <div ref={topRef} className="h-1" />
                
                {isLoadingMore && (
                    <div className="flex justify-center py-2">
                        <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                    </div>
                )}

                {/* E2EE banner at top of messages matching mockup */}
                <div className="flex items-center justify-center gap-3 p-3 px-5 my-2 mb-4 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-center max-w-lg mx-auto shadow-2xs">
                    <Lock size={15} className="text-slate-700 dark:text-slate-300 shrink-0" />
                    <div className="text-left sm:text-center">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            Messages are secured with end-to-end encryption.
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Only members of this group can read these messages.
                        </p>
                    </div>
                </div>

                {(isFetching && messages.length === 0) ? (
                    <div className="flex-1 space-y-3 p-2 animate-in fade-in duration-300">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className={`flex ${i % 3 === 0 ? "justify-end" : "justify-start"}`}>
                                <div className={`h-11 ${i % 3 === 0 ? "w-44" : i % 2 === 0 ? "w-60" : "w-36"} rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse ${i % 3 === 0 ? "rounded-br-xs" : "rounded-bl-xs"}`} />
                            </div>
                        ))}
                    </div>
                ) : (isSuccess && messages.length === 0) ? (
                    <div className="flex h-64 flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 shadow-inner">
                            <MessageSquare size={32} />
                        </div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No messages yet — say hello 👋</p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg: IGroupMessage) => {
                            const isMine = msg.sender_id === authUser?.id
                            const isSystem = msg.type === "system"

                            if (isSystem) {
                                return (
                                    <div key={msg.id} className="flex justify-center my-2 animate-in fade-in duration-300">
                                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 px-4 py-1 rounded-full border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex items-center gap-1.5">
                                            {msg.content.toLowerCase().includes("join") ? (
                                                <Users size={12} className="text-slate-400" />
                                            ) : (
                                                <UserMinus size={12} className="text-slate-400" />
                                            )}
                                            {msg.content}
                                            <span className="text-[10px] text-slate-400 font-normal ml-1">
                                                {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                                            </span>
                                        </span>
                                    </div>
                                )
                            }

                            const decryptedContent = decryptMessage(msg)
                            if (decryptedContent === null) return null

                            // Check if decrypted content is a rich media payload
                            let richPayload: {
                                type: "file" | "audio" | "image"
                                url: string
                                name?: string
                                size?: number
                                duration?: number
                            } | null = null
                            try {
                                if (
                                    decryptedContent.startsWith('{"type":"file"') ||
                                    decryptedContent.startsWith('{"type":"audio"') ||
                                    decryptedContent.startsWith('{"type":"image"')
                                ) {
                                    richPayload = JSON.parse(decryptedContent)
                                }
                            } catch {}

                            const isImage = richPayload?.type === "image" || (
                                richPayload?.type === "file" &&
                                /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(richPayload?.name || "")
                            )
                            const isAudio = richPayload?.type === "audio"
                            const isDoc = richPayload?.type === "file" && !isImage
                            const isMedia = isImage || isAudio || isDoc

                            const shouldAnimate = isInitialScrollDone.current && (msg.is_pending || msg.id < 0)
                            const msgAggReactions = getAggregatedReactions(msg.reactions, authUser?.id || 0)
                            const isHovered = hoveredMsgId === msg.id || moreEmojiMsgId === msg.id
                            const isStarred = msg.starred?.some(s => Number(s.user_id) === Number(authUser?.id)) ?? false
                            const isCurrentSearchMatch = isSearchOpen && matchingMessageIds.length > 0 && matchingMessageIds[currentMatchIndex] === msg.id
                            const isSearchMatch = isSearchOpen && matchingMessageIds.includes(msg.id)

                            return (
                                <div
                                    key={msg.id}
                                    id={`group-msg-${msg.id}`}
                                    onMouseEnter={() => setHoveredMsgId(msg.id)}
                                    onMouseLeave={() => {
                                        if (moreEmojiMsgId !== msg.id) {
                                            setHoveredMsgId(null)
                                        }
                                    }}
                                    className={`flex ${isMine ? "justify-end" : "justify-start"} items-end gap-2.5 transition-all duration-200 rounded-2xl ${
                                        isCurrentSearchMatch
                                            ? "bg-purple-500/15 ring-2 ring-purple-500 dark:ring-purple-400 ring-offset-2 dark:ring-offset-[#0b1120] scale-[1.01] p-1"
                                            : isSearchMatch
                                                ? "bg-purple-500/5 ring-1 ring-purple-400/40 p-1"
                                                : ""
                                    } ${shouldAnimate ? "animate-in slide-in-from-bottom-2 duration-200" : ""}`}
                                >
                                    {!isMine && (
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-bold text-xs shadow-xs overflow-hidden self-end mb-1">
                                            {msg.sender?.avatar
                                                ? <img src={msg.sender.avatar} className="h-full w-full object-cover" />
                                                : msg.sender?.name?.[0]?.toUpperCase()
                                            }
                                        </div>
                                    )}

                                    <div className={`group relative max-w-[85%] sm:max-w-md flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                                        
                                        {/* floating hover action toolbar */}
                                        <div className={`absolute -top-4 ${
                                            isMine ? "right-2" : "left-2"
                                        } z-30 transition-all duration-150 emoji-picker-container ${
                                            isHovered
                                                ? "opacity-100 pointer-events-auto scale-100"
                                                : "opacity-0 pointer-events-none scale-95"
                                        }`}>
                                            <div className="flex items-center gap-0.5 bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 rounded-full px-1.5 py-0.5 shadow-md">
                                                {COMMON_EMOJIS.map(emoji => (
                                                    <button
                                                        key={emoji}
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleToggleReaction(msg.id, emoji)
                                                        }}
                                                        className="hover:scale-125 active:scale-95 transition-transform text-xs p-1"
                                                        title={`React with ${emoji}`}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}

                                                {/* +Emoji icon button */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setMoreEmojiMsgId(moreEmojiMsgId === msg.id ? null : msg.id)
                                                    }}
                                                    className={`p-1 rounded-full transition-colors flex items-center justify-center ${
                                                        moreEmojiMsgId === msg.id
                                                            ? "text-purple-600 bg-purple-100 dark:bg-purple-900/40"
                                                            : "text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300"
                                                    }`}
                                                    title="Add custom reaction"
                                                >
                                                    <Smile size={13} />
                                                    <span className="text-[10px] font-bold leading-none -ml-0.5">+</span>
                                                </button>

                                                {!isMedia && (
                                                    <>
                                                        <div className="h-3 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleCopyText(msg.id, decryptedContent)
                                                            }}
                                                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full transition-colors"
                                                            title="Copy text"
                                                        >
                                                            {copiedId === msg.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                                        </button>
                                                    </>
                                                )}

                                                {/* Star message button */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleToggleStar(msg.id)
                                                    }}
                                                    className={`p-1 rounded-full transition-colors flex items-center justify-center ${
                                                        isStarred
                                                            ? "text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/40"
                                                            : "text-slate-400 hover:text-amber-500 dark:hover:text-amber-400"
                                                    }`}
                                                    title={isStarred ? "Unstar message" : "Star message"}
                                                >
                                                    <Star size={12} className={isStarred ? "fill-amber-400 text-amber-500" : ""} />
                                                </button>
                                            </div>

                                            {/* Full Emoji Picker Popover */}
                                            {moreEmojiMsgId === msg.id && (
                                                <div className={`absolute top-full mt-2 ${
                                                    isMine ? "right-0" : "left-0"
                                                } z-50 shadow-2xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150`}>
                                                    <EmojiPicker
                                                        theme={document.documentElement.classList.contains("dark") ? Theme.DARK : Theme.LIGHT}
                                                        onEmojiClick={(emojiData: EmojiClickData) => {
                                                            handleToggleReaction(msg.id, emojiData.emoji)
                                                            setMoreEmojiMsgId(null)
                                                        }}
                                                        lazyLoadEmojis={true}
                                                        searchPlaceHolder="React with emoji..."
                                                        width={300}
                                                        height={380}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {!isMine && (
                                            <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 mb-1 ml-1 truncate">
                                                {msg.sender?.name}
                                            </p>
                                        )}

                                        {/* bubble */}
                                        <div className="relative inline-block">
                                            {isImage ? (
                                                <ImageBubble
                                                    url={richPayload!.url}
                                                    name={richPayload?.name || "Photo"}
                                                    size={richPayload?.size}
                                                    isMine={isMine}
                                                    createdAt={msg.created_at || new Date().toISOString()}
                                                    isPending={msg.id < 0 || msg.is_pending}
                                                    isStarred={isStarred}
                                                />
                                            ) : isAudio ? (
                                                <AudioPlayerBubble
                                                    url={richPayload!.url}
                                                    duration={richPayload?.duration}
                                                    isMine={isMine}
                                                    createdAt={msg.created_at || new Date().toISOString()}
                                                    isPending={msg.id < 0 || msg.is_pending}
                                                    isStarred={isStarred}
                                                />
                                            ) : isDoc ? (
                                                <DocumentCard
                                                    url={richPayload!.url}
                                                    name={richPayload?.name || "Attachment"}
                                                    size={richPayload?.size}
                                                    isMine={isMine}
                                                    createdAt={msg.created_at || new Date().toISOString()}
                                                    isPending={msg.id < 0 || msg.is_pending}
                                                    isStarred={isStarred}
                                                />
                                            ) : (
                                                <div className={`relative px-4 py-2.5 text-sm break-words shadow-xs ${
                                                    isMine
                                                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl rounded-br-xs shadow-purple-600/10"
                                                        : "bg-white dark:bg-[#1a233a] text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-slate-800 rounded-2xl rounded-tl-xs"
                                                }`}>
                                                    <RichTextRenderer content={decryptedContent} isMine={isMine} />
                                                    <div className={`text-[10px] tabular-nums mt-1 flex items-center justify-end gap-1 ${
                                                        isMine ? "text-purple-200/90" : "text-slate-400 dark:text-slate-500"
                                                    }`}>
                                                        <span>{new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        {isStarred && (
                                                            <Star size={10} className="fill-amber-400 text-amber-400 inline shrink-0" />
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Attached reaction pill docked below bubble */}
                                        {msgAggReactions.length > 0 && (
                                            <div className={`relative z-20 -mt-2.5 flex items-center ${
                                                isMine ? "mr-1.5 justify-end" : "ml-1.5 justify-start"
                                            } max-w-full`}>
                                                <div className="flex flex-wrap items-center gap-1 bg-white/95 dark:bg-[#1a233a]/95 border border-slate-200/90 dark:border-slate-700/80 rounded-full px-2.5 py-0.5 shadow-sm backdrop-blur-md max-w-full">
                                                    {msgAggReactions.map(r => (
                                                        <button 
                                                            key={r.emoji}
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleToggleReaction(msg.id, r.emoji)
                                                            }}
                                                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-all hover:scale-110 active:scale-95 ${
                                                                r.hasReacted
                                                                    ? "bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold"
                                                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                            }`}
                                                            title={r.hasReacted ? `You reacted with ${r.emoji} (click to remove)` : `Reacted with ${r.emoji}`}
                                                        >
                                                            <span className="text-sm leading-none">{r.emoji}</span>
                                                            {r.count > 1 && (
                                                                <span className="text-[10px] font-semibold leading-none">{r.count}</span>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </>
                )}

                {/* typing indicator matching mockup */}
                {typingUsers.length > 0 && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="px-3.5 py-2 rounded-2xl rounded-bl-xs bg-white dark:bg-[#162032] border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400 animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400 animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400 animate-bounce"></span>
                            </div>
                            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                {typingUsers.length === 1
                                    ? `${typingUsers[0].senderName} is typing...`
                                    : `${typingUsers.length} people are typing...`
                                }
                            </span>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* input matching mockup */}
            <div className="border-t border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md p-3 sm:p-4 pb-safe">
                {liveGroup.settings?.who_can_send === "admins" && !isAdmin ? (
                    <div className="flex items-center justify-center p-3 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <Shield size={14} className="text-purple-600" /> Only admins can send messages
                        </p>
                    </div>
                ) : (
                    <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
                        {isRecordingAudio ? (
                            <AudioRecorderBar
                                onSendAudio={handleSendAudioNote}
                                onCancel={() => setIsRecordingAudio(false)}
                                isUploading={isUploadingMedia}
                            />
                        ) : (
                            <RichMessageInput
                                placeholder={`Message ${liveGroup.name}...`}
                                value={input}
                                onChange={handleTyping}
                                onSend={handleSend}
                                onSendPhoto={handleSendPhoto}
                                onSendPdf={handleSendPdf}
                                onStartVoiceRecording={() => setIsRecordingAudio(true)}
                                isUploading={isUploadingMedia}
                                uploadingFile={uploadingFile}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* info sidebar matching mockup 3 & 4 */}
            <SidebarPanel
                open={showInfo}
                onClose={() => setShowInfo(false)}
                position="right"
                width="w-full sm:w-[400px] md:w-[430px]"
                title="Group Info"
            >
                <div className="flex flex-col min-h-full space-y-5 pb-4">
                    {/* ── 1. Group Profile Header ── */}
                    <div className="flex flex-col items-center text-center pt-1 px-2">
                        <div 
                            className="relative group/avatar cursor-pointer" 
                            onClick={() => canEditInfo && setShowEditGroup(true)}
                            title={canEditInfo ? "Change group photo" : undefined}
                        >
                            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg overflow-hidden border-2 border-white dark:border-slate-800">
                                {liveGroup.avatar ? (
                                    <img src={liveGroup.avatar} className="w-full h-full object-cover" />
                                ) : (
                                    <Users size={38} />
                                )}
                            </div>
                            {canEditInfo && (
                                <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover/avatar:scale-110 transition-transform">
                                    <Camera size={13} />
                                </div>
                            )}
                        </div>

                        {/* Group Name + Edit Pencil */}
                        <div className="flex items-center justify-center gap-1.5 mt-3">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                                {liveGroup.name}
                            </h2>
                            {canEditInfo && (
                                <button
                                    type="button"
                                    onClick={() => setShowEditGroup(true)}
                                    className="p-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-md transition-colors"
                                    title="Edit group name"
                                >
                                    <Pencil size={13} />
                                </button>
                            )}
                        </div>

                        {/* Subtitle row: members count · E2EE badge */}
                        <div className="flex items-center justify-center gap-2 mt-1">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                {memberCount} member{memberCount !== 1 ? "s" : ""}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60">
                                <Lock size={10} className="text-slate-500" />
                                <span>End-to-end encrypted</span>
                            </div>
                        </div>

                        {/* Description box with edit pencil */}
                        <div className="relative w-full mt-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 text-left">
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pr-6">
                                {liveGroup.description || "A space for discussions, feedback and creative ideas."}
                            </p>
                            {canEditInfo && (
                                <button
                                    type="button"
                                    onClick={() => setShowEditGroup(true)}
                                    className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-md transition-colors"
                                    title="Edit description"
                                >
                                    <Pencil size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── 2. Quick Actions: Settings & Invite ── */}
                    <div className="space-y-1 px-1">
                        {isAdmin && (
                            <button
                                type="button"
                                onClick={() => setShowSettings(true)}
                                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors text-left group/action cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover/action:text-purple-600 dark:group-hover/action:text-purple-400 transition-colors">
                                        <Settings size={16} />
                                    </div>
                                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                                        Group Settings
                                    </span>
                                </div>
                                <ChevronRight size={15} className="text-slate-400" />
                            </button>
                        )}

                        {canShareLink && (
                            <div className="space-y-1.5">
                                <button
                                    type="button"
                                    onClick={inviteLink ? handleCopy : handleGenerateLink}
                                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors text-left group/action cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover/action:text-purple-600 dark:group-hover/action:text-purple-400 transition-colors">
                                            <Link2 size={16} />
                                        </div>
                                        <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                                            Invite Link
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {copied && (
                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                                <Check size={12} /> Copied
                                            </span>
                                        )}
                                        <ChevronRight size={15} className="text-slate-400" />
                                    </div>
                                </button>
                                {inviteLink && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/50 text-[11px] text-purple-700 dark:text-purple-300">
                                        <p className="flex-1 truncate font-mono text-[10px]">{inviteLink}</p>
                                        <button 
                                            type="button"
                                            onClick={handleCopy}
                                            className="font-bold underline text-[10px] hover:text-purple-900 dark:hover:text-purple-100 cursor-pointer"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── 3. Tabs: Members / Media / Files ── */}
                    <div className="border-t border-slate-200/80 dark:border-slate-800 pt-2">
                        <div className="flex items-center border-b border-slate-200/80 dark:border-slate-800 px-2">
                            <button
                                type="button"
                                onClick={() => setInfoTab("members")}
                                className={`pb-2.5 px-3 text-xs font-bold transition-all relative cursor-pointer ${
                                    infoTab === "members"
                                        ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600"
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                }`}
                            >
                                Members ({groupDetail?.members?.length || memberCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => setInfoTab("media")}
                                className={`pb-2.5 px-3 text-xs font-bold transition-all relative cursor-pointer ${
                                    infoTab === "media"
                                        ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600"
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                }`}
                            >
                                Media
                            </button>
                            <button
                                type="button"
                                onClick={() => setInfoTab("files")}
                                className={`pb-2.5 px-3 text-xs font-bold transition-all relative cursor-pointer ${
                                    infoTab === "files"
                                        ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600"
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                }`}
                            >
                                Files
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="pt-3 px-1">
                            {infoTab === "members" && (
                                <div className="space-y-3">
                                    {/* Member Search input */}
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={memberSearch}
                                            onChange={(e) => setMemberSearch(e.target.value)}
                                            placeholder="Search members..."
                                            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                        />
                                    </div>

                                    {canAddMembers && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAddMember(true)}
                                            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-dashed border-purple-300 dark:border-purple-800/80 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-xs font-bold transition-colors cursor-pointer"
                                        >
                                            <UserPlus size={14} />
                                            <span>Add Member</span>
                                        </button>
                                    )}

                                    {/* Members list */}
                                    <div className="space-y-1">
                                        {(groupDetail?.members || [])
                                            .filter((m: IGroupMember) => 
                                                !memberSearch.trim() || 
                                                m.user?.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
                                                m.user?.username?.toLowerCase().includes(memberSearch.toLowerCase())
                                            )
                                            .map((m: IGroupMember) => {
                                                const isUserAdmin = m.role === "admin"
                                                return (
                                                    <div 
                                                        key={m.id} 
                                                        className="flex items-center gap-3 py-2 px-2.5 rounded-xl transition-colors hover:bg-slate-100/70 dark:hover:bg-slate-800/50 group/member"
                                                    >
                                                        <div className="relative flex-shrink-0">
                                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-xs overflow-hidden">
                                                                {m.user?.avatar ? (
                                                                    <img src={m.user.avatar} className="h-full w-full object-cover" />
                                                                ) : (
                                                                    m.user?.name?.[0]?.toUpperCase()
                                                                )}
                                                            </div>
                                                            {m.user?.is_online && (
                                                                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500" />
                                                            )}
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                                                                {m.user?.name}
                                                                {m.user?.id === authUser?.id && (
                                                                    <span className="font-normal text-slate-400 text-xs"> (you)</span>
                                                                )}
                                                            </p>
                                                            <p className="text-[11px] font-medium text-slate-400 truncate flex items-center gap-1">
                                                                {m.user?.is_online ? (
                                                                    <span className="text-emerald-500 font-semibold">● Online</span>
                                                                ) : (
                                                                    <span>Offline</span>
                                                                )}
                                                            </p>
                                                        </div>

                                                        {/* Role Badge */}
                                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                                                isUserAdmin
                                                                    ? "bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60"
                                                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60"
                                                            }`}>
                                                                {m.role}
                                                            </span>

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
                                                    </div>
                                                )
                                            })}
                                    </div>
                                </div>
                            )}

                            {infoTab === "media" && (
                                <div className="py-6 text-center">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-2">
                                        <ImageIcon size={22} />
                                    </div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Shared Media</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Photos and videos shared in this group will appear here.</p>
                                </div>
                            )}

                            {infoTab === "files" && (
                                <div className="py-6 text-center">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-2">
                                        <FileText size={22} />
                                    </div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Shared Documents</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">PDFs and documents shared in this group will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── 4. Danger Zone: Leave Group ── */}
                    <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-800 px-1">
                        {isAdmin && liveGroup.join_mode === "approval" && (
                            <button
                                type="button"
                                onClick={() => setShowJoinRequests(true)}
                                className="w-full mb-2 py-2.5 px-3 rounded-xl border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                            >
                                <span className="flex items-center gap-2"><Users size={15} /> Join Requests</span>
                                <ChevronRight size={14} />
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => setShowLeaveConfirm(true)}
                            className="w-full py-2.5 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                            <LogOut size={15} />
                            <span>Leave Group</span>
                        </button>
                    </div>
                </div>
            </SidebarPanel>

            {/* Dialogs... (keep existing logic but update styling if needed) */}
            <ConfirmDialog open={showLeaveConfirm} onClose={() => setShowLeaveConfirm(false)} onConfirm={handleLeaveConfirm} title="Leave Group" message={`Are you sure you want to leave "${liveGroup.name}"?`} confirmText="Leave Group" variant="warning" isLoading={isLeaving} />
            <ConfirmDialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={handleDeleteConfirm} title="Delete Group" message={`Are you sure you want to delete "${liveGroup.name}"? This action is permanent.`} confirmText="Delete Group" variant="danger" isLoading={isDeleting} />
            <ConfirmDialog open={!!memberToRemove} onClose={() => setMemberToRemove(null)} onConfirm={handleRemoveConfirm} title="Remove Member" message={`Remove ${memberToRemove?.user?.name} from the group?`} confirmText="Remove" variant="danger" isLoading={isRemoving} />
            <ConfirmDialog open={!!memberToUpdateRole} onClose={() => setMemberToUpdateRole(null)} onConfirm={handleRoleConfirm} title={memberToUpdateRole?.newRole === "admin" ? "Make Admin" : "Remove Admin"} message={memberToUpdateRole?.newRole === "admin" ? `Promote ${memberToUpdateRole?.member.user?.name} to admin?` : `Remove admin rights for ${memberToUpdateRole?.member.user?.name}?`} confirmText="Confirm" variant="info" isLoading={isUpdatingRole} />

            <AddMemberModal 
                open={showAddMember} 
                onClose={() => setShowAddMember(false)} 
                groupId={group.id} 
                existingMemberIds={(groupDetail?.members || []).map((m: any) => m.user?.id || m.user_id)}
            />
            {liveGroup.settings && <GroupSettingsModal open={showSettings} onClose={() => setShowSettings(false)} groupId={group.id} groupName={liveGroup.name} settings={liveGroup.settings} />}
            <EditGroupModal open={showEditGroup} onClose={() => setShowEditGroup(false)} group={liveGroup} />
            <JoinRequestsModal open={showJoinRequests} onClose={() => setShowJoinRequests(false)} groupId={group.id} />
        </div>
    )
}

export default GroupChat