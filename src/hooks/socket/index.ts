import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { useSelector } from "react-redux"
import { getUser } from "@/redux/slices/auth.slice"

export const useSocket = (): Socket | null => {
    const [socket, setSocket] = useState<Socket | null>(null)
    const user = useSelector(getUser)

    useEffect(() => {
        if (!user) return

        const newSocket = io(import.meta.env.VITE_API_URL, {
            withCredentials: true,
        })

        newSocket.on("connect", () =>
            console.log("✅ Socket connected:", newSocket.id)
        )
        newSocket.on("connect_error", (err) =>
            console.log("❌ Socket error:", err.message)
        )

        setSocket(newSocket)

        return () => {
            newSocket.disconnect()
        }
    }, [user])

    return socket
}