import React from "react";
import { Search, Plus, MessageSquare, Phone, Users, Settings } from "lucide-react";

export const PhoneMockup: React.FC<{ className?: string }> = ({ className = "" }) => {
    const chats = [
        {
            id: 1,
            name: "Test User 1",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
            message: "Hey! Are we still on for the meeti...",
            time: "9:41 AM",
            unread: 2,
            online: true
        },
        {
            id: 2,
            name: "Design Team",
            avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop",
            message: "Test User 2: Here's the updated UI...",
            time: "9:20 AM",
            unread: 5,
            online: false
        },
        {
            id: 3,
            name: "Product Nexus",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
            message: "You: 📎 Figma file",
            time: "8:14 AM",
            unread: 0,
            online: true
        },
        {
            id: 4,
            name: "Test User 3",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces",
            message: "🎙 Voice message",
            time: "Yesterday",
            unread: 0,
            online: false
        },
        {
            id: 5,
            name: "College Friends",
            avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop",
            message: "Test User 4: That was amazing! 🎉",
            time: "Yesterday",
            unread: 0,
            online: false
        },
        {
            id: 6,
            name: "Test User 5",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces",
            message: "Let's catch up this weekend.",
            time: "Mon",
            unread: 0,
            online: false
        },
        {
            id: 7,
            name: "Product Updates",
            avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop",
            message: "New features are live! 🚀",
            time: "Mon",
            unread: 0,
            online: true
        }
    ];

    return (
        <div
            className={`relative w-[280px] sm:w-[305px] h-[580px] sm:h-[620px] rounded-[44px] bg-[#0c121e] border-[8px] border-[#1e293b] shadow-2xl shadow-indigo-950/40 select-none overflow-hidden flex flex-col ${className}`}
            style={{
                boxShadow: "0 25px 60px -15px rgba(15, 23, 42, 0.7), 0 0 40px -10px rgba(99, 102, 241, 0.3)"
            }}
        >
            {/* Dynamic Island / Notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 w-24 h-5 bg-black rounded-full flex items-center justify-between px-2">
                <div className="h-2 w-2 rounded-full bg-slate-900 border border-slate-800" />
                <div className="h-2.5 w-2.5 rounded-full bg-slate-950 flex items-center justify-center">
                    <div className="h-1 w-1 rounded-full bg-indigo-900/60" />
                </div>
            </div>

            {/* Mobile Status Bar */}
            <div className="pt-2.5 px-6 flex items-center justify-between text-[11px] font-bold text-slate-300 z-20">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                    {/* Signal bars */}
                    <div className="flex items-end gap-0.5 h-2.5">
                        <span className="w-0.5 h-1 bg-slate-300 rounded-xs" />
                        <span className="w-0.5 h-1.5 bg-slate-300 rounded-xs" />
                        <span className="w-0.5 h-2 bg-slate-300 rounded-xs" />
                        <span className="w-0.5 h-2.5 bg-slate-300 rounded-xs" />
                    </div>
                    {/* Wifi */}
                    <svg className="w-3 h-3 text-slate-300 fill-current" viewBox="0 0 24 24">
                        <path d="M12 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-4.9-3.4c2.7-2.7 7.1-2.7 9.8 0l1.4-1.4c-3.5-3.5-9.1-3.5-12.6 0l1.4 1.4zm-2.8-2.8c4.3-4.3 11.1-4.3 15.4 0l1.4-1.4c-5.1-5.1-13.1-5.1-18.2 0l1.4 1.4z" />
                    </svg>
                    {/* Battery */}
                    <div className="w-4 h-2 rounded-xs border border-slate-300 p-0.5 flex items-center">
                        <div className="h-full w-2.5 bg-slate-300 rounded-2xs" />
                    </div>
                </div>
            </div>

            {/* App Header */}
            <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full overflow-hidden border border-indigo-500/30">
                        <img
                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"
                            alt="avatar"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <span className="font-display font-bold text-sm text-white">NexusApp</span>
                </div>
                <button className="h-7 w-7 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                    <Plus size={15} className="stroke-[2.5]" />
                </button>
            </div>

            {/* Search conversations input */}
            <div className="px-4 py-1.5">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-xs text-slate-400">
                    <Search size={13} className="text-slate-400" />
                    <span>Search conversations...</span>
                </div>
            </div>

            {/* Filter Pills */}
            <div className="px-4 py-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-bold shadow-xs">
                    <span>DM</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-indigo-800/80 text-[9px]">12</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700/60 text-[11px] font-medium">
                    <span>Groups</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-700/80 text-[9px] text-slate-300">4</span>
                </span>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
                {chats.map((chat) => (
                    <div
                        key={chat.id}
                        className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                        <div className="relative shrink-0">
                            <img
                                src={chat.avatar}
                                alt={chat.name}
                                className="h-10 w-10 rounded-full object-cover border border-slate-700/60"
                            />
                            {chat.online && (
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0c121e]" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <h4 className="text-xs font-bold text-slate-100 truncate">{chat.name}</h4>
                                <span className="text-[10px] text-slate-400 tabular-nums">{chat.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">{chat.message}</p>
                        </div>

                        {chat.unread > 0 && (
                            <span className="shrink-0 h-4 min-w-4 px-1 rounded-full bg-indigo-600 text-[9px] font-bold text-white flex items-center justify-center">
                                {chat.unread}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <div className="pt-2 pb-5 px-6 border-t border-slate-800/80 bg-slate-900/95 flex items-center justify-between text-slate-400">
                <div className="flex flex-col items-center gap-0.5 text-indigo-400 relative">
                    <MessageSquare size={17} />
                    <span className="text-[9px] font-bold">Chats</span>
                    <span className="absolute -top-1 right-1 h-3 min-w-3 px-0.5 rounded-full bg-indigo-600 text-[8px] font-bold text-white flex items-center justify-center">
                        12
                    </span>
                </div>
                <div className="flex flex-col items-center gap-0.5 hover:text-slate-200 cursor-pointer">
                    <Phone size={17} />
                    <span className="text-[9px] font-medium">Calls</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 hover:text-slate-200 cursor-pointer">
                    <Users size={17} />
                    <span className="text-[9px] font-medium">Communities</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 hover:text-slate-200 cursor-pointer">
                    <Settings size={17} />
                    <span className="text-[9px] font-medium">Settings</span>
                </div>
            </div>

            {/* Bottom Home Indicator Bar */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-500/60 rounded-full" />
        </div>
    );
};

export default PhoneMockup;
