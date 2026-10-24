import { useState, useEffect } from "react"
import { useSocket } from "@/hooks/socket"
import { CHAT_EVENTS } from "@/pages/chat/constants"

// Shared global presence state
let globalOnlineUsers = new Set<number>()
const globalLastSeenMap = new Map<number, string>()
const subscribers = new Set<() => void>()

function notifySubscribers() {
    subscribers.forEach((cb) => cb())
}

export function formatLastActive(lastSeen?: string | Date | null): string {
    if (!lastSeen) return "Offline"
    const date = new Date(lastSeen)
    if (isNaN(date.getTime())) return "Offline"

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)

    if (diffSec < 60) return "Last seen just now"
    if (diffMin < 60) return `Last seen ${diffMin}m ago`

    const isToday = now.toDateString() === date.toDateString()
    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    if (isToday) return `Last seen today at ${timeStr}`

    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    if (yesterday.toDateString() === date.toDateString()) {
        return `Last seen yesterday at ${timeStr}`
    }

    return `Last seen ${date.toLocaleDateString([], { month: "short", day: "numeric" })} at ${timeStr}`
}

export const usePresence = () => {
    const socket = useSocket()
    const [, setTick] = useState(0)

    useEffect(() => {
        const updater = () => setTick((t) => t + 1)
        subscribers.add(updater)
        return () => {
            subscribers.delete(updater)
        }
    }, [])

    useEffect(() => {
        if (!socket) return

        const onOnlineUsers = (userIds: number[]) => {
            globalOnlineUsers = new Set(userIds)
            notifySubscribers()
        }

        const onUserStatus = (data: { userId: number; isOnline: boolean; lastSeen?: string | null }) => {
            if (data.isOnline) {
                globalOnlineUsers.add(data.userId)
            } else {
                globalOnlineUsers.delete(data.userId)
                if (data.lastSeen) {
                    globalLastSeenMap.set(data.userId, data.lastSeen)
                }
            }
            notifySubscribers()
        }

        socket.on(CHAT_EVENTS.ONLINE_USERS, onOnlineUsers)
        socket.on(CHAT_EVENTS.USER_STATUS, onUserStatus)

        return () => {
            socket.off(CHAT_EVENTS.ONLINE_USERS, onOnlineUsers)
            socket.off(CHAT_EVENTS.USER_STATUS, onUserStatus)
        }
    }, [socket])

    const isUserOnline = (userId: number, initialOnline?: boolean) => {
        if (globalOnlineUsers.has(userId)) return true
        if (globalOnlineUsers.size === 0 && initialOnline) return true
        return false
    }

    const getUserLastSeen = (userId: number, fallbackLastSeen?: string) => {
        return globalLastSeenMap.get(userId) || fallbackLastSeen || null
    }

    return {
        isUserOnline,
        getUserLastSeen,
        formatLastActive,
    }
}
