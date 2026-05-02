import { useState, useEffect, useRef } from "react"
import { useSelector } from "react-redux"
import { User, Send, ChevronLeft, Phone, Video, MoreVertical, MessageSquare, X } from "lucide-react"
import { useGetApi } from "@/hooks/api"
import { useSocket } from "@/hooks/socket"
import { useChat } from "@/pages/chat/hooks"
import { getUser } from "@/redux/slices/auth.slice"
import type { IUser } from "@/types"
import Button from "@/common/Button"

import Input from "@/common/Input"

interface IMessage {
    id: number
    content: string
    sender_id: number
    receiver_id: number
    conversation_id: number
    created_at: string
    is_seen?: boolean
}

interface Props {
    user: IUser
    onBack?: () => void
    onClose?: () => void
}

const DirectChat = ({ user, onBack, onClose }: Props) => {
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

    // ── load messages & sync state ────────────────────────────────────────
    const { data: messageData } = useGetApi<IMessage[]>(
        `/message/${user.id}`,
        undefined,
        { 
            queryKey: `messages-${user.id}`,
            enabled: !!user.id 
        }
    )

    useEffect(() => {
        // 1. Always clear current messages and input when user ID changes
        // This prevents seeing old user's messages while new ones load
        setMessages([])
        setInput("")
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        emitTypingStop(user.id)

        // 2. If we have data (either cached or fresh), populate it
        if (messageData?.data) {
            const msgs = Array.isArray(messageData.data)
                ? messageData.data
                : (messageData.data as any)?.messages ?? []

            setMessages(msgs)

            const conversationId = msgs[0]?.conversation_id ?? null
            activeConvRef.current = conversationId

            if (conversationId && socket) {
                emitMarkSeen(conversationId, user.id)
            }
        }
    }, [user.id, messageData, socket]) // Trigger on user change OR data change

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
                        <p className="truncate text-sm font-bold text-foreground">{user.name}</p>
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
                    <Button variant="ghost" size="icon" className="hidden sm:flex text-muted-foreground rounded-full">
                        <Phone size={18} />
                    </Button>
                    <Button variant="ghost" size="icon" className="hidden sm:flex text-muted-foreground rounded-full">
                        <Video size={18} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground rounded-full">
                        <MoreVertical size={18} />
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-background/50">
                {messages.length === 0 && (
                    <div className="flex h-full flex-col items-center justify-center space-y-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <MessageSquare size={32} />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">No messages yet — say hello 👋</p>
                    </div>
                )}

                {messages.map((msg: IMessage) => {
                    const isMine = msg.sender_id === authUser?.id
                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`group relative px-4 py-2.5 text-sm max-w-[85%] sm:max-w-md break-words shadow-sm
                                ${isMine
                                    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-none"
                                    : "bg-card text-foreground rounded-2xl rounded-bl-none border border-border"
                                }`}
                            >
                                {msg.content}
                                <div className={`flex items-center justify-end gap-1 mt-1 
                                    ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                                >
                                    <span className="text-[10px] tabular-nums">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isMine && (
                                        <span className="text-[10px]">
                                            {msg.is_seen ? "✓✓" : "✓"}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}

                <div ref={bottomRef} />
            </div>

            {/* input */}
            <div className="border-t bg-card p-4 pb-safe sm:px-6">
                <div className="flex items-center gap-2 max-w-4xl mx-auto">
                    <Input
                        value={input}
                        onChange={(e) => handleTyping(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
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
        </div>
    )
}

export default DirectChat