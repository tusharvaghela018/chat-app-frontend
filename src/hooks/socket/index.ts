import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { useSelector } from "react-redux"
import { getToken } from "@/redux/slices/auth.slice"

export const useSocket = (): Socket | null => {
    const [socket, setSocket] = useState<Socket | null>(null)
    const token = useSelector(getToken)

    useEffect(() => {
        if (!token) return

        const newSocket = io(import.meta.env.VITE_API_URL, {
            auth: { token },
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
    }, [token])

    return socket
}