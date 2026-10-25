import { useEffect, useRef, useState } from "react"
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

export interface IMessage {
    id: number
    content: string
    sender_id: number
    receiver_id: number
    conversation_id: number
    created_at: string
    is_seen?: boolean
    is_pending?: boolean
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
    emitMarkSeen: (conversationId: number, senderId: number) => void
    emitTypingStart: (receiverId: number) => void
    emitTypingStop: (receiverId: number) => void
    emitToggleReaction: (messageId: number, emoji: string, receiverId: number) => void
    emitToggleStar?: (messageId: number) => void
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
    }, [selectedUserId])

    useEffect(() => {
        if (!socket) return

        // ── receive_message ───────────────────────────────────────────────
        const onReceiveMessage = (msg: IMessage) => {
            // If activeConvRef is null, it might be the first message of a new conversation
            if (activeConvRef.current === null) {
                const isRelevant = 
                    (msg.sender_id === selectedUserRef.current && msg.receiver_id === currentUserId) ||
                    (msg.sender_id === currentUserId && msg.receiver_id === selectedUserRef.current);
                
                if (isRelevant) {
                    activeConvRef.current = msg.conversation_id;
                }
            }

            // wrong conversation is open — ignore completely, do NOT mark seen
            if (msg.conversation_id !== activeConvRef.current) return

            setMessages((prev) => {
                // If it's our own message emitted back by server, reconcile pending optimistic message
                if (msg.sender_id === currentUserId) {
                    const pendingIndex = prev.findIndex(
                        (m) => m.id < 0 && (m.content === msg.content || m.receiver_id === msg.receiver_id)
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

            // ✅ only mark seen if the sender is the person currently open
            // if user_b is chatting with user_c, messages from user_a are NOT marked seen
            if (msg.sender_id === selectedUserRef.current) {
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
    }, [socket, currentUserId, onStatusUpdated])

    // ── emit helpers ──────────────────────────────────────────────────────

    const sendMessage = (receiverId: number, content: string, optimisticMsg?: IMessage) => {
        if (optimisticMsg) {
            setMessages((prev) => [...prev, optimisticMsg])
        }
        socket?.emit(CHAT_EVENTS.SEND_MESSAGE, { receiverId, content })
    }

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
    encrypted_keys?: Record<number, EncryptedMessage>
    created_at: string
    is_pending?: boolean
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
    }, [socket, groupId])

    // ── reset when group changes ──────────────────────────────────────────
    useEffect(() => {
        setMessages([])
        setTypingUsers([])
    }, [groupId])

    // ── send message ──────────────────────────────────────────────────────
    const sendMessage = (content: string, encrypted_keys?: any, optimisticMsg?: IGroupMessage) => {
        if (!socket || !content.trim()) return
        if (optimisticMsg) {
            setMessages((prev) => [...prev, optimisticMsg])
        }
        socket.emit(GROUP_EVENTS.SEND_MESSAGE, { groupId, content, encrypted_keys })
    }

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
        markSeen,
        emitTypingStart,
        emitTypingStop,
        emitToggleReaction,
        emitToggleStar,
    }
}