import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSelector } from "react-redux";
import { getUser, clearAuth } from "@/redux/slices/auth.slice";
import { store } from "@/redux/store";
import { addToast } from "@/redux/slices/toast.slice";
import axiosInstance from "@/api/axios";

let globalSocket: Socket | null = null;
let activeUserId: number | null = null;
let isInitializing = false;
const listeners = new Set<(s: Socket | null) => void>();

// Immediately disconnect socket when browser tab or window is closed or navigated away
if (typeof window !== "undefined") {
    const handleUnload = () => {
        if (globalSocket && globalSocket.connected) {
            globalSocket.disconnect();
        }
    };
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);
}

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

        if (globalSocket && activeUserId === user.id) {
            setSocket(globalSocket);
        } else if (!isInitializing) {
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
                        reconnection: true,
                        reconnectionAttempts: Infinity,
                        reconnectionDelay: 1000,
                        reconnectionDelayMax: 5000,
                        timeout: 20000,
                    });

                    newSocket.on("connect", () => {
                        console.log("✅ Socket connected:", newSocket.id);
                        listeners.forEach(fn => fn(newSocket));
                    });
                    newSocket.on("connect_error", (err) =>
                        console.log("❌ Socket error:", err.message)
                    );

                    newSocket.on("session_revoked", (data: any) => {
                        console.warn("⚠️ Session revoked:", data);
                        store.dispatch(clearAuth());
                        store.dispatch(addToast({
                            message: data?.message || "Your session has been logged out from another device.",
                            type: "warning",
                            duration: 5000
                        }));
                        if (globalSocket) {
                            globalSocket.disconnect();
                            globalSocket = null;
                        }
                        setTimeout(() => {
                            window.location.href = "/login";
                        }, 500);
                    });

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