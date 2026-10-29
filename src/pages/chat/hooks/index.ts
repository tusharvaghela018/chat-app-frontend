import { useEffect, useRef, useState, useCallback } from "react"
import { Socket } from "socket.io-client"
import { useQueryClient } from "@tanstack/react-query"
import { CHAT_EVENTS } from "@/pages/chat/constants"
import { GROUP_EVENTS } from "@/pages/chat/constants"
import type { EncryptedMessage } from "@/utils/crypto"


export interface IMessageReaction {
    id: number
    message_id: number
    user_id: number
    emoji: string
}

export interface IGroupMessageReaction {
    id: number
    group_message_id: number
    user_id: number
    emoji: string
}

export interface IStarredItem {
    id?: number
    user_id: number
    message_id?: number | null
    group_message_id?: number | null
}

export interface IReplyPreview {
    id: number
    content: string
    sender_id: number
    created_at?: string
    sender?: {
        id: number
        name: string
    }
}

export interface IMessage {
    id: number
    content: string
    sender_id: number
    receiver_id: number
    conversation_id: number
    reply_to_id?: number | null
    reply_to?: IReplyPreview | null
    created_at: string
    is_seen?: boolean
    is_pending?: boolean
    status?: "pending" | "sent" | "failed"
    reactions?: IMessageReaction[]
    starred?: IStarredItem[]
}

interface UseChatProps {
    socket: Socket | null
    selectedUserId: number | null
    currentUserId: number | null
    initialMessages?: IMessage[]
    onStatusUpdated?: (data: { conversationId: number; status: string; senderId: number; receiverId: number }) => void
}

interface UseChatReturn {
    messages: IMessage[]
    setMessages: React.Dispatch<React.SetStateAction<IMessage[]>>
    isTyping: boolean
    activeConvRef: React.MutableRefObject<number | null>
    sendMessage: (receiverId: number, content: string, optimisticMsg?: IMessage) => void
    retryMessage: (msg: IMessage) => void
    emitMarkSeen: (conversationId: number, senderId: number) => void
    emitTypingStart: (receiverId: number) => void
    emitTypingStop: (receiverId: number) => void
    emitToggleReaction: (messageId: number, emoji: string, receiverId: number) => void
    emitToggleStar?: (messageId: number) => void
}

// Helper to update TanStack Query messages cache so messages never disappear on re-opening
function updateQueryMessagesCache<T extends { id: number }>(
    queryClient: any,
    queryKey: string,
    updater: (messages: T[]) => T[]
) {
    queryClient.setQueryData([queryKey], (old: any) => {
        if (!old) return old
        const currentMsgs = Array.isArray(old.data)
            ? old.data
            : (old.data?.messages || (Array.isArray(old) ? old : []))
        const updated = updater(currentMsgs)
        if (Array.isArray(old.data)) {
            return { ...old, data: updated }
        } else if (old.data?.messages) {
            return { ...old, data: { ...old.data, messages: updated } }
        }
        return old
    })
}

export const useChat = ({
    socket,
    selectedUserId,
    currentUserId,
    initialMessages,
    onStatusUpdated,
}: UseChatProps): UseChatReturn => {
    const queryClient = useQueryClient()
    const [messages, setMessages] = useState<IMessage[]>(initialMessages ?? [])
    const [isTyping, setIsTyping] = useState(false)

    const activeConvRef = useRef<number | null>(null)
    const selectedUserRef = useRef<number | null>(null)
    const currentUserIdRef = useRef(currentUserId)

    useEffect(() => {
        currentUserIdRef.current = currentUserId
    }, [currentUserId])

    // keep ref in sync — used inside socket closures to avoid stale state
    useEffect(() => {
        selectedUserRef.current = selectedUserId
        activeConvRef.current = null // Reset conversation ID when switching users
        setIsTyping(false)  // reset typing when switching users
        setMessages([])
    }, [selectedUserId])

    useEffect(() => {
        if (!socket) return

        // ── receive_message ───────────────────────────────────────────────
        const onReceiveMessage = (msg: IMessage) => {
            const currentUid = currentUserIdRef.current
            const selectedUid = selectedUserRef.current

            // Check if this message belongs to the active 1-on-1 chat
            const isRelevantForOpenChat =
                (Number(msg.sender_id) === Number(selectedUid) && Number(msg.receiver_id) === Number(currentUid)) ||
                (Number(msg.sender_id) === Number(currentUid) && Number(msg.receiver_id) === Number(selectedUid))

            // If activeConvRef is null or 0, update it for new conversations
            if ((activeConvRef.current === null || activeConvRef.current === 0) && isRelevantForOpenChat) {
                activeConvRef.current = msg.conversation_id
                queryClient.invalidateQueries({ queryKey: [`conversation-${selectedUid}`] })
                queryClient.invalidateQueries({ queryKey: ['conversations'] })
            }

            // If it is definitely for this open chat (by participant IDs or conversation ID)
            const isForThisConversation =
                msg.conversation_id === activeConvRef.current || isRelevantForOpenChat

            // wrong conversation is open — ignore completely, do NOT mark seen
            if (!isForThisConversation) return

            // Ensure activeConvRef has the conversation ID
            if (!activeConvRef.current && msg.conversation_id) {
                activeConvRef.current = msg.conversation_id
            }

            setMessages((prev) => {
                // If it's our own message emitted back by server, reconcile pending optimistic message
                if (Number(msg.sender_id) === Number(currentUid)) {
                    const pendingIndex = prev.findIndex(
                        (m) => m.id < 0 && (m.content === msg.content || Number(m.receiver_id) === Number(msg.receiver_id))
                    )
                    if (pendingIndex !== -1) {
                        const next = [...prev]
                        next[pendingIndex] = msg
                        return next
                    }
                    if (prev.some((m) => m.id === msg.id)) return prev
                } else {
                    if (prev.some((m) => m.id === msg.id)) return prev
                }
                return [...prev, msg]
            })

            // Update TanStack Query cache so reopening the chat retains this message
            if (selectedUid) {
                updateQueryMessagesCache<IMessage>(queryClient, `messages-${selectedUid}`, (msgs) => {
                    const idx = msgs.findIndex((m) => m.id === msg.id || (m.id < 0 && m.content === msg.content))
                    if (idx !== -1) {
                        const next = [...msgs]
                        next[idx] = msg
                        return next
                    }
                    return [...msgs, msg]
                })
            }

            // ✅ only mark seen if the sender is the person currently open
            if (Number(msg.sender_id) === Number(selectedUid)) {
                socket.emit(CHAT_EVENTS.MARK_SEEN, {
                    conversationId: msg.conversation_id,
                    senderId: msg.sender_id,
                })
            }
        }

        // ── messages_seen ─────────────────────────────────────────────────
        const onMessagesSeen = ({ conversationId, messageIds }: { conversationId: number; messageIds?: number[] }) => {
            setMessages((prev) =>
                prev.map((m) => {
                    if (m.conversation_id !== conversationId) return m;

                    // If server provided specific IDs, only update those
                    if (messageIds && !messageIds.includes(m.id)) return m;

                    return { ...m, is_seen: true };
                })
            )

            const selectedUid = selectedUserRef.current
            if (selectedUid) {
                updateQueryMessagesCache<IMessage>(queryClient, `messages-${selectedUid}`, (msgs) => {
                    return msgs.map((m) => {
                        if (m.conversation_id !== conversationId) return m
                        if (messageIds && !messageIds.includes(m.id)) return m
                        return { ...m, is_seen: true }
                    })
                })
            }
        }

        // ── typing ────────────────────────────────────────────────────────
        // only show indicator if the typer is the currently selected user
        const onTyping = (data: { senderId: number; isTyping: boolean }) => {
            if (data.senderId !== selectedUserRef.current) return
            setIsTyping(data.isTyping)
        }

        // ── conversation status updated ───────────────────────────────────
        const onConversationStatusUpdated = (data: { conversationId: number; status: string; senderId: number; receiverId: number }) => {
            onStatusUpdated?.(data)
        }

        // ── reactions ─────────────────────────────────────────────────────
        const onReactionUpdated = ({ messageId, reactions }: { messageId: number; reactions: IMessageReaction[] }) => {
            setMessages((prev) =>
                prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
            )

            const selectedUid = selectedUserRef.current
            if (selectedUid) {
                updateQueryMessagesCache<IMessage>(queryClient, `messages-${selectedUid}`, (msgs) => {
                    return msgs.map((m) => (m.id === messageId ? { ...m, reactions } : m))
                })
            }
        }

        // ── star updated ──────────────────────────────────────────────────
        const onStarUpdated = ({ messageId, isStarred }: { messageId: number; isStarred: boolean }) => {
            const uid = currentUserIdRef.current
            setMessages((prev) =>
                prev.map((m) => {
                    if (Number(m.id) !== Number(messageId)) return m
                    const current = m.starred || []
                    const filtered = current.filter((s) => Number(s.user_id) !== Number(uid))
                    const nextStarred = isStarred
                        ? [...filtered, { user_id: Number(uid) || 0, message_id: Number(messageId) }]
                        : filtered
                    return { ...m, starred: nextStarred }
                })
            )

            const selectedUid = selectedUserRef.current
            if (selectedUid) {
                updateQueryMessagesCache<IMessage>(queryClient, `messages-${selectedUid}`, (msgs) => {
                    return msgs.map((m) => {
                        if (Number(m.id) !== Number(messageId)) return m
                        const current = m.starred || []
                        const filtered = current.filter((s) => Number(s.user_id) !== Number(uid))
                        const nextStarred = isStarred
                            ? [...filtered, { user_id: Number(uid) || 0, message_id: Number(messageId) }]
                            : filtered
                        return { ...m, starred: nextStarred }
                    })
                })
            }

            queryClient.invalidateQueries({ queryKey: ["starred-messages"] })
            queryClient.invalidateQueries({ queryKey: ["starred-messages-ids"] })
        }

        socket.on(CHAT_EVENTS.RECEIVE_MESSAGE, onReceiveMessage)
        socket.on(CHAT_EVENTS.MESSAGES_SEEN, onMessagesSeen)
        socket.on(CHAT_EVENTS.TYPING, onTyping)
        socket.on(CHAT_EVENTS.CONVERSATION_STATUS_UPDATED, onConversationStatusUpdated)
        socket.on(CHAT_EVENTS.REACTION_UPDATED, onReactionUpdated)
        socket.on(CHAT_EVENTS.STAR_UPDATED, onStarUpdated)

        return () => {
            socket.off(CHAT_EVENTS.RECEIVE_MESSAGE, onReceiveMessage)
            socket.off(CHAT_EVENTS.MESSAGES_SEEN, onMessagesSeen)
            socket.off(CHAT_EVENTS.TYPING, onTyping)
            socket.off(CHAT_EVENTS.CONVERSATION_STATUS_UPDATED, onConversationStatusUpdated)
            socket.off(CHAT_EVENTS.REACTION_UPDATED, onReactionUpdated)
            socket.off(CHAT_EVENTS.STAR_UPDATED, onStarUpdated)
        }
    }, [socket, currentUserId, onStatusUpdated, queryClient])

    // ── emit helpers with Fast ACK & Auto-Retry ───────────────────────────

    const emitSend = useCallback((targetMsg: IMessage) => {
        if (!socket) return
        socket.timeout(10000).emit(
            CHAT_EVENTS.SEND_MESSAGE,
            { receiverId: targetMsg.receiver_id, content: targetMsg.content, reply_to_id: targetMsg.reply_to_id },
            (err: any, res: any) => {
                if (err || (res && !res.success)) {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === targetMsg.id ? { ...m, is_pending: false, status: "failed" } : m
                        )
                    )
                } else if (res?.success && res?.message) {
                    const serverMsg = res.message
                    setMessages((prev) => {
                        const idx = prev.findIndex((m) => m.id === targetMsg.id)
                        if (idx !== -1) {
                            const next = [...prev]
                            next[idx] = { ...serverMsg, is_pending: false, status: "sent" }
                            return next
                        }
                        return prev
                    })

                    const selectedUid = selectedUserRef.current
                    if (selectedUid) {
                        updateQueryMessagesCache<IMessage>(queryClient, `messages-${selectedUid}`, (msgs) => {
                            if (msgs.some((m) => m.id === serverMsg.id)) return msgs
                            return [...msgs, serverMsg]
                        })
                    }
                }
            }
        )
    }, [socket, queryClient])

    const sendMessage = (receiverId: number, content: string, optimisticMsg?: IMessage) => {
        const tempMsg: IMessage = optimisticMsg || {
            id: -Date.now(),
            content,
            sender_id: currentUserIdRef.current ?? 0,
            receiver_id: receiverId,
            conversation_id: activeConvRef.current || 0,
            created_at: new Date().toISOString(),
            is_pending: true,
            status: "pending",
        }
        setMessages((prev) => {
            if (prev.some((m) => m.id === tempMsg.id)) return prev
            return [...prev, { ...tempMsg, is_pending: true, status: "pending" }]
        })
        emitSend(tempMsg)
    }

    const retryMessage = (msg: IMessage) => {
        setMessages((prev) =>
            prev.map((m) => (m.id === msg.id ? { ...m, is_pending: true, status: "pending" } : m))
        )
        emitSend(msg)
    }

    // Auto-flush pending messages when socket reconnects
    useEffect(() => {
        if (!socket) return

        const onConnect = () => {
            setMessages((prev) => {
                const pendingMsgs = prev.filter((m) => m.id < 0 && m.status !== "failed")
                pendingMsgs.forEach((msg) => emitSend(msg))
                return prev
            })
        }

        socket.on("connect", onConnect)
        return () => {
            socket.off("connect", onConnect)
        }
    }, [socket, emitSend])

    const emitMarkSeen = (conversationId: number, senderId: number) => {
        socket?.emit(CHAT_EVENTS.MARK_SEEN, { conversationId, senderId })
    }

    const emitTypingStart = (receiverId: number) => {
        socket?.emit(CHAT_EVENTS.TYPING_START, { receiverId })
    }

    const emitTypingStop = (receiverId: number) => {
        socket?.emit(CHAT_EVENTS.TYPING_STOP, { receiverId })
    }

    const emitToggleReaction = (messageId: number, emoji: string, receiverId: number) => {
        socket?.emit(CHAT_EVENTS.TOGGLE_REACTION, { messageId, emoji, receiverId })
    }

    const emitToggleStar = (messageId: number) => {
        socket?.emit(CHAT_EVENTS.TOGGLE_STAR, { messageId })
    }

    return {
        messages,
        setMessages,
        isTyping,
        activeConvRef,
        sendMessage,
        retryMessage,
        emitMarkSeen,
        emitTypingStart,
        emitTypingStop,
        emitToggleReaction,
        emitToggleStar,
    }
}

export interface IGroupMessage {
    id: number
    group_id: number
    sender_id: number | null
    content: string
    type: "text" | "system"
    reply_to_id?: number | null
    reply_to?: IReplyPreview | null
    encrypted_keys?: Record<number, EncryptedMessage>
    created_at: string
    is_pending?: boolean
    status?: "pending" | "sent" | "failed"
    sender?: {
        id: number
        name: string
        avatar: string | null
    }
    reactions?: IGroupMessageReaction[]
    starred?: IStarredItem[]
}

interface TypingUser {
    senderId: number
    senderName: string
}

interface UseGroupChatProps {
    socket: Socket | null
    groupId: number
    currentUserId?: number
    initialMessages?: IGroupMessage[]
    onMemberJoined?: () => void
    onMemberLeft?: () => void
}

export const useGroupChat = ({ socket, groupId, currentUserId, initialMessages, onMemberJoined, onMemberLeft }: UseGroupChatProps) => {
    const queryClient = useQueryClient()
    const [messages, setMessages] = useState<IGroupMessage[]>(initialMessages ?? [])
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
    const typingTimeoutRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({})
    const currentUserIdRef = useRef(currentUserId)

    useEffect(() => {
        currentUserIdRef.current = currentUserId
    }, [currentUserId])

    // ── listen for incoming messages ──────────────────────────────────────
    useEffect(() => {
        if (!socket) return

        const handleReceiveMessage = (message: IGroupMessage) => {
            if (message.group_id !== groupId) return
            setMessages((prev) => {
                const pendingIndex = prev.findIndex(
                    (m) => m.id < 0 && (m.content === message.content || m.sender_id === message.sender_id)
                )
                if (pendingIndex !== -1) {
                    const next = [...prev]
                    next[pendingIndex] = message
                    return next
                }
                if (prev.some((m) => m.id === message.id)) return prev
                return [...prev, message]
            })

            // Update TanStack Query cache for group messages
            updateQueryMessagesCache<IGroupMessage>(queryClient, `group-messages-${groupId}`, (msgs) => {
                const idx = msgs.findIndex((m) => m.id === message.id || (m.id < 0 && m.content === message.content))
                if (idx !== -1) {
                    const next = [...msgs]
                    next[idx] = message
                    return next
                }
                return [...msgs, message]
            })
        }

        const handleTyping = ({
            senderId,
            senderName,
            isTyping,
        }: {
            senderId: number
            senderName: string
            isTyping: boolean
            groupId: number
        }) => {
            if (isTyping) {
                setTypingUsers((prev) => {
                    if (prev.find((u) => u.senderId === senderId)) return prev
                    return [...prev, { senderId, senderName }]
                })

                // auto clear after 3s incase TYPING_STOP is missed
                if (typingTimeoutRef.current[senderId]) {
                    clearTimeout(typingTimeoutRef.current[senderId])
                }
                typingTimeoutRef.current[senderId] = setTimeout(() => {
                    setTypingUsers((prev) => prev.filter((u) => u.senderId !== senderId))
                }, 3000)
            } else {
                if (typingTimeoutRef.current[senderId]) {
                    clearTimeout(typingTimeoutRef.current[senderId])
                }
                setTypingUsers((prev) => prev.filter((u) => u.senderId !== senderId))
            }
        }

        // ← add these two
        const handleMemberJoined = ({ groupId: joinedGroupId }: { groupId: number }) => {
            console.log("MEMBER_JOINED received", joinedGroupId, groupId)
            if (joinedGroupId !== groupId) return
            onMemberJoined?.()
        }

        const handleMemberLeft = ({ groupId: leftGroupId }: { groupId: number; userId: number }) => {
            if (leftGroupId !== groupId) return
            onMemberLeft?.()
        }

        // ── reactions ─────────────────────────────────────────────────────
        const handleReactionUpdated = ({
            groupMessageId,
            groupId: gid,
            reactions,
        }: {
            groupMessageId: number
            groupId: number
            reactions: IGroupMessageReaction[]
        }) => {
            if (gid !== groupId) return
            setMessages((prev) =>
                prev.map((m) => (m.id === groupMessageId ? { ...m, reactions } : m))
            )

            updateQueryMessagesCache<IGroupMessage>(queryClient, `group-messages-${groupId}`, (msgs) => {
                return msgs.map((m) => (m.id === groupMessageId ? { ...m, reactions } : m))
            })
        }

        // ── star updated ──────────────────────────────────────────────────
        const handleStarUpdated = ({
            groupMessageId,
            groupId: gid,
            isStarred,
        }: {
            groupMessageId: number
            groupId?: number
            isStarred: boolean
        }) => {
            if (gid && gid !== groupId) return
            const uid = currentUserIdRef.current
            setMessages((prev) =>
                prev.map((m) => {
                    if (Number(m.id) !== Number(groupMessageId)) return m
                    const current = m.starred || []
                    const filtered = current.filter((s) => Number(s.user_id) !== Number(uid))
                    const nextStarred = isStarred
                        ? [...filtered, { user_id: Number(uid) || 0, group_message_id: Number(groupMessageId) }]
                        : filtered
                    return { ...m, starred: nextStarred }
                })
            )

            updateQueryMessagesCache<IGroupMessage>(queryClient, `group-messages-${groupId}`, (msgs) => {
                return msgs.map((m) => {
                    if (Number(m.id) !== Number(groupMessageId)) return m
                    const current = m.starred || []
                    const filtered = current.filter((s) => Number(s.user_id) !== Number(uid))
                    const nextStarred = isStarred
                        ? [...filtered, { user_id: Number(uid) || 0, group_message_id: Number(groupMessageId) }]
                        : filtered
                    return { ...m, starred: nextStarred }
                })
            })

            queryClient.invalidateQueries({ queryKey: ["starred-messages"] })
            queryClient.invalidateQueries({ queryKey: ["starred-messages-ids"] })
        }

        socket.on(GROUP_EVENTS.RECEIVE_MESSAGE, handleReceiveMessage)
        socket.on(GROUP_EVENTS.TYPING, handleTyping)
        socket.on(GROUP_EVENTS.MEMBER_JOINED, handleMemberJoined)
        socket.on(GROUP_EVENTS.MEMBER_LEFT, handleMemberLeft)
        socket.on(GROUP_EVENTS.REACTION_UPDATED, handleReactionUpdated)
        socket.on(GROUP_EVENTS.STAR_UPDATED, handleStarUpdated)

        return () => {
            socket.off(GROUP_EVENTS.RECEIVE_MESSAGE, handleReceiveMessage)
            socket.off(GROUP_EVENTS.TYPING, handleTyping)
            socket.off(GROUP_EVENTS.MEMBER_JOINED, handleMemberJoined)
            socket.off(GROUP_EVENTS.MEMBER_LEFT, handleMemberLeft)
            socket.off(GROUP_EVENTS.REACTION_UPDATED, handleReactionUpdated)
            socket.off(GROUP_EVENTS.STAR_UPDATED, handleStarUpdated)
        }
    }, [socket, groupId, queryClient])

    // ── reset when group changes ──────────────────────────────────────────
    useEffect(() => {
        setMessages([])
        setTypingUsers([])
    }, [groupId])

    // ── send message with Fast ACK & Auto-Retry ───────────────────────────

    const emitGroupSend = useCallback((targetMsg: IGroupMessage) => {
        if (!socket) return
        socket.timeout(10000).emit(
            GROUP_EVENTS.SEND_MESSAGE,
            { groupId: targetMsg.group_id, content: targetMsg.content, encrypted_keys: targetMsg.encrypted_keys, reply_to_id: targetMsg.reply_to_id },
            (err: any, res: any) => {
                if (err || (res && !res.success)) {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === targetMsg.id ? { ...m, is_pending: false, status: "failed" } : m
                        )
                    )
                } else if (res?.success && res?.message) {
                    const serverMsg = res.message
                    setMessages((prev) => {
                        const idx = prev.findIndex((m) => m.id === targetMsg.id)
                        if (idx !== -1) {
                            const next = [...prev]
                            next[idx] = { ...serverMsg, is_pending: false, status: "sent" }
                            return next
                        }
                        return prev
                    })

                    updateQueryMessagesCache<IGroupMessage>(queryClient, `group-messages-${targetMsg.group_id}`, (msgs) => {
                        if (msgs.some((m) => m.id === serverMsg.id)) return msgs
                        return [...msgs, serverMsg]
                    })
                }
            }
        )
    }, [socket, queryClient])

    const sendMessage = (content: string, encrypted_keys?: any, optimisticMsg?: IGroupMessage) => {
        if (!content.trim()) return
        const tempMsg: IGroupMessage = optimisticMsg || {
            id: -Date.now(),
            group_id: groupId,
            sender_id: currentUserIdRef.current ?? null,
            content,
            type: "text",
            encrypted_keys,
            created_at: new Date().toISOString(),
            is_pending: true,
            status: "pending",
        }
        setMessages((prev) => {
            if (prev.some((m) => m.id === tempMsg.id)) return prev
            return [...prev, { ...tempMsg, is_pending: true, status: "pending" }]
        })
        emitGroupSend(tempMsg)
    }

    const retryMessage = (msg: IGroupMessage) => {
        setMessages((prev) =>
            prev.map((m) => (m.id === msg.id ? { ...m, is_pending: true, status: "pending" } : m))
        )
        emitGroupSend(msg)
    }

    // Auto-flush pending messages when socket reconnects
    useEffect(() => {
        if (!socket) return

        const onConnect = () => {
            setMessages((prev) => {
                const pendingMsgs = prev.filter((m) => m.id < 0 && m.status !== "failed")
                pendingMsgs.forEach((msg) => emitGroupSend(msg))
                return prev
            })
        }

        socket.on("connect", onConnect)
        return () => {
            socket.off("connect", onConnect)
        }
    }, [socket, emitGroupSend])

    // ── mark seen ─────────────────────────────────────────────────────────
    const markSeen = (messageIds: number[]) => {
        if (!socket || messageIds.length === 0) return
        socket.emit(GROUP_EVENTS.MARK_SEEN, { groupId, messageIds })
    }

    // ── typing ────────────────────────────────────────────────────────────
    const emitTypingStart = () => {
        if (!socket) return
        socket.emit(GROUP_EVENTS.TYPING_START, { groupId })
    }

    const emitTypingStop = () => {
        if (!socket) return
        socket.emit(GROUP_EVENTS.TYPING_STOP, { groupId })
    }

    const emitToggleReaction = (groupMessageId: number, emoji: string) => {
        if (!socket) return
        socket.emit(GROUP_EVENTS.TOGGLE_REACTION, { groupMessageId, groupId, emoji })
    }

    const emitToggleStar = (groupMessageId: number) => {
        if (!socket) return
        socket.emit(GROUP_EVENTS.TOGGLE_STAR, { groupMessageId, groupId })
    }

    return {
        messages,
        setMessages,
        typingUsers,
        sendMessage,
        retryMessage,
        markSeen,
        emitTypingStart,
        emitTypingStop,
        emitToggleReaction,
        emitToggleStar,
    }
}