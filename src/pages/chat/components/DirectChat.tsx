import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react"
import { useSelector } from "react-redux"
import { 
    User, Send, ChevronLeft, MessageSquare, X, Lock, ShieldAlert, 
    Ban, Check, UserMinus, Loader2, Video, Phone, Search, 
    Smile, Mic, Plus, CheckCheck, Copy, Archive, ArchiveRestore, Star 
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

    const isOnline = isUserOnline(user.id, user.is_online)
    const lastSeen = getUserLastSeen(user.id, user.last_seen)

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
    const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false)

    // Media and voice note state
    const [isRecordingAudio, setIsRecordingAudio] = useState(false)
    const [isUploadingMedia, setIsUploadingMedia] = useState(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
        const handleDocumentClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (!target.closest('.emoji-picker-container') && !target.closest('.epr-main')) {
                setMoreEmojiMsgId(null)
            }
            if (!target.closest('.input-emoji-picker-container') && !target.closest('.input-emoji-btn') && !target.closest('.epr-main')) {
                setShowInputEmojiPicker(false)
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
    const isArchived = isIRequester ? (conversation as any)?.archived_by_sender : (conversation as any)?.archived_by_receiver

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

    // ── send file attachment ───────────────────────────────────────────────
    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || iBlocked || iAmRejected) return
        e.target.value = ""

        setIsUploadingMedia(true)
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
        } catch (err) {
            console.error("File upload failed:", err)
        } finally {
            setIsUploadingMedia(false)
        }
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/70 dark:bg-[#0b1120]">

            {/* top header matching mockup */}
            <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md px-4 sm:px-6 shadow-xs z-10">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onBack}
                            className="mr-1 lg:hidden rounded-full text-slate-600 dark:text-slate-300"
                        >
                            <ChevronLeft size={22} />
                        </Button>
                    )}
                    <div className="relative">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 font-display text-sm font-bold text-white shadow-xs overflow-hidden">
                            {user.avatar
                                ? <img src={user.avatar} className="h-full w-full object-cover" />
                                : <User size={18} />
                            }
                        </div>
                        {isOnline && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-[#111827] bg-emerald-500 shadow-2xs" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{user.name}</p>
                            <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-tight">
                                <Lock size={8} strokeWidth={3} /> E2EE
                            </div>
                        </div>
                        <p className="text-xs font-medium">
                            {isTyping ? (
                                <span className="text-purple-600 dark:text-purple-400 font-semibold animate-pulse">typing...</span>
                            ) : isOnline ? (
                                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Online
                                </span>
                            ) : (
                                <span className="text-slate-400 dark:text-slate-500">
                                    {formatLastActive(lastSeen)}
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* header action icons matching mockup */}
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Start video call"
                    >
                        <Video size={18} />
                    </button>
                    <button
                        type="button"
                        className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Start voice call"
                    >
                        <Phone size={18} />
                    </button>
                    <button
                        type="button"
                        className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Search messages"
                    >
                        <Search size={18} />
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => handleToggleBlock(!iBlocked)}
                        className={`p-2 rounded-full transition-colors ${
                            iBlocked 
                                ? "text-red-500 bg-red-50 dark:bg-red-950/40" 
                                : "text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                        title={iBlocked ? "Unblock user" : "Block user"}
                    >
                        <Ban size={18} />
                    </button>

                    <button
                        type="button"
                        onClick={() => handleToggleArchive(!isArchived)}
                        className={`p-2 rounded-full transition-colors ${
                            isArchived 
                                ? "text-purple-600 bg-purple-50 dark:bg-purple-950/40" 
                                : "text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                        title={isArchived ? "Unarchive conversation" : "Archive conversation"}
                    >
                        {isArchived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
                    </button>

                    {onClose && (
                        <div className="border-l border-slate-200 dark:border-slate-800 ml-1 pl-1">
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Close chat"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

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
                                type: "file" | "audio"
                                url: string
                                name?: string
                                size?: number
                                duration?: number
                            } | null = null
                            try {
                                if (
                                    decryptedContent.startsWith('{"type":"file"') ||
                                    decryptedContent.startsWith('{"type":"audio"')
                                ) {
                                    richPayload = JSON.parse(decryptedContent)
                                }
                            } catch {}

                            const shouldAnimate = isInitialScrollDone.current && (msg.is_pending || msg.id < 0)
                            const msgAggReactions = getAggregatedReactions(msg.reactions, authUser?.id || 0)
                            const isHovered = hoveredMsgId === msg.id || moreEmojiMsgId === msg.id
                            const isStarred = msg.starred?.some(s => Number(s.user_id) === Number(authUser?.id)) ?? false

                            return (
                                <div
                                    key={msg.id}
                                    onMouseEnter={() => setHoveredMsgId(msg.id)}
                                    onMouseLeave={() => {
                                        if (moreEmojiMsgId !== msg.id) {
                                            setHoveredMsgId(null)
                                        }
                                    }}
                                    className={`flex ${isMine ? "justify-end" : "justify-start"} items-end gap-2.5 ${
                                        msgAggReactions.length > 0 ? "mb-3.5" : ""
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

                                                {/* bubble & docked attached reaction badge */}
                                                <div className="relative inline-block">
                                                    {richPayload?.type === "file" ? (
                                                        <DocumentCard
                                                            url={richPayload.url}
                                                            name={richPayload.name || "Attachment"}
                                                            size={richPayload.size}
                                                            isMine={isMine}
                                                            createdAt={msg.created_at}
                                                            isSeen={msg.is_seen}
                                                            isPending={msg.id < 0 || msg.is_pending}
                                                            isStarred={isStarred}
                                                        />
                                                    ) : richPayload?.type === "audio" ? (
                                                        <AudioPlayerBubble
                                                            url={richPayload.url}
                                                            duration={richPayload.duration}
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
                                                            <p className="whitespace-pre-wrap leading-relaxed">{decryptedContent}</p>
                                                            
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

                                                    {/* Attached reaction pill docked to bottom edge of bubble */}
                                                    {msgAggReactions.length > 0 && (
                                                        <div className={`absolute -bottom-2.5 z-10 flex items-center gap-1 ${
                                                            isMine ? "right-2" : "left-2"
                                                        }`}>
                                                            <div className="flex items-center gap-1 bg-white/95 dark:bg-[#1e293b]/95 border border-slate-200/90 dark:border-slate-700/80 rounded-full px-1.5 py-0.5 shadow-xs backdrop-blur-md">
                                                                {msgAggReactions.map(({ emoji, count, hasReacted }) => (
                                                                    <button
                                                                        key={emoji}
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            handleToggleReaction(msg.id, emoji)
                                                                        }}
                                                                        className={`flex items-center gap-1 text-[11px] px-1 py-0.5 rounded-full transition-transform hover:scale-110 active:scale-95 ${
                                                                            hasReacted
                                                                                ? "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold"
                                                                                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                                                        }`}
                                                                        title={hasReacted ? `You reacted with ${emoji} (click to remove)` : `Reacted with ${emoji}`}
                                                                    >
                                                                        <span>{emoji}</span>
                                                                        {count > 1 && <span className="text-[9px] font-semibold">{count}</span>}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
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
                    <div className="flex flex-col items-center justify-center py-4 space-y-3 bg-red-50/70 dark:bg-red-950/30 rounded-2xl border border-red-200/80 dark:border-red-900/50">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
                            <Ban size={18} />
                            You have blocked this user
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleBlock(false)}
                            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                        >
                            Unblock {user.name}
                        </Button>
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
                        {showInputEmojiPicker && (
                            <div className="absolute bottom-full mb-3 right-0 sm:right-14 z-50 shadow-2xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 input-emoji-picker-container animate-in fade-in zoom-in-95 duration-150">
                                <EmojiPicker
                                    theme={document.documentElement.classList.contains("dark") ? Theme.DARK : Theme.LIGHT}
                                    onEmojiClick={(emojiData: EmojiClickData) => {
                                        handleTyping(input + emojiData.emoji)
                                    }}
                                    lazyLoadEmojis={true}
                                    searchPlaceHolder="Search emoji..."
                                    width={320}
                                    height={400}
                                />
                            </div>
                        )}

                        {/* Hidden file input for documents/attachments */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileSelected}
                            className="hidden"
                        />

                        {isRecordingAudio ? (
                            <AudioRecorderBar
                                onSendAudio={handleSendAudioNote}
                                onCancel={() => setIsRecordingAudio(false)}
                                isUploading={isUploadingMedia}
                            />
                        ) : (
                            <>
                                {/* + attachment button matching mockup */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploadingMedia}
                                    className="h-11 w-11 shrink-0 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                                    title="Add document or attachment"
                                >
                                    {isUploadingMedia ? (
                                        <Loader2 size={18} className="animate-spin text-purple-600" />
                                    ) : (
                                        <Plus size={20} />
                                    )}
                                </button>

                                {/* input pill matching mockup */}
                                <div className="flex-1 flex items-center bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/60 rounded-full px-4 h-11 focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:border-purple-500 transition-all">
                                    <input
                                        value={input}
                                        onChange={(e) => handleTyping(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault()
                                                setShowInputEmojiPicker(false)
                                                handleSend()
                                            }
                                        }}
                                        placeholder={`Message ${user.name}...`}
                                        className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                                    />
                                    
                                    {/* smile emoji button */}
                                    <button
                                        type="button"
                                        onClick={() => setShowInputEmojiPicker(prev => !prev)}
                                        className={`p-1.5 input-emoji-btn transition-colors cursor-pointer ${
                                            showInputEmojiPicker 
                                                ? "text-purple-600 dark:text-purple-400" 
                                                : "text-slate-400 hover:text-purple-600 dark:hover:text-purple-400"
                                        }`}
                                        title="Add emoji"
                                    >
                                        <Smile size={20} />
                                    </button>

                                    {/* microphone button */}
                                    <button
                                        type="button"
                                        onClick={() => setIsRecordingAudio(true)}
                                        disabled={isUploadingMedia}
                                        className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer disabled:opacity-40"
                                        title="Record voice message"
                                    >
                                        <Mic size={20} />
                                    </button>
                                </div>

                                {/* circular purple send button matching mockup */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowInputEmojiPicker(false)
                                        handleSend()
                                    }}
                                    disabled={!input.trim()}
                                    className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 transition-transform active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                                    title="Send message"
                                >
                                    <Send size={18} />
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default DirectChat