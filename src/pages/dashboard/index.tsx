import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useGetApi } from "@/hooks/api";
import { User } from "lucide-react";
import { useSelector } from "react-redux";
import { getToken } from "@/redux/slices/auth.slice";

interface IUser {
    id: number;
    name: string;
    avatar?: string;
}

interface IMessage {
    id: number;
    content: string;
    sender_id: number;
    conversation_id: number;
    created_at: string;
}

interface MessageParams {
    id: number;
}

const ChatPage = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [input, setInput] = useState("");
    const token = useSelector(getToken)

    // 🔹 Get all users
    const { data: usersData } = useGetApi<IUser[]>("/users");

    const users = usersData?.data || [];

    // 🔹 Load messages when user selected
    const { data: messageData } = useGetApi<IMessage[]>(
        `/message/${selectedUser?.id}`,
        undefined,
        {
            enabled: !!selectedUser,  // only fires when selectedUser is not null
        }
    );

    useEffect(() => {
        if (messageData?.data) {
            setMessages(messageData.data);
        }
    }, [messageData]);

    // 🔹 Socket listeners

    useEffect(() => {
        const newSocket = io("http://localhost:8000", {
            auth: {
                token: token,
            },
        });

        newSocket.on("connect", () => {
            console.log("✅ Socket connected:", newSocket.id);
        });

        newSocket.on("connect_error", (err) => {
            console.log("❌ Socket error:", err.message);
        });

        newSocket.on("receive_message", (msg) => {
            console.log("📩 Message received:", msg);
            setMessages((prev) => [...prev, msg]);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // 🔹 Send message
    const sendMessage = () => {
        if (!input.trim() || !selectedUser || !socket) {
            console.log("❌ Blocked:", { input, selectedUser, socket });
            return;
        }
        console.log("sending the content", input)

        socket?.emit("send_message", {
            receiverId: selectedUser.id,
            content: input,
        });

        setInput("");
    };

    return (
        <div className="h-screen flex bg-gray-100">

            {/* 🔹 LEFT SIDEBAR */}
            <div className="w-1/4 bg-white border-r overflow-y-auto">
                <div className="p-4 font-semibold text-lg border-b">
                    Chats
                </div>

                {users.map((user) => (
                    <div
                        key={user.id}
                        onClick={() => {
                            setSelectedUser(user);
                            // refetch();
                        }}
                        className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-100 
                        ${selectedUser?.id === user.id ? "bg-gray-100" : ""}`}
                    >
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-medium">{user.name}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* 🔹 RIGHT CHAT */}
            <div className="flex-1 flex flex-col">

                {/* Header */}
                <div className="h-16 bg-white border-b flex items-center px-6 font-semibold">
                    {selectedUser ? selectedUser.name : "Select a user"}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender_id === selectedUser?.id
                                ? "justify-start"
                                : "justify-end"
                                }`}
                        >
                            <div
                                className={`px-4 py-2 rounded-xl text-sm max-w-xs
                                ${msg.sender_id === selectedUser?.id
                                        ? "bg-gray-200"
                                        : "bg-blue-600 text-white"
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input */}
                {selectedUser && (
                    <div className="p-4 bg-white border-t flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 border rounded-lg px-4 py-2 text-sm outline-none"
                        />
                        <button
                            onClick={sendMessage}
                            className="bg-blue-600 text-white px-4 rounded-lg"
                        >
                            Send
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;