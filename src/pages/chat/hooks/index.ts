import { useEffect, useRef, useState } from "react"
import { Socket } from "socket.io-client"
import { CHAT_EVENTS } from "@/pages/chat/constants"

interface IMessage {
    id: number
    content: string
    sender_id: number
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
}: UseChatProps): UseChatReturn => {
    const [messages, setMessages] = useState<IMessage[]>([])
    const [isTyping, setIsTyping] = useState(false)

    const activeConvRef = useRef<number | null>(null)
    const selectedUserRef = useRef<number | null>(null)

    // keep ref in sync — used inside socket closures to avoid stale state
    useEffect(() => {
        selectedUserRef.current = selectedUserId
        setIsTyping(false)  // reset typing when switching users
    }, [selectedUserId])

    useEffect(() => {
        if (!socket) return

        // ── receive_message ───────────────────────────────────────────────
        const onReceiveMessage = (msg: IMessage) => {
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