import { useEffect, useRef, useState } from "react"
import { Socket } from "socket.io-client"
import { CHAT_EVENTS } from "@/pages/chat/constants"
import { GROUP_EVENTS } from "@/pages/chat/constants"
import type { EncryptedMessage } from "@/utils/crypto"


interface IMessage {
    id: number
    content: string
    sender_id: number
    receiver_id: number
    conversation_id: number
    created_at: string
    is_seen?: boolean
}

interface UseChatProps {
    socket: Socket | null
    selectedUserId: number | null
    currentUserId: number | null
}

interface UseChatReturn {
    messages: IMessage[]
    setMessages: React.Dispatch<React.SetStateAction<IMessage[]>>
    isTyping: boolean
    activeConvRef: React.MutableRefObject<number | null>
    sendMessage: (receiverId: number, content: string) => void
    emitMarkSeen: (conversationId: number, senderId: number) => void
    emitTypingStart: (receiverId: number) => void
    emitTypingStop: (receiverId: number) => void
}

export const useChat = ({
    socket,
    selectedUserId,
    currentUserId,
}: UseChatProps): UseChatReturn => {
    const [messages, setMessages] = useState<IMessage[]>([])
    const [isTyping, setIsTyping] = useState(false)

    const activeConvRef = useRef<number | null>(null)
    const selectedUserRef = useRef<number | null>(null)

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

            setMessages((prev) => [...prev, msg])

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
        const onMessagesSeen = ({ conversationId }: { conversationId: number }) => {
            setMessages((prev) =>
                prev.map((m) =>
                    m.conversation_id === conversationId
                        ? { ...m, is_seen: true }
                        : m
                )
            )
        }

        // ── typing ────────────────────────────────────────────────────────
        // only show indicator if the typer is the currently selected user
        const onTyping = (data: { senderId: number; isTyping: boolean }) => {
            if (data.senderId !== selectedUserRef.current) return
            setIsTyping(data.isTyping)
        }

        socket.on(CHAT_EVENTS.RECEIVE_MESSAGE, onReceiveMessage)
        socket.on(CHAT_EVENTS.MESSAGES_SEEN, onMessagesSeen)
        socket.on(CHAT_EVENTS.TYPING, onTyping)

        return () => {
            socket.off(CHAT_EVENTS.RECEIVE_MESSAGE, onReceiveMessage)
            socket.off(CHAT_EVENTS.MESSAGES_SEEN, onMessagesSeen)
            socket.off(CHAT_EVENTS.TYPING, onTyping)
        }
    }, [socket])

    // ── emit helpers ──────────────────────────────────────────────────────

    const sendMessage = (receiverId: number, content: string) => {
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

    return {
        messages,
        setMessages,
        isTyping,
        activeConvRef,
        sendMessage,
        emitMarkSeen,
        emitTypingStart,
        emitTypingStop,
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
    sender?: {
        id: number
        name: string
        avatar: string | null
    }
}

interface TypingUser {
    senderId: number
    senderName: string
}

interface UseGroupChatProps {
    socket: Socket | null
    groupId: number
    onMemberJoined?: () => void
    onMemberLeft?: () => void
}

export const useGroupChat = ({ socket, groupId, onMemberJoined, onMemberLeft }: UseGroupChatProps) => {
    const [messages, setMessages] = useState<IGroupMessage[]>([])
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
    const typingTimeoutRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

    // ── listen for incoming messages ──────────────────────────────────────
    useEffect(() => {
        if (!socket) return

        const handleReceiveMessage = (message: IGroupMessage) => {
            if (message.group_id !== groupId) return
            setMessages((prev) => [...prev, message])
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

        socket.on(GROUP_EVENTS.RECEIVE_MESSAGE, handleReceiveMessage)
        socket.on(GROUP_EVENTS.TYPING, handleTyping)
        socket.on(GROUP_EVENTS.MEMBER_JOINED, handleMemberJoined)
        socket.on(GROUP_EVENTS.MEMBER_LEFT, handleMemberLeft)

        return () => {
            socket.off(GROUP_EVENTS.RECEIVE_MESSAGE, handleReceiveMessage)
            socket.off(GROUP_EVENTS.TYPING, handleTyping)
            socket.off(GROUP_EVENTS.MEMBER_JOINED, handleMemberJoined)
            socket.off(GROUP_EVENTS.MEMBER_LEFT, handleMemberLeft)
        }
    }, [socket, groupId])

    // ── reset when group changes ──────────────────────────────────────────
    useEffect(() => {
        setMessages([])
        setTypingUsers([])
    }, [groupId])

    // ── send message ──────────────────────────────────────────────────────
    const sendMessage = (content: string, encrypted_keys?: any) => {
        if (!socket || !content.trim()) return
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

    return {
        messages,
        setMessages,
        typingUsers,
        sendMessage,
        markSeen,
        emitTypingStart,
        emitTypingStop,
    }
}