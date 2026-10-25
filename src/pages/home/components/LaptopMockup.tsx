import React from "react";
import {
    Video, Phone, Search, MoreHorizontal, Smile, Mic, Plus,
    CheckCheck, Lock, Play, Star, Users, Settings, Image as ImageIcon
} from "lucide-react";

export const LaptopMockup: React.FC<{ className?: string }> = ({ className = "" }) => {
    return (
        <div
            className={`relative rounded-2xl bg-[#090d16] border-[10px] border-[#1e293b] shadow-2xl select-none overflow-hidden flex flex-col ${className}`}
            style={{
                boxShadow: "0 30px 80px -20px rgba(15, 23, 42, 0.8), 0 0 50px -10px rgba(99, 102, 241, 0.25)"
            }}
        >
            {/* Laptop Camera Notch & Bezel Header */}
            <div className="h-5 bg-[#090d16] flex items-center justify-center border-b border-slate-800/80 px-4 relative">
                <div className="h-2 w-2 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <div className="h-0.5 w-0.5 rounded-full bg-emerald-500/80" />
                </div>
                {/* Window control buttons */}
                <div className="absolute left-3 flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                </div>
            </div>

            {/* 3-Column Desktop Application Screen */}
            <div className="flex-1 flex overflow-hidden text-xs">
                {/* ── LEFT SIDEBAR ─────────────────────────────────── */}
                <div className="w-[190px] border-r border-slate-800 bg-[#0c1322] flex flex-col shrink-0">
                    {/* Header */}
                    <div className="p-3 border-b border-slate-800 flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-[10px]">
                            N
                        </div>
                        <span className="font-display font-bold text-slate-100 text-xs">NexusApp</span>
                    </div>

                    {/* Search */}
                    <div className="p-2.5">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 text-slate-400 text-[11px]">
                            <Search size={12} />
                            <span>Search...</span>
                        </div>
                    </div>

                    {/* Menu Categories */}
                    <div className="px-2 py-1 space-y-0.5 text-slate-300">
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 font-semibold cursor-pointer">
                            <span className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                All Chats
                            </span>
                            <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-[9px] font-bold text-white">12</span>
                        </div>
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 cursor-pointer">
                            <span>Groups</span>
                            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[9px] text-slate-400">4</span>
                        </div>
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 cursor-pointer">
                            <span>Starred</span>
                        </div>
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 cursor-pointer">
                            <span>Calls</span>
                        </div>
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 cursor-pointer">
                            <span>Archived</span>
                        </div>
                    </div>

                    {/* Recent list */}
                    <div className="pt-2 px-2 border-t border-slate-800/80 mt-1 flex-1 overflow-y-auto space-y-1">
                        <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Recent</span>
                        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-800/70 border border-slate-700/50 cursor-pointer">
                            <img
                                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop"
                                className="h-7 w-7 rounded-lg object-cover"
                                alt="team"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-100 truncate text-[11px]">Design Team</span>
                                    <span className="text-[9px] text-slate-400">9:28 AM</span>
                                </div>
                                <span className="text-[10px] text-slate-400 truncate block">Test User 2: Here's t...</span>
                            </div>
                            <span className="h-3.5 w-3.5 rounded-full bg-indigo-600 text-[8px] font-bold text-white flex items-center justify-center">3</span>
                        </div>

                        <div className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/40 text-slate-400 cursor-pointer">
                            <div className="h-7 w-7 rounded-lg bg-indigo-900/60 flex items-center justify-center text-indigo-400 font-bold text-[10px]">
                                PN
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-slate-200 truncate text-[11px]">Project Nexus</span>
                                    <span className="text-[9px] text-slate-400">8:14 AM</span>
                                </div>
                                <span className="text-[10px] text-slate-400 truncate block">You: 📎 Figma file</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/40 text-slate-400 cursor-pointer">
                            <img
                                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"
                                className="h-7 w-7 rounded-lg object-cover"
                                alt="Test User 1"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-slate-200 truncate text-[11px]">Test User 1</span>
                                    <span className="text-[9px] text-slate-400">9:41 AM</span>
                                </div>
                                <span className="text-[10px] text-slate-400 truncate block">Hey! Are we still on...</span>
                            </div>
                            <span className="h-3.5 w-3.5 rounded-full bg-indigo-600 text-[8px] font-bold text-white flex items-center justify-center">2</span>
                        </div>
                    </div>
                </div>

                {/* ── CENTER CHAT THREAD ────────────────────────────── */}
                <div className="flex-1 flex flex-col bg-[#090f1d] min-w-0">
                    {/* Chat Header */}
                    <div className="h-11 px-4 border-b border-slate-800 flex items-center justify-between bg-[#0a1120]/80 backdrop-blur-md">
                        <div className="flex items-center gap-2.5">
                            <img
                                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop"
                                className="h-7 w-7 rounded-lg object-cover border border-slate-700"
                                alt="group"
                            />
                            <div>
                                <h3 className="font-bold text-slate-100 text-xs">Design Team</h3>
                                <p className="text-[9.5px] text-slate-400">12 members</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-400">
                            <Video size={14} className="hover:text-slate-200 cursor-pointer" />
                            <Phone size={13} className="hover:text-slate-200 cursor-pointer" />
                            <Search size={14} className="hover:text-slate-200 cursor-pointer" />
                            <MoreHorizontal size={14} className="hover:text-slate-200 cursor-pointer" />
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-3.5 space-y-3 overflow-y-auto custom-scrollbar">
                        {/* Test User 2's message with attached images */}
                        <div className="flex items-start gap-2">
                            <img
                                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                                className="h-6 w-6 rounded-full object-cover mt-0.5"
                                alt="Test User 2"
                            />
                            <div className="max-w-[80%]">
                                <span className="text-[10px] font-bold text-purple-400 block mb-0.5">Test User 2</span>
                                <div className="p-2.5 rounded-2xl rounded-tl-xs bg-[#162032] border border-slate-700/60 text-slate-100 shadow-xs">
                                    <p className="text-[11.5px] mb-2 leading-relaxed">Here's the updated UI for the home screen. Thoughts?</p>
                                    {/* 3 Attached UI Cards */}
                                    <div className="grid grid-cols-3 gap-1.5">
                                        <div className="h-16 rounded-lg bg-gradient-to-br from-indigo-900 to-purple-900 border border-indigo-500/30 p-1 flex flex-col justify-between">
                                            <div className="h-2 w-8 bg-indigo-400/40 rounded-full" />
                                            <div className="h-6 w-full rounded bg-indigo-500/20" />
                                        </div>
                                        <div className="h-16 rounded-lg bg-gradient-to-br from-slate-900 to-indigo-950 border border-purple-500/30 p-1 flex flex-col justify-between">
                                            <div className="h-2 w-6 bg-purple-400/40 rounded-full" />
                                            <div className="h-6 w-full rounded bg-purple-500/20" />
                                        </div>
                                        <div className="h-16 rounded-lg bg-gradient-to-br from-indigo-950 to-slate-900 border border-slate-700 p-1 flex flex-col justify-between">
                                            <div className="h-2 w-7 bg-slate-400/40 rounded-full" />
                                            <div className="h-6 w-full rounded bg-slate-600/20" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-1 text-[9px] text-slate-400">
                                        <span>9:20 AM</span>
                                    </div>
                                </div>
                                {/* Reaction badge */}
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#1b273d] border border-slate-700 text-[10px] text-slate-300">
                                        ❤️ 4
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#1b273d] border border-slate-700 text-[10px] text-slate-300">
                                        👍 2
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* User Sent Message (Purple bubble) */}
                        <div className="flex justify-end">
                            <div className="p-2.5 rounded-2xl rounded-br-xs bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25 max-w-[75%]">
                                <p className="text-[11.5px] leading-relaxed">
                                    Looks amazing! The new style feels really premium.
                                </p>
                                <div className="flex items-center justify-end gap-1 mt-0.5 text-[9px] text-indigo-100/80">
                                    <span>9:22 AM</span>
                                    <CheckCheck size={12} className="stroke-[2.5]" />
                                </div>
                            </div>
                        </div>

                        {/* Test User 4's Voice Message */}
                        <div className="flex items-start gap-2">
                            <img
                                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
                                className="h-6 w-6 rounded-full object-cover mt-0.5"
                                alt="Test User 4"
                            />
                            <div className="max-w-[75%]">
                                <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">Test User 4</span>
                                <div className="p-2 rounded-2xl rounded-tl-xs bg-[#162032] border border-slate-700/60 flex items-center gap-2">
                                    <button className="h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                                        <Play size={12} className="fill-current ml-0.5" />
                                    </button>
                                    {/* Waveform bars */}
                                    <div className="flex items-center gap-0.5 h-5 flex-1">
                                        {[40, 70, 30, 90, 60, 100, 45, 80, 50, 95, 60, 30, 75, 40, 85, 55, 30, 70].map((h, i) => (
                                            <span
                                                key={i}
                                                className={`w-0.5 rounded-full ${i < 6 ? "bg-indigo-400" : "bg-slate-600"}`}
                                                style={{ height: `${h}%` }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-[9.5px] text-slate-400 shrink-0 font-medium tabular-nums">0:24</span>
                                    <span className="text-[9px] text-slate-400 tabular-nums">9:24 AM</span>
                                </div>
                            </div>
                        </div>

                        {/* Test User 6's Message */}
                        <div className="flex items-start gap-2">
                            <img
                                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"
                                className="h-6 w-6 rounded-full object-cover mt-0.5"
                                alt="Test User 6"
                            />
                            <div className="max-w-[75%]">
                                <span className="text-[10px] font-bold text-pink-400 block mb-0.5">Test User 6</span>
                                <div className="px-3 py-1.5 rounded-2xl rounded-tl-xs bg-[#162032] border border-slate-700/60 text-slate-100 flex items-center gap-2">
                                    <span className="text-[11.5px]">I love the new color palette! 👏</span>
                                    <span className="text-[9px] text-slate-400 shrink-0">9:26 AM</span>
                                </div>
                            </div>
                        </div>

                        {/* Typing indicator */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#162032]/80 border border-slate-700/50 text-[10px] text-indigo-300">
                            <span className="flex gap-0.5">
                                <span className="h-1 w-1 rounded-full bg-indigo-400 animate-pulse" />
                                <span className="h-1 w-1 rounded-full bg-indigo-400 animate-pulse delay-100" />
                                <span className="h-1 w-1 rounded-full bg-indigo-400 animate-pulse delay-200" />
                            </span>
                            <span>Test User 2 is typing...</span>
                        </div>
                    </div>

                    {/* Chat Input Bar */}
                    <div className="p-2.5 border-t border-slate-800 bg-[#0c1322]">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/60 text-slate-400">
                            <button className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                                <Plus size={12} strokeWidth={3} />
                            </button>
                            <span className="flex-1 text-[11px] text-slate-400">Type a message...</span>
                            <Smile size={14} className="hover:text-slate-200 cursor-pointer" />
                            <Mic size={14} className="hover:text-slate-200 cursor-pointer" />
                        </div>
                    </div>
                </div>

                {/* ── RIGHT GROUP INFO COLUMN ─────────────────────── */}
                <div className="w-[180px] border-l border-slate-800 bg-[#0c1322] p-3 flex flex-col shrink-0 text-slate-300">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                        <span className="font-bold text-slate-200 text-xs flex items-center gap-1">
                            <Settings size={12} /> Group Info
                        </span>
                    </div>

                    {/* Avatar & Group Card */}
                    <div className="text-center py-2">
                        <div className="h-14 w-14 rounded-full mx-auto overflow-hidden border-2 border-indigo-500 shadow-md shadow-indigo-600/30 mb-2">
                            <img
                                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&h=150&fit=crop"
                                className="h-full w-full object-cover"
                                alt="group"
                            />
                        </div>
                        <h4 className="font-bold text-slate-100 text-xs">Design Team</h4>
                        <p className="text-[9.5px] text-slate-400">12 members</p>

                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-500/30 text-[9px] font-bold text-indigo-300">
                            <Lock size={9} /> End-to-end encrypted
                        </div>

                        <p className="mt-2 text-[10px] text-slate-400 leading-relaxed text-center px-1">
                            A space for design discussions, feedback and creative ideas.
                        </p>
                    </div>

                    {/* Accordion Menu List */}
                    <div className="mt-3 pt-2 border-t border-slate-800 space-y-1 text-[10.5px]">
                        <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/40 text-slate-300 cursor-pointer">
                            <span className="flex items-center gap-1.5">
                                <ImageIcon size={11} className="text-slate-400" /> Media & Files
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold">248</span>
                        </div>
                        <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/40 text-slate-300 cursor-pointer">
                            <span className="flex items-center gap-1.5">
                                <Star size={11} className="text-slate-400" /> Starred
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold">12</span>
                        </div>
                        <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/40 text-slate-300 cursor-pointer">
                            <span className="flex items-center gap-1.5">
                                <Settings size={11} className="text-slate-400" /> Settings
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/40 text-slate-300 cursor-pointer">
                            <span className="flex items-center gap-1.5">
                                <Users size={11} className="text-slate-400" /> Members
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold">12</span>
                        </div>
                    </div>

                    {/* Leave Group Button */}
                    <div className="mt-auto pt-2">
                        <button className="w-full py-1.5 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10.5px] font-bold transition-colors">
                            Leave Group
                        </button>
                    </div>
                </div>
            </div>

            {/* Laptop Base / Lip */}
            <div className="h-3 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-t border-slate-700 flex items-center justify-center">
                <div className="w-20 h-1 bg-slate-600 rounded-full" />
            </div>
        </div>
    );
};

export default LaptopMockup;
