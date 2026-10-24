import React from "react";
import { MessageSquare, Users, Lock, Smartphone } from "lucide-react";

export const FeaturesStrip: React.FC = () => {
    const features = [
        {
            icon: <MessageSquare size={22} className="text-purple-600 dark:text-purple-400 stroke-[2.3]" />,
            title: "Real-time Messaging",
            description: "Instant, reliable and secure conversations worldwide."
        },
        {
            icon: <Users size={22} className="text-purple-600 dark:text-purple-400 stroke-[2.3]" />,
            title: "Group Collaboration",
            description: "Encrypted group chats with member roles and invite links."
        },
        {
            icon: <Lock size={22} className="text-purple-600 dark:text-purple-400 stroke-[2.3]" />,
            title: "End-to-end Encrypted",
            description: "Your privacy, our priority."
        },
        {
            icon: <Smartphone size={22} className="text-purple-600 dark:text-purple-400 stroke-[2.3]" />,
            title: "Multi-device Sync",
            description: "Chat seamlessly across all your devices."
        }
    ];

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-20">
            {/* Frosted Glass Banner */}
            <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-[#0c1220]/95 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-indigo-950/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    {features.map((item, idx) => (
                        <div
                            key={idx}
                            className="flex items-start gap-4 group p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300"
                        >
                            {/* Purple Icon Container */}
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100/70 dark:from-purple-950/70 dark:to-indigo-950/60 border border-purple-200/90 dark:border-purple-800/60 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:from-purple-200 group-hover:to-indigo-200 dark:group-hover:from-purple-900/80 dark:group-hover:to-indigo-900/80 group-hover:shadow-md group-hover:shadow-purple-500/20 transition-all duration-300 shadow-2xs">
                                {item.icon}
                            </div>

                            {/* Content */}
                            <div>
                                <h3 className="font-display font-bold text-sm sm:text-[15px] text-slate-900 dark:text-slate-100 mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    {item.title}
                                </h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FeaturesStrip;
