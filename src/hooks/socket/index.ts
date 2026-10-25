import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSelector } from "react-redux";
import { getUser } from "@/redux/slices/auth.slice";
import axiosInstance from "@/api/axios";

let globalSocket: Socket | null = null;
let activeUserId: number | null = null;
let isInitializing = false;
const listeners = new Set<(s: Socket | null) => void>();

export const useSocket = (): Socket | null => {
    const user = useSelector(getUser);
    const [socket, setSocket] = useState<Socket | null>(globalSocket);

    useEffect(() => {
        if (!user) {
            if (globalSocket) {
                globalSocket.disconnect();
                globalSocket = null;
                activeUserId = null;
                listeners.forEach(fn => fn(null));
            }
            setSocket(null);
            return;
        }

        const listener = (s: Socket | null) => setSocket(s);
        listeners.add(listener);

        if (globalSocket && activeUserId === user.id && globalSocket.connected) {
            setSocket(globalSocket);
        } else if (!isInitializing || activeUserId !== user.id) {
            isInitializing = true;
            activeUserId = user.id;

            (async () => {
                try {
                    const res = await axiosInstance.get("/auth/socket-token");
                    const token = res.data?.data?.token;

                    const socketServerUrl =
                        import.meta.env.VITE_SOCKET_URL ||
                        (import.meta.env.VITE_API_URL?.startsWith("http")
                            ? import.meta.env.VITE_API_URL
                            : window.location.origin);

                    if (globalSocket) {
                        globalSocket.disconnect();
                    }

                    const newSocket = io(socketServerUrl, {
                        auth: { token },
                        withCredentials: true,
                    });

                    newSocket.on("connect", () => {
                        console.log("✅ Socket connected:", newSocket.id);
                        listeners.forEach(fn => fn(newSocket));
                    });
                    newSocket.on("connect_error", (err) =>
                        console.log("❌ Socket error:", err.message)
                    );

                    globalSocket = newSocket;
                    listeners.forEach(fn => fn(newSocket));
                } catch (err) {
                    console.error("Socket handshake token error:", err);
                } finally {
                    isInitializing = false;
                }
            })();
        }

        return () => {
            listeners.delete(listener);
        };
    }, [user?.id]);

    return socket;
};