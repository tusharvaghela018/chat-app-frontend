import { useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { ArrowLeft, User } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { useGetApi } from "@/hooks/api"
import { useSocket } from "@/hooks/socket"
import { useChat } from "@/pages/chat/hooks"
import { getUser } from "@/redux/slices/auth.slice"

interface IUser {
    id: number
    name: string
    avatar?: string
    is_online?: boolean
}

interface IMessage {
    id: number
    content: string
    sender_id: number
    conversation_id: number
    created_at: string
    is_seen?: boolean
}

const ChatPage = () => {
    const navigate = useNavigate()
    const authUser = useSelector(getUser)
    console.log("===================", authUser)
    const socket = useSocket()

    const [selectedUser, setSelectedUser] = useState<IUser | null>(null)
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
        selectedUserId: selectedUser?.id ?? null,
        currentUserId: authUser?.id ?? null,
    })

    // ── users list ────────────────────────────────────────────────────────
    const { data: usersData } = useGetApi<IUser[]>("/users")
    const users = Array.isArray(usersData?.data)
        ? usersData.data
        : (usersData?.data as any)?.users ?? []

    // ── load messages ─────────────────────────────────────────────────────
    const { data: messageData } = useGetApi<IMessage[]>(
        `/message/${selectedUser?.id}`,
        undefined,
        { enabled: !!selectedUser }
    )

    useEffect(() => {
        if (!messageData?.data) return

        const msgs = Array.isArray(messageData.data)
            ? messageData.data
            : (messageData.data as any)?.messages ?? []

        setMessages(msgs)

        const conversationId = msgs[0]?.conversation_id ?? null
        activeConvRef.current = conversationId

        if (conversationId && socket && selectedUser) {
            emitMarkSeen(conversationId, selectedUser.id)
        }
    }, [messageData, socket])

    // ── auto scroll to bottom on new message ──────────────────────────────
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // ── typing handler ────────────────────────────────────────────────────
    const handleTyping = (val: string) => {
        setInput(val)
        if (!selectedUser) return

        emitTypingStart(selectedUser.id)

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
            emitTypingStop(selectedUser.id)
        }, 2000)
    }

    // ── send ──────────────────────────────────────────────────────────────
    const handleSend = () => {
        if (!input.trim() || !selectedUser) return

        sendMessage(selectedUser.id, input)
        emitTypingStop(selectedUser.id)

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        setInput("")
    }

    // ── select user ───────────────────────────────────────────────────────
    const handleSelectUser = (user: IUser) => {
        if (selectedUser) emitTypingStop(selectedUser.id)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        setSelectedUser(user)
        setMessages([])
    }

    return (
        // ✅ h-screen on outer, overflow hidden — children manage their own scroll
        <div className="h-[calc(100vh-60px)] flex bg-gray-100 overflow-hidden">

            {/* ── Sidebar ──────────────────────────────────────────────── */}
            <div className="w-1/4 bg-white border-r flex flex-col">

                {/* ✅ sticky header — always visible at top of sidebar */}
                <div className="p-4 font-semibold text-lg border-b flex items-center justify-between flex-shrink-0">
                    <span>Chats</span>
                    <button
                        onClick={() => navigate("/")}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition"
                    >
                        <ArrowLeft size={16} />
                        Home
                    </button>
                </div>

                {/* ✅ scrollable user list — only this part scrolls */}
                <div className="flex-1 overflow-y-auto">
                    {users.map((user: IUser) => (
                        <div
                            key={user.id}
                            onClick={() => handleSelectUser(user)}
                            className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition
                                ${selectedUser?.id === user.id ? "bg-blue-50 border-r-2 border-blue-500" : ""}`}
                        >
                            {/* avatar with online dot */}
                            <div className="relative flex-shrink-0">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User size={18} />
                                </div>
                                {user.is_online && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{user.name}</p>
                                <p className="text-xs text-gray-400">
                                    {user.is_online ? "Online" : "Offline"}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Chat area ─────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* ✅ sticky chat header — never scrolls away */}
                <div className="h-16 bg-white border-b flex items-center px-6 flex-shrink-0 shadow-sm">
                    {selectedUser ? (
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User size={16} />
                                </div>
                                {selectedUser.is_online && (
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                                )}
                            </div>
                            <div>
                                <p className="font-semibold text-sm leading-tight">
                                    {selectedUser.name}
                                </p>
                                {/* ✅ typing shown in header sub-line */}
                                <p className="text-xs leading-tight">
                                    {isTyping ? (
                                        <span className="text-blue-500 italic animate-pulse">
                                            typing...
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">
                                            {selectedUser.is_online ? "Online" : "Offline"}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <span className="font-semibold text-gray-400">
                            Select a user to start chatting
                        </span>
                    )}
                </div>

                {/* ✅ messages — scrollable, fills remaining space */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 && selectedUser && (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-sm text-gray-400">
                                No messages yet — say hello 👋
                            </p>
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

                    {/* ✅ scroll anchor — always at bottom */}
                    <div ref={bottomRef} />
                </div>

                {/* ✅ input bar — sticky at bottom, never scrolls */}
                {selectedUser && (
                    <div className="p-4 bg-white border-t flex-shrink-0 flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => handleTyping(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder={`Message ${selectedUser.name}...`}
                            className="flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="bg-blue-600 text-white px-5 rounded-xl disabled:opacity-40 hover:bg-blue-700 transition"
                        >
                            Send
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ChatPage