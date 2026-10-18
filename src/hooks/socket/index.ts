import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSelector } from "react-redux";
import { getUser } from "@/redux/slices/auth.slice";
import axiosInstance from "@/api/axios";

export const useSocket = (): Socket | null => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const user = useSelector(getUser);

    useEffect(() => {
        if (!user) return;

        let activeSocket: Socket | null = null;

        const initSocket = async () => {
            try {
                // Obtain a 10-minute ephemeral socket ticket using the verified first-party cookie
                const res = await axiosInstance.get("/auth/socket-token");
                const token = res.data?.data?.token;

                // URL is strictly derived from environment variables — no hardcoded links
                const socketServerUrl =
                    import.meta.env.VITE_SOCKET_URL ||
                    (import.meta.env.VITE_API_URL?.startsWith("http")
                        ? import.meta.env.VITE_API_URL
                        : window.location.origin);

                const newSocket = io(socketServerUrl, {
                    auth: { token },
                    withCredentials: true,
                });

                newSocket.on("connect", () =>
                    console.log("✅ Socket connected:", newSocket.id)
                );
                newSocket.on("connect_error", (err) =>
                    console.log("❌ Socket error:", err.message)
                );

                activeSocket = newSocket;
                setSocket(newSocket);
            } catch (err) {
                console.error("Socket handshake token error:", err);
            }
        };

        initSocket();

        return () => {
            if (activeSocket) {
                activeSocket.disconnect();
            }
        };
    }, [user]);

    return socket;
};