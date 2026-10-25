import { useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } from "react"
import { useSelector } from "react-redux"
import { 
    User, Send, ChevronLeft, MessageSquare, X, Lock, ShieldAlert, 
    Ban, Check, UserMinus, Loader2, Video, Phone, Search, 
    Smile, CheckCheck, Copy, Archive, ArchiveRestore, Star, MoreHorizontal,
    ChevronUp, ChevronDown
} from "lucide-react"
import { useGetApi, usePatchApi } from "@/hooks/api"
import axiosInstance from "@/api/axios"
import { useSocket } from "@/hooks/socket"
import { useChat, type IMessage, type IMessageReaction, type IStarredItem } from "@/pages/chat/hooks"
import { getUser } from "@/redux/slices/auth.slice"
import type { IUser, IConversation } from "@/types"
import Button from "@/common/Button"
import { useQueryClient } from "@tanstack/react-query"
import {
    encryptDirectMessage,
    decryptDirectMessage,
    getSessionKeys,
    type EncryptedMessage
} from "@/utils/crypto"

import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react"
import { usePresence } from "@/hooks/usePresence"
import DocumentCard from "@/pages/chat/components/media/DocumentCard"
import AudioPlayerBubble from "@/pages/chat/components/media/AudioPlayerBubble"
import AudioRecorderBar from "@/pages/chat/components/media/AudioRecorderBar"
import ImageBubble from "@/pages/chat/components/media/ImageBubble"
import CallLogBubble from "@/pages/chat/components/media/CallLogBubble"
import RichTextRenderer from "@/pages/chat/components/RichTextRenderer"
import RichMessageInput from "@/pages/chat/components/input/RichMessageInput"
import UserProfileModal from "./UserProfileModal"
import { useCall } from "@/context/CallContext"

interface Props {
    user: IUser
    onBack?: () => void
    onClose?: () => void
}

const COMMON_EMOJIS = ["❤️", "👍", "🔥", "😂", "🤩", "🎉"]

const DirectChat = ({ user, onBack, onClose }: Props) => {
    const authUser = useSelector(getUser)
    const socket = useSocket()
    const myKeys = getSessionKeys()
    const queryClient = useQueryClient()
    const { isUserOnline, getUserLastSeen, formatLastActive } = usePresence()
    const { startCall, callStatus } = useCall()

    const isOnline = isUserOnline(user.id, user.is_online, user.last_seen_privacy)
    const lastSeen = getUserLastSeen(user.id, user.last_seen, user.last_seen_privacy)

    const [input, setInput] = useState("")
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [hasMore, setHasMore] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const topRef = useRef<HTMLDivElement>(null)
    const bottomRef = useRef<HTMLDivElement>(null)

    const isInitialScrollDone = useRef(false)
    const lastMessageIdRef = useRef<number | null>(null)
    const decryptCache = useRef<Map<string, string | null>>(new Map())

    const [hoveredMsgId, setHoveredMsgId] = useState<number | null>(null)
    const [moreEmojiMsgId, setMoreEmojiMsgId] = useState<number | null>(null)

    // Media and voice note state
    const [isRecordingAudio, setIsRecordingAudio] = useState(false)
    const [isUploadingMedia, setIsUploadingMedia] = useState(false)
    const [uploadingFile, setUploadingFile] = useState<{ name: string; size?: number; type?: string } | null>(null)
    const [showMoreMenu, setShowMoreMenu] = useState(false)
    const [showProfileModal, setShowProfileModal] = useState(false)

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
            if (!target.closest('.header-more-menu') && !target.closest('.header-more-btn')) {
                setShowMoreMenu(false)
            }
        }
        document.addEventListener("mousedown", handleDocumentClick)
        return () => document.removeEventListener("mousedown", handleDocumentClick)
    }, [])

    interface AggregatedReaction {
        emoji: string
        count: number
        hasReacted: boolean
    }

    const getAggregatedReactions = (msgReactions: IMessageReaction[] | undefined, currentUserId: number): AggregatedReaction[] => {
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

    const [copiedId, setCopiedId] = useState<number | null>(null)

    const handleCopyText = (id: number, text: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 1500)
    }

    // ── fetch conversation ────────────────────────────────────────────────
    const { data: convData } = useGetApi<IConversation>(
        `/conversations/user/${user.id}`,
        undefined,
        {
            queryKey: `conversation-${user.id}`,
            enabled: !!user.id,
        }
    )

    const conversation = convData?.data as IConversation
    const isPending = conversation?.status === 'pending'
    const isRejected = conversation?.status === 'rejected'
    const isAccepted = conversation?.status === 'accepted'

    const isIRequester = conversation?.sender_id === authUser?.id
    const isIRecipient = conversation?.receiver_id === authUser?.id

    const iBlocked = isIRequester ? conversation?.blocked_by_sender : conversation?.blocked_by_receiver
    const otherBlockedMe = isIRequester ? conversation?.blocked_by_receiver : conversation?.blocked_by_sender
    const isArchived = isIRequester ? (conversation as any)?.archived_by_sender : (conversation as any)?.archived_by_receiver

    const handleStartCall = (isVideo: boolean) => {
        if (!user) return
        startCall(
            {
                id: user.id,
                name: user.name,
                avatar: user.avatar,
                username: user.username,
            },
            isVideo,
            conversation?.id
        )
    }

    // If I am the requester and status is rejected, it means THEY rejected ME
    const iAmRejected = isIRequester && isRejected

    const { mutate: updateStatus } = usePatchApi(`/conversations/${conversation?.id}/status`)
    const { mutate: updateBlock } = usePatchApi(`/conversations/${conversation?.id}/block`)
    const { mutate: updateArchive } = usePatchApi(`/conversations/${conversation?.id}/archive`)

    // ── initial load ─────────────────────────────────────────────────────
    const { data: messageData, isFetching, isSuccess, refetch: refetchMessages } = useGetApi<{ messages: IMessage[], hasMore: boolean }>(
        `/message/${user.id}`,
        { limit: 30 },
        {
            queryKey: `messages-${user.id}`,
            enabled: !!user.id,
            staleTime: 30 * 1000,
        }
    )

    const initialMsgs = (Array.isArray(messageData?.data)
        ? messageData.data
        : (messageData?.data as any)?.messages) ?? []

    const {
        messages,
        setMessages,
        isTyping,
        activeConvRef,
        sendMessage,
        emitMarkSeen,
        emitTypingStart,
        emitTypingStop,
        emitToggleReaction,
    } = useChat({
        socket,
        selectedUserId: user.id,
        currentUserId: authUser?.id ?? null,
        initialMessages: initialMsgs,
        onStatusUpdated: (data) => {
            queryClient.invalidateQueries({ queryKey: [`conversation-${user.id}`] })
            queryClient.invalidateQueries({ queryKey: ['conversations'] })
            queryClient.invalidateQueries({ queryKey: [`messages-${user.id}`] })
            if (data.status === 'accepted') {
                refetchMessages().then((res) => {
                    if (res?.data?.data) {
                        const msgs = Array.isArray(res.data.data)
                            ? res.data.data
                            : (res.data.data as any)?.messages ?? []
                        setMessages(msgs)
                        isInitialScrollDone.current = false
                        const conversationId = msgs[0]?.conversation_id ?? conversation?.id ?? null
                        activeConvRef.current = conversationId
                        if (conversationId && socket && !iBlocked) {
                            emitMarkSeen(conversationId, user.id)
                        }
                    }
                })
            }
        }
    })

    const handleToggleStar = async (messageId: number) => {
        if (!authUser?.id) return

        // 1. Instant optimistic star update
        setMessages((prev) =>
            prev.map((m) => {
                if (Number(m.id) !== Number(messageId)) return m
                const current = m.starred || []
                const isCurrentlyStarred = current.some((s) => Number(s.user_id) === Number(authUser.id))
                let nextStarred: IStarredItem[]
                if (isCurrentlyStarred) {
                    nextStarred = current.filter((s) => Number(s.user_id) !== Number(authUser.id))
                } else {
                    nextStarred = [...current, { user_id: Number(authUser.id), message_id: Number(messageId) }]
                }
                return { ...m, starred: nextStarred }
            })
        )

        try {
            const res = await axiosInstance.post("/starred-messages/toggle", { messageId })
            const serverStarred = res.data?.data?.isStarred
            if (typeof serverStarred === "boolean") {
                setMessages((prev) =>
                    prev.map((m) => {
                        if (Number(m.id) !== Number(messageId)) return m
                        const current = (m.starred || []).filter((s) => Number(s.user_id) !== Number(authUser.id))
                        return {
                            ...m,
                            starred: serverStarred
                                ? [...current, { user_id: Number(authUser.id), message_id: Number(messageId) }]
                                : current,
                        }
                    })
                )
            }
            queryClient.invalidateQueries({ queryKey: ["starred-messages"] })
            queryClient.invalidateQueries({ queryKey: ["starred-messages-ids"] })
            queryClient.invalidateQueries({ queryKey: [`messages-${user.id}`] })
        } catch (err) {
            console.error("Failed to toggle star:", err)
            refetchMessages()
        }
    }

    const handleToggleReaction = (messageId: number, emoji: string) => {
        if (!authUser?.id) return

        // Instant optimistic update
        setMessages((prev) =>
            prev.map((m) => {
                if (m.id !== messageId) return m
                const current = m.reactions || []
                const existingIdx = current.findIndex(
                    (r) => r.emoji === emoji && r.user_id === authUser.id
                )
                let nextReactions: IMessageReaction[]
                if (existingIdx >= 0) {
                    nextReactions = current.filter((_, idx) => idx !== existingIdx)
                } else {
                    nextReactions = [
                        ...current,
                        {
                            id: -Date.now(),
                            message_id: messageId,
                            user_id: authUser.id,
                            emoji,
                        },
                    ]
                }
                return { ...m, reactions: nextReactions }
            })
        )

        // Broadcast and save to PostgreSQL
        emitToggleReaction(messageId, emoji, user.id)
    }

    const handleUpdateStatus = (status: 'accepted' | 'rejected') => {
        updateStatus({ body: { status } }, {
            onSuccess: async () => {
                await queryClient.invalidateQueries({ queryKey: [`conversation-${user.id}`] })
                await queryClient.invalidateQueries({ queryKey: ['conversations'] })
                await queryClient.invalidateQueries({ queryKey: [`messages-${user.id}`] })

                if (status === 'accepted') {
                    const res = await refetchMessages()
                    if (res?.data?.data) {
                        const msgs = Array.isArray(res.data.data)
                            ? res.data.data
                            : (res.data.data as any)?.messages ?? []
                        setMessages(msgs)
                        isInitialScrollDone.current = false
                        const conversationId = msgs[0]?.conversation_id ?? conversation?.id ?? null
                        activeConvRef.current = conversationId
                        if (conversationId && socket && !iBlocked) {
                            emitMarkSeen(conversationId, user.id)
                        }
                    }
                }
            }
        })
    }

    const handleToggleBlock = (block: boolean) => {
        updateBlock({ body: { block } }, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: [`conversation-${user.id}`] })
                queryClient.invalidateQueries({ queryKey: ['conversations'] })
                queryClient.invalidateQueries({ queryKey: ['conversations-archived'] })
            }
        })
    }

    const handleToggleArchive = (archive: boolean) => {
        updateArchive({ body: { archive } }, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: [`conversation-${user.id}`] })
                queryClient.invalidateQueries({ queryKey: ['conversations'] })
                queryClient.invalidateQueries({ queryKey: ['conversations-archived'] })
            }
        })
    }

    // Helper to decrypt messages with O(1) per-message caching
    const decryptMessage = useCallback((msg: IMessage) => {
        const cacheKey = `${msg.id}_${msg.content}`
        if (decryptCache.current.has(cacheKey)) {
            return decryptCache.current.get(cacheKey)!
        }

        let decrypted: string | null = msg.content
        try {
            const parsed = JSON.parse(msg.content) as EncryptedMessage
            if (parsed.c && parsed.n && myKeys) {
                const senderPublicKey = user.public_key
                if (!senderPublicKey) return null

                decrypted = decryptDirectMessage(parsed, senderPublicKey, myKeys.secretKey)
            }
        } catch {
            decrypted = msg.content
        }

        decryptCache.current.set(cacheKey, decrypted)
        return decrypted
    }, [user.public_key, myKeys])

    // ── search within conversation ───────────────────────────────────────
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
                    if (parsed.type === "call_log") {
                        textToSearch = `${parsed.callType} call ${parsed.status}`
                    } else {
                        textToSearch = parsed.name || parsed.caption || content
                    }
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
            const el = document.getElementById(`direct-msg-${targetId}`)
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

    // ── sync state when messageData arrives/updates ──────
    useEffect(() => {
        if (messageData?.data) {
            const msgs = Array.isArray(messageData.data)
                ? messageData.data
                : (messageData.data as any)?.messages ?? []

            const more = (messageData.data as any)?.hasMore ?? false

            setMessages(msgs)
            setHasMore(more)

            const conversationId = msgs[0]?.conversation_id ?? null
            activeConvRef.current = conversationId

            if (conversationId && socket && !iBlocked && isAccepted) {
                emitMarkSeen(conversationId, user.id)
            }
        }
    }, [messageData, socket, iBlocked, isAccepted, user.id])

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

    // Backup rAF for images/fonts layout adjustment
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
            const { data: axiosData } = await axiosInstance.get(`/message/${user.id}`, {
                params: { before, limit: 30 }
            })

            const newMessages = axiosData?.data?.messages ?? []
            const more = axiosData?.data?.hasMore ?? false

            if (newMessages.length > 0) {
                // Store current scroll height to maintain position
                const container = scrollContainerRef.current
                const previousHeight = container?.scrollHeight ?? 0

                setMessages(prev => [...newMessages, ...prev])
                setHasMore(more)

                // Adjust scroll after DOM update
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
            console.error("Failed to load more messages", error)
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
        if (iBlocked || isPending || isRejected) return

        emitTypingStart(user.id)

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
            emitTypingStop(user.id)
        }, 2000)
    }

    // ── send encrypted payload helper ────────────────────────────────────
    const sendEncryptedMessage = (rawContent: string) => {
        let finalContent = rawContent
        if (user.public_key && myKeys) {
            const encrypted = encryptDirectMessage(rawContent, user.public_key, myKeys.secretKey)
            finalContent = JSON.stringify(encrypted)
        }

        const optimisticMsg: IMessage = {
            id: -Date.now(),
            content: finalContent,
            sender_id: authUser?.id ?? 0,
            receiver_id: user.id,
            conversation_id: activeConvRef.current || conversation?.id || 0,
            created_at: new Date().toISOString(),
            is_seen: false,
            is_pending: true,
        }

        sendMessage(user.id, finalContent, optimisticMsg)
    }

    // ── send text message ──────────────────────────────────────────────────
    const handleSend = () => {
        if (!input.trim() || iBlocked || iAmRejected) return

        const plainText = input.trim()
        setInput("")
        emitTypingStop(user.id)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

        sendEncryptedMessage(plainText)
    }

    // ── send audio note ────────────────────────────────────────────────────
    const handleSendAudioNote = async (blob: Blob, duration: number) => {
        if (iBlocked || iAmRejected) return
        setIsUploadingMedia(true)

        try {
            const formData = new FormData()
            formData.append("file", blob, `voice_note_${Date.now()}.webm`)
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
                sendEncryptedMessage(payload)
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
        if (!file || iBlocked || iAmRejected) return
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
                sendEncryptedMessage(payload)
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
        if (!file || iBlocked || iAmRejected) return
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
                sendEncryptedMessage(payload)
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

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/70 dark:bg-[#0b1120]">

            {/* top header matching mockup */}
            <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md px-3 sm:px-6 shadow-xs z-20">
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
                    <div
                        onClick={() => setShowProfileModal(true)}
                        className="flex items-center gap-2.5 sm:gap-3 min-w-0 cursor-pointer group"
                        title="Click to view profile"
                    >
                        <div className="relative flex-shrink-0">
                            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 font-display text-sm font-bold text-white shadow-xs overflow-hidden group-hover:ring-2 group-hover:ring-purple-400 transition-all">
                                {user.avatar
                                    ? <img src={user.avatar} className="h-full w-full object-cover" />
                                    : <User size={18} />
                                }
                            </div>
                            {iBlocked ? (
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border-2 border-white dark:border-[#111827] bg-red-600 shadow-2xs" />
                            ) : isOnline ? (
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border-2 border-white dark:border-[#111827] bg-emerald-500 shadow-2xs" />
                            ) : (
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border-2 border-white dark:border-[#111827] bg-slate-400 shadow-2xs" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <p className="truncate text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{user.name}</p>
                                <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-tight flex-shrink-0">
                                    <Lock size={8} strokeWidth={3} /> E2EE
                                </div>
                            </div>
                            <p className="text-xs font-medium truncate">
                                {iBlocked ? (
                                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                                        <Ban size={12} className="stroke-[2.5]" />
                                        Blocked
                                    </span>
                                ) : isTyping ? (
                                    <span className="text-purple-600 dark:text-purple-400 font-semibold animate-pulse">typing...</span>
                                ) : user.last_seen_privacy === "nobody" ? null : isOnline ? (
                                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Online
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 font-medium">
                                        <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                                        {lastSeen ? formatLastActive(lastSeen) : "Offline"}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* header action icons */}
                <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                    {/* 1. Audio/Voice call (directly visible) */}
                    <button
                        type="button"
                        onClick={() => handleStartCall(false)}
                        disabled={callStatus !== "idle" || !!iBlocked || !!otherBlockedMe}
                        className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title={iBlocked || otherBlockedMe ? "Call unavailable" : "Start voice call"}
                        aria-label="Start voice call"
                    >
                        <Phone size={18} />
                    </button>

                    {/* 2. Video call (directly visible) */}
                    <button
                        type="button"
                        onClick={() => handleStartCall(true)}
                        disabled={callStatus !== "idle" || !!iBlocked || !!otherBlockedMe}
                        className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title={iBlocked || otherBlockedMe ? "Call unavailable" : "Start video call"}
                        aria-label="Start video call"
                    >
                        <Video size={18} />
                    </button>

                    {/* 3. Block button (directly visible with red accent circle matching mockup) */}
                    <button
                        type="button"
                        onClick={() => handleToggleBlock(!iBlocked)}
                        className={`p-2 rounded-full transition-all ${
                            iBlocked
                                ? "text-red-600 bg-red-100/90 dark:bg-red-950/70 ring-1 ring-red-400/60 shadow-2xs hover:bg-red-200 dark:hover:bg-red-900/60"
                                : "text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                        }`}
                        title={iBlocked ? "Unblock user" : "Block user"}
                        aria-label={iBlocked ? "Unblock user" : "Block user"}
                    >
                        <Ban size={18} className="stroke-[2.2]" />
                    </button>

                    {/* 4. Three-dots More Menu for other options (Search, Profile, Archive, Close) */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowMoreMenu((prev) => !prev)}
                            className={`header-more-btn p-2 rounded-full transition-colors ${
                                showMoreMenu
                                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                            title="More options"
                            aria-label="More options"
                        >
                            <MoreHorizontal size={18} />
                        </button>

                        {showMoreMenu && (
                            <div className="header-more-menu absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-[#1e293b] py-1.5 shadow-xl border border-slate-200 dark:border-slate-700/80 z-50 text-xs font-medium text-slate-700 dark:text-slate-200 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowMoreMenu(false)
                                        setIsSearchOpen(true)
                                    }}
                                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                                >
                                    <Search size={16} className="text-purple-600 dark:text-purple-400" />
                                    <span>Search messages</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowMoreMenu(false)
                                        setShowProfileModal(true)
                                    }}
                                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                                >
                                    <User size={16} className="text-purple-600 dark:text-purple-400" />
                                    <span>View profile</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowMoreMenu(false)
                                        handleToggleArchive(!isArchived)
                                    }}
                                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                                >
                                    {isArchived ? (
                                        <>
                                            <ArchiveRestore size={16} className="text-purple-600 dark:text-purple-400" />
                                            <span>Unarchive conversation</span>
                                        </>
                                    ) : (
                                        <>
                                            <Archive size={16} className="text-purple-600 dark:text-purple-400" />
                                            <span>Archive conversation</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowMoreMenu(false)
                                        handleToggleBlock(!iBlocked)
                                    }}
                                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700/60 text-red-600 dark:text-red-400 transition-colors"
                                >
                                    <Ban size={16} />
                                    <span>{iBlocked ? "Unblock user" : "Block user"}</span>
                                </button>

                                {onClose && (
                                    <>
                                        <div className="my-1 border-t border-slate-100 dark:border-slate-700/60" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowMoreMenu(false)
                                                onClose()
                                            }}
                                            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 transition-colors"
                                        >
                                            <X size={16} />
                                            <span>Close chat</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

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
                            placeholder="Search messages in chat..."
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

            {/* messages scroll stream */}
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

                {/* E2EE padlock banner at top of messages */}
                <div className="flex flex-col items-center justify-center p-3.5 sm:p-4 my-2 mb-4 rounded-2xl bg-white/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-center max-w-sm mx-auto shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                        <Lock size={13} className="text-purple-600 dark:text-purple-400" />
                        <span>End-to-end encrypted</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Messages are secured with end-to-end encryption. Only you and {user.name} can read these messages.
                    </p>
                </div>

                {(isFetching && messages.length === 0) ? (
                    <div className="flex-1 space-y-3 p-2 animate-in fade-in duration-300">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                                <div className={`h-11 ${i % 3 === 0 ? "w-44" : i % 2 === 0 ? "w-60" : "w-36"} rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse ${i % 2 === 0 ? "rounded-br-xs" : "rounded-bl-xs"}`} />
                            </div>
                        ))}
                    </div>
                ) : (isSuccess && messages.length === 0) ? (
                    <div className="flex h-64 flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 shadow-inner">
                            {isPending && isIRecipient ? <ShieldAlert size={32} /> : <MessageSquare size={32} />}
                        </div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center px-6">
                            {isPending && isIRecipient
                                ? "Accept this request to see messages and start chatting."
                                : iAmRejected
                                    ? "Your message request was not accepted."
                                    : "No messages yet — say hello 👋"}
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg: IMessage) => {
                            const isMine = msg.sender_id === authUser?.id
                            const decryptedContent = decryptMessage(msg)

                            if (decryptedContent === null) return null

                            // Check if decrypted content is a rich media payload
                            let richPayload: {
                                type: "file" | "audio" | "image" | "call_log"
                                url?: string
                                name?: string
                                size?: number
                                duration?: number
                                callId?: number
                                callType?: "audio" | "video"
                                status?: "completed" | "missed" | "declined" | "busy" | "cancelled"
                                startedAt?: string | Date
                            } | null = null
                            try {
                                if (
                                    decryptedContent.startsWith('{"type":"file"') ||
                                    decryptedContent.startsWith('{"type":"audio"') ||
                                    decryptedContent.startsWith('{"type":"image"') ||
                                    decryptedContent.startsWith('{"type":"call_log"')
                                ) {
                                    richPayload = JSON.parse(decryptedContent)
                                }
                            } catch {}

                            if (richPayload?.type === "call_log") {
                                const isCurrentSearchMatch = isSearchOpen && matchingMessageIds.length > 0 && matchingMessageIds[currentMatchIndex] === msg.id
                                const isSearchMatch = isSearchOpen && matchingMessageIds.includes(msg.id)
                                return (
                                    <div
                                        key={msg.id}
                                        id={`direct-msg-${msg.id}`}
                                        className={`transition-all rounded-2xl ${
                                            isCurrentSearchMatch
                                                ? "bg-purple-500/15 ring-2 ring-purple-500 dark:ring-purple-400 ring-offset-2 dark:ring-offset-[#0b1120] p-1"
                                                : isSearchMatch
                                                    ? "bg-purple-500/5 ring-1 ring-purple-400/40 p-1"
                                                    : ""
                                        }`}
                                    >
                                        <CallLogBubble
                                            payload={richPayload as any}
                                            isMine={isMine}
                                            createdAt={msg.created_at}
                                            onCallBack={handleStartCall}
                                        />
                                    </div>
                                )
                            }

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
                                    id={`direct-msg-${msg.id}`}
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
                                    {/* Left avatar for received messages matching mockup */}
                                    {!isMine && (
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-bold text-xs shadow-xs overflow-hidden self-end mb-1">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                                            ) : (
                                                user.name?.[0]?.toUpperCase() || <User size={14} />
                                            )}
                                        </div>
                                    )}

                                    <div className={`group relative flex flex-col ${isMine ? "items-end" : "items-start"} max-w-[85%] sm:max-w-md`}>
                                                
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

                                                    {/* Full Emoji Picker Popover for reactions */}
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

                                                {/* bubble */}
                                                <div className="relative inline-block">
                                                    {isImage ? (
                                                        <ImageBubble
                                                            url={richPayload!.url!}
                                                            name={richPayload?.name || "Photo"}
                                                            size={richPayload?.size}
                                                            isMine={isMine}
                                                            createdAt={msg.created_at}
                                                            isSeen={msg.is_seen}
                                                            isPending={msg.id < 0 || msg.is_pending}
                                                            isStarred={isStarred}
                                                        />
                                                    ) : isAudio ? (
                                                        <AudioPlayerBubble
                                                            url={richPayload!.url!}
                                                            duration={richPayload?.duration}
                                                            isMine={isMine}
                                                            createdAt={msg.created_at}
                                                            isSeen={msg.is_seen}
                                                            isPending={msg.id < 0 || msg.is_pending}
                                                            isStarred={isStarred}
                                                        />
                                                    ) : isDoc ? (
                                                        <DocumentCard
                                                            url={richPayload!.url!}
                                                            name={richPayload?.name || "Attachment"}
                                                            size={richPayload?.size}
                                                            isMine={isMine}
                                                            createdAt={msg.created_at}
                                                            isSeen={msg.is_seen}
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
                                                            
                                                            <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] tabular-nums ${
                                                                isMine ? "text-purple-200/90" : "text-slate-400 dark:text-slate-500"
                                                            }`}>
                                                                <span>
                                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                {isStarred && (
                                                                    <Star size={10} className="fill-amber-400 text-amber-400 inline shrink-0 ml-0.5" />
                                                                )}
                                                                {isMine && (
                                                                    <span className="ml-0.5">
                                                                        {msg.id < 0 || msg.is_pending ? (
                                                                            <span className="inline-block animate-pulse text-[9px]">●</span>
                                                                        ) : msg.is_seen ? (
                                                                            <CheckCheck size={13} className="inline text-purple-200" />
                                                                        ) : (
                                                                            <Check size={13} className="inline text-purple-200" />
                                                                        )}
                                                                    </span>
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
                                                            {msgAggReactions.map(({ emoji, count, hasReacted }) => (
                                                                <button
                                                                    key={emoji}
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleToggleReaction(msg.id, emoji)
                                                                    }}
                                                                    className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full transition-transform hover:scale-110 active:scale-95 ${
                                                                        hasReacted
                                                                            ? "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold"
                                                                            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                                                    }`}
                                                                    title={hasReacted ? `You reacted with ${emoji} (click to remove)` : `Reacted with ${emoji}`}
                                                                >
                                                                    <span className="text-sm leading-none">{emoji}</span>
                                                                    {count > 1 && <span className="text-[10px] font-semibold">{count}</span>}
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

                {/* typing indicator matching mockup (3 bouncing dots + name) */}
                {isTyping && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="px-3.5 py-2 rounded-2xl rounded-bl-xs bg-white dark:bg-[#162032] border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400 animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400 animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400 animate-bounce"></span>
                            </div>
                            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                {user.name} is typing...
                            </span>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* footer / input area matching mockup */}
            <div className="border-t border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md p-3 sm:p-4 pb-safe">
                {iBlocked ? (
                    <div className="max-w-2xl mx-auto my-1 p-5 sm:p-7 rounded-2xl sm:rounded-3xl text-center bg-[#fef2f2] dark:bg-[#1a1217] border border-[#fecdd3] dark:border-[#881337]/50 shadow-xs animate-in fade-in duration-200">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 shadow-xs">
                            <ShieldAlert size={24} className="stroke-[2.2]" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                            You have blocked this user
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                            You won't receive messages or calls from {user.name}.
                        </p>
                        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4 max-w-xs sm:max-w-md mx-auto">
                            <Button
                                onClick={() => handleToggleBlock(false)}
                                className="w-full sm:w-auto px-7 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all active:scale-95"
                            >
                                Unblock User
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowProfileModal(true)}
                                className="w-full sm:w-auto px-7 py-2.5 rounded-full text-xs sm:text-sm font-bold border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 bg-white/70 dark:bg-slate-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all active:scale-95"
                            >
                                View Profile
                            </Button>
                        </div>
                    </div>
                ) : iAmRejected ? (
                    <div className="flex flex-col items-center justify-center py-4 space-y-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-sm">
                            <X size={18} />
                            Message request rejected
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">You cannot send messages to this user.</p>
                    </div>
                ) : isPending && isIRecipient ? (
                    <div className="flex flex-col items-center justify-center py-5 space-y-4 bg-purple-50/80 dark:bg-purple-950/20 rounded-2xl border border-purple-200/80 dark:border-purple-900/40 max-w-xl mx-auto">
                        <div className="text-center space-y-1">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Message Request</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Accept to start chatting with {user.name}</p>
                        </div>
                        <div className="flex items-center gap-2 w-full max-w-xs px-2">
                            <Button
                                fullWidth
                                onClick={() => handleUpdateStatus('accepted')}
                                className="rounded-xl h-10 text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/25"
                            >
                                <Check size={16} className="mr-2" /> Accept
                            </Button>
                            <Button
                                variant="outline"
                                fullWidth
                                onClick={() => handleUpdateStatus('rejected')}
                                className="rounded-xl h-10 text-xs font-bold border-slate-200 dark:border-slate-700"
                            >
                                <UserMinus size={16} className="mr-2" /> Reject
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleBlock(true)}
                                className="h-10 w-10 shrink-0 rounded-xl text-slate-400 hover:text-red-500"
                                title="Block"
                            >
                                <Ban size={18} />
                            </Button>
                        </div>
                    </div>
                ) : isPending && isIRequester ? (
                    <div className="py-2 text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold mb-3">
                            <ShieldAlert size={14} className="text-purple-600" />
                            Waiting for acceptance
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                value={input}
                                onChange={(e) => handleTyping(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault()
                                        handleSend()
                                    }
                                }}
                                placeholder={`Message ${user.name}...`}
                                className="flex-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-full px-5 h-11 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <button
                                type="button"
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 transition-transform active:scale-95"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                ) : isRejected && isIRecipient ? (
                    <div className="flex flex-col items-center justify-center py-4 space-y-3 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">You rejected this request</p>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleUpdateStatus('accepted')}
                            className="rounded-xl px-6 h-9 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            Accept Now
                        </Button>
                    </div>
                ) : (
                    <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
                        {/* Input Emoji Picker Popover */}
                        {isRecordingAudio ? (
                            <AudioRecorderBar
                                onSendAudio={handleSendAudioNote}
                                onCancel={() => setIsRecordingAudio(false)}
                                isUploading={isUploadingMedia}
                            />
                        ) : (
                            <RichMessageInput
                                placeholder={`Message ${user.name}...`}
                                value={input}
                                onChange={handleTyping}
                                onSend={handleSend}
                                onSendPhoto={handleSendPhoto}
                                onSendPdf={handleSendPdf}
                                onStartVoiceRecording={() => setIsRecordingAudio(true)}
                                isUploading={isUploadingMedia}
                                uploadingFile={uploadingFile}
                                disabled={iBlocked || iAmRejected}
                                disabledReason={
                                    iBlocked
                                        ? "You have blocked this user"
                                        : iAmRejected
                                        ? "You cannot send messages to this user"
                                        : undefined
                                }
                            />
                        )}
                    </div>
                )}
            </div>

            {/* User Profile Modal */}
            <UserProfileModal
                open={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                user={user}
                isBlocked={!!iBlocked}
                isOnline={isOnline}
                onToggleBlock={handleToggleBlock}
            />
        </div>
    )
}

export default DirectChat