import React from "react";
import { ShieldCheck, Key, Lock, EyeOff, Database, CheckCircle2 } from "lucide-react";

export const HomeSecuritySection: React.FC = () => {
    const securityCards = [
        {
            icon: <Key className="text-purple-600 dark:text-purple-400 stroke-[2.3]" size={22} />,
            title: "Client-Side Cryptography",
            desc: "Keys are generated and stored exclusively on your device using Libsodium/TweetNaCl. They never touch the server unencrypted."
        },
        {
            icon: <EyeOff className="text-purple-600 dark:text-purple-400 stroke-[2.3]" size={22} />,
            title: "Zero-Knowledge Architecture",
            desc: "The NexusApp server operates purely as an encrypted packet relay. No one — not even our engineers or cloud providers — can read your messages."
        },
        {
            icon: <Lock className="text-purple-600 dark:text-purple-400 stroke-[2.3]" size={22} />,
            title: "X25519 & XSalsa20 Encryption",
            desc: "State-of-the-art modern elliptic curve Diffie-Hellman key exchange paired with high-speed 256-bit authenticated cipher algorithms."
        },
        {
            icon: <Database className="text-purple-600 dark:text-purple-400 stroke-[2.3]" size={22} />,
            title: "Ephemeral Group Keys",
            desc: "Group conversations maintain individual pairwise encrypted channels, preventing unauthorized eavesdropping or replay attacks."
        }
    ];

    return (
        <section id="security" className="py-24 relative overflow-hidden bg-slate-50/80 dark:bg-muted/10 border-t border-slate-200/80 dark:border-border/60">
            {/* Background Subtle Gradient */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 blur-3xl rounded-full pointer-events-none -z-10" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-100/90 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-xs font-bold text-purple-700 dark:text-purple-300 mb-4 uppercase tracking-wider">
                        <ShieldCheck size={14} /> Uncompromising Privacy
                    </div>
                    <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-foreground tracking-tight">
                        Built from ground up for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 dark:from-indigo-400 dark:via-purple-400 dark:to-blue-400">absolute confidentiality</span>.
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-muted-foreground leading-relaxed">
                        Every single message, media attachment, and voice note is encrypted before it leaves your device. Only you and the intended receiver hold the cryptographic keys.
                    </p>
                </div>

                {/* 4 Security Pillars Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {securityCards.map((card, i) => (
                        <div
                            key={i}
                            className="p-6 rounded-3xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-border/80 hover:border-purple-500/60 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group flex flex-col justify-between shadow-sm shadow-slate-200/50 dark:shadow-none"
                        >
                            <div>
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100/70 dark:from-purple-950/70 dark:to-indigo-950/60 border border-purple-200/90 dark:border-purple-800/60 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:from-purple-200 group-hover:to-indigo-200 dark:group-hover:from-purple-900/80 dark:group-hover:to-indigo-900/80 group-hover:shadow-md group-hover:shadow-purple-500/20 transition-all duration-300 shadow-2xs">
                                    {card.icon}
                                </div>
                                <h3 className="font-display font-bold text-base text-slate-900 dark:text-slate-100 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    {card.title}
                                </h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                                    {card.desc}
                                </p>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 size={14} className="stroke-[2.5]" /> Verified by design
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HomeSecuritySection;
