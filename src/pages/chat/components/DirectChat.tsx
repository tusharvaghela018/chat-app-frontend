import { useState, useEffect, useRef } from "react"
import { useSelector } from "react-redux"
import { User } from "lucide-react"
import { useGetApi } from "@/hooks/api"
import { useSocket } from "@/hooks/socket"
import { useChat } from "@/pages/chat/hooks"
import { getUser } from "@/redux/slices/auth.slice"
import type { IUser } from "@/types"
import Button from "@/common/Button"

interface IMessage {
    id: number
    content: string
    sender_id: number
    conversation_id: number
    created_at: string
    is_seen?: boolean
}

interface Props {
    user: IUser
}

const DirectChat = ({ user }: Props) => {
    const authUser = useSelector(getUser)
    const socket = useSocket()

    const [input, setInput] = useState("")
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const bottomRef = useRef<HTMLDivElement>(null)

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
    })

    // ── load messages ─────────────────────────────────────────────────────
    const { data: messageData } = useGetApi<IMessage[]>(
        `/message/${user.id}`,
        undefined,
        { enabled: !!user.id }
    )

    useEffect(() => {
        if (!messageData?.data) return

        const msgs = Array.isArray(messageData.data)
            ? messageData.data
            : (messageData.data as any)?.messages ?? []

        setMessages(msgs)

        const conversationId = msgs[0]?.conversation_id ?? null
        activeConvRef.current = conversationId

        if (conversationId && socket) {
            emitMarkSeen(conversationId, user.id)
        }
    }, [messageData, socket])

    // ── reset when user changes ───────────────────────────────────────────
    useEffect(() => {
        setMessages([])
        setInput("")
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        emitTypingStop(user.id)
    }, [user.id])

    // ── auto scroll ───────────────────────────────────────────────────────
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // ── typing ────────────────────────────────────────────────────────────
    const handleTyping = (val: string) => {
        setInput(val)
        emitTypingStart(user.id)

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
            emitTypingStop(user.id)
        }, 2000)
    }

    // ── send ──────────────────────────────────────────────────────────────
    const handleSend = () => {
        if (!input.trim()) return

        sendMessage(user.id, input)
        emitTypingStop(user.id)

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        setInput("")
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden">

            {/* header */}
            <div className="h-16 bg-white border-b flex items-center px-6 flex-shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                            {user.avatar
                                ? <img src={user.avatar} className="w-9 h-9 rounded-full object-cover" />
                                : <User size={16} />
                            }
                        </div>
                        {user.is_online && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                        )}
                    </div>
                    <div>
                        <p className="font-semibold text-sm leading-tight">{user.name}</p>
                        <p className="text-xs leading-tight">
                            {isTyping ? (
                                <span className="text-blue-500 italic animate-pulse">typing...</span>
                            ) : (
                                <span className="text-gray-400">
                                    {user.is_online ? "Online" : "Offline"}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-gray-400">No messages yet — say hello 👋</p>
                    </div>
                )}

                {messages.map((msg: IMessage) => {
                    const isMine = msg.sender_id === authUser?.id
                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`px-4 py-2 rounded-2xl text-sm max-w-xs break-words
                                ${isMine
                                    ? "bg-blue-600 text-white rounded-br-sm"
                                    : "bg-white text-gray-800 rounded-bl-sm shadow-sm border"
                                }`}
                            >
                                {msg.content}
                                {isMine && (
                                    <span className={`block text-right text-[10px] mt-1
                                        ${msg.is_seen ? "text-blue-200" : "text-blue-300 opacity-70"}`}
                                    >
                                        {msg.is_seen ? "✓✓ Seen" : "✓ Sent"}
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                })}

                <div ref={bottomRef} />
            </div>

            {/* input */}
            <div className="p-4 bg-white border-t flex-shrink-0 flex gap-2">
                <input
                    value={input}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder={`Message ${user.name}...`}
                    className="flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition"
                />
                <Button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="bg-blue-600 text-white px-5 rounded-xl disabled:opacity-40 hover:bg-blue-700 transition"
                >
                    Send
                </Button>
            </div>
        </div>
    )
}

export default DirectChat