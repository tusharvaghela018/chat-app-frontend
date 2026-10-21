import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react"
import { useSelector } from "react-redux"
import { User, Send, ChevronLeft, MessageSquare, X, Lock, ShieldAlert, Ban, Check, UserMinus, Loader2 } from "lucide-react"
import { useGetApi, usePatchApi } from "@/hooks/api"
import axiosInstance from "@/api/axios"
import { useSocket } from "@/hooks/socket"
import { useChat } from "@/pages/chat/hooks"
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

import Input from "@/common/Input"

interface IMessage {
    id: number
    content: string
    sender_id: number
    receiver_id: number
    conversation_id: number
    created_at: string
    is_seen?: boolean
    is_pending?: boolean
}

interface Props {
    user: IUser
    onBack?: () => void
    onClose?: () => void
}

const DirectChat = ({ user, onBack, onClose }: Props) => {
    const authUser = useSelector(getUser)
    const socket = useSocket()
    const myKeys = getSessionKeys()
    const queryClient = useQueryClient()

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

    // If I am the requester and status is rejected, it means THEY rejected ME
    const iAmRejected = isIRequester && isRejected

    const { mutate: updateStatus } = usePatchApi(`/conversations/${conversation?.id}/status`)
    const { mutate: updateBlock } = usePatchApi(`/conversations/${conversation?.id}/block`)

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

    // ── send ──────────────────────────────────────────────────────────────
    const handleSend = () => {
        if (!input.trim() || iBlocked || iAmRejected) return

        const plainText = input.trim()
        setInput("")
        emitTypingStop(user.id)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

        let finalContent = plainText
        if (user.public_key && myKeys) {
            const encrypted = encryptDirectMessage(plainText, user.public_key, myKeys.secretKey)
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

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">

            {/* header */}
            <div className="flex h-16 flex-shrink-0 items-center justify-between border-b bg-card px-4 shadow-sm sm:px-6">
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
                    <div className="relative">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 font-display text-sm font-bold text-primary">
                            {user.avatar
                                ? <img src={user.avatar} className="h-full w-full rounded-xl object-cover" />
                                : <User size={18} />
                            }
                        </div>
                        {user.is_online && (
                            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-green-500" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-bold text-foreground">{user.name}</p>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-500/10 text-[9px] font-bold text-green-600 border border-green-500/20 uppercase tracking-tighter">
                                <Lock size={8} strokeWidth={3} /> Encrypted
                            </div>
                        </div>
                        <p className="text-[10px] font-medium uppercase tracking-wider">
                            {isTyping ? (
                                <span className="text-primary animate-pulse">typing...</span>
                            ) : (
                                <span className={user.is_online ? "text-green-500" : "text-muted-foreground"}>
                                    {user.is_online ? "Online" : "Offline"}
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleBlock(!iBlocked)}
                        className={`transition-colors rounded-full ${iBlocked ? "text-red-500 bg-red-50" : "text-muted-foreground"}`}
                        title={iBlocked ? "Unblock user" : "Block user"}
                    >
                        <Ban size={20} />
                    </Button>
                    {onClose && (
                        <div className="border-l ml-1 pl-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="text-muted-foreground hover:text-destructive transition-colors rounded-full"
                            >
                                <X size={20} />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* messages */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-background/50"
            >
                <div ref={topRef} className="h-1" />
                {isLoadingMore && (
                    <div className="flex justify-center py-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                )}
                {(isFetching && messages.length === 0) ? (
                    <div className="flex-1 space-y-3 p-2 animate-in fade-in duration-300">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                                <div className={`h-11 ${i % 3 === 0 ? "w-44" : i % 2 === 0 ? "w-60" : "w-36"} rounded-2xl bg-muted/40 animate-pulse ${i % 2 === 0 ? "rounded-br-none" : "rounded-bl-none"}`} />
                            </div>
                        ))}
                    </div>
                ) : (isSuccess && messages.length === 0) ? (
                    <div className="flex h-full flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            {isPending && isIRecipient ? <ShieldAlert size={32} /> : <MessageSquare size={32} />}
                        </div>
                        <p className="text-sm font-medium text-muted-foreground text-center px-6">
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

                            const shouldAnimate = isInitialScrollDone.current && (msg.is_pending || msg.id < 0)

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isMine ? "justify-end" : "justify-start"} ${shouldAnimate ? "animate-in slide-in-from-bottom-2 duration-200" : ""}`}
                                >
                                    <div className={`group relative px-4 py-2.5 text-sm max-w-[85%] sm:max-w-md break-words shadow-sm
                                        ${isMine
                                            ? "bg-primary text-primary-foreground rounded-2xl rounded-br-none"
                                            : "bg-card text-foreground rounded-2xl rounded-bl-none border border-border"
                                        }`}
                                    >
                                        {decryptedContent}
                                        <div className={`flex items-center justify-end gap-1 mt-1 
                                            ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                                        >
                                            <span className="text-[10px] tabular-nums">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isMine && (
                                                <span className="text-[10px] ml-0.5">
                                                    {msg.id < 0 || msg.is_pending ? (
                                                        <span className="inline-block animate-pulse text-[9px] opacity-70">●</span>
                                                    ) : msg.is_seen ? (
                                                        "✓✓"
                                                    ) : (
                                                        "✓"
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </>
                )}

                <div ref={bottomRef} />
            </div>

            {/* footer / input area */}
            <div className="border-t bg-card p-4 pb-safe sm:px-6">
                {iBlocked ? (
                    <div className="flex flex-col items-center justify-center py-4 space-y-3 bg-red-50/50 rounded-2xl border border-red-100">
                        <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                            <Ban size={18} />
                            You have blocked this user
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleBlock(false)}
                            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                        >
                            Unblock {user.name}
                        </Button>
                    </div>
                ) : iAmRejected ? (
                    <div className="flex flex-col items-center justify-center py-4 space-y-1 bg-muted/50 rounded-2xl border border-border">
                        <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm">
                            <X size={18} />
                            Message request rejected
                        </div>
                        <p className="text-[10px] text-muted-foreground">You cannot send messages to this user.</p>
                    </div>
                ) : isPending && isIRecipient ? (
                    <div className="flex flex-col items-center justify-center py-6 space-y-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <div className="text-center space-y-1">
                            <h3 className="font-bold text-sm">Message Request</h3>
                            <p className="text-xs text-muted-foreground">Accept to start chatting with {user.name}</p>
                        </div>
                        <div className="flex items-center gap-2 w-full max-w-xs">
                            <Button
                                fullWidth
                                onClick={() => handleUpdateStatus('accepted')}
                                className="rounded-xl h-10 text-xs font-bold"
                            >
                                <Check size={16} className="mr-2" /> Accept
                            </Button>
                            <Button
                                variant="outline"
                                fullWidth
                                onClick={() => handleUpdateStatus('rejected')}
                                className="rounded-xl h-10 text-xs font-bold"
                            >
                                <UserMinus size={16} className="mr-2" /> Reject
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleBlock(true)}
                                className="h-10 w-10 shrink-0 rounded-xl text-muted-foreground hover:text-red-500"
                                title="Block"
                            >
                                <Ban size={18} />
                            </Button>
                        </div>
                    </div>
                ) : isPending && isIRequester ? (
                    <div className="py-4 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                            <ShieldAlert size={14} />
                            Waiting for acceptance
                        </div>
                        <div className="mt-4 flex items-center gap-2 max-w-4xl mx-auto">
                            <Input
                                value={input}
                                onChange={(e) => handleTyping(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault()
                                        handleSend()
                                    }
                                }}
                                placeholder={`Message ${user.name}...`}
                                containerClassName="flex-1"
                                inputClassName="rounded-2xl h-11"
                            />
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="h-11 w-11 shrink-0 rounded-2xl shadow-lg shadow-primary/20"
                            >
                                <Send size={18} />
                            </Button>
                        </div>
                    </div>
                ) : isRejected && isIRecipient ? (
                    <div className="flex flex-col items-center justify-center py-4 space-y-3 bg-muted/50 rounded-2xl border border-border">
                        <p className="text-xs text-muted-foreground font-medium">You rejected this request</p>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleUpdateStatus('accepted')}
                            className="rounded-xl px-6 h-9 text-xs font-bold"
                        >
                            Accept Now
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 max-w-4xl mx-auto">
                        <Input
                            value={input}
                            onChange={(e) => handleTyping(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend()
                                }
                            }}
                            placeholder={`Message ${user.name}...`}
                            containerClassName="flex-1"
                            inputClassName="rounded-2xl h-11"
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
        </div>
    )
}

export default DirectChat