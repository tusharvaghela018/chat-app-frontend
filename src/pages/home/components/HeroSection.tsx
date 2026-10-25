import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Lock, ArrowRight, MessageSquare, ShieldCheck, Globe } from "lucide-react";

import { getUser } from "@/redux/slices/auth.slice";
import { ROUTES } from "@/constants/routes";
import HeroVisualShowcase from "./HeroVisualShowcase";

export const HeroSection: React.FC = () => {
    const user = useSelector(getUser);

    return (
        <section className="relative pt-28 sm:pt-36 pb-12 overflow-hidden">
            {/* Soft Ambient Radial Background Lights */}
            <div
                className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[500px] rounded-full bg-gradient-to-br from-indigo-500/10 via-purple-500/8 to-transparent blur-3xl -z-10 pointer-events-none"
                aria-hidden="true"
            />
            <div
                className="absolute top-20 right-10 w-[500px] h-[450px] rounded-full bg-gradient-to-bl from-purple-500/12 via-indigo-500/8 to-transparent blur-3xl -z-10 pointer-events-none"
                aria-hidden="true"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                    {/* ── LEFT COLUMN: VALUE PROPOSITION & CTAS ────── */}
                    <div className="lg:col-span-5 flex flex-col items-start text-left z-10 animate-in fade-in slide-in-from-left-6 duration-700">
                        {/* Top Security Pill Badge */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-2xs mb-6 hover:border-purple-500/40 transition-colors">
                            <Lock size={13} className="text-purple-600 dark:text-purple-400 stroke-[2.5]" />
                            <span>End-to-end encrypted</span>
                        </div>

                        {/* Bold Main Headline */}
                        <h1 className="font-display text-4xl sm:text-5xl lg:text-[58px] font-extrabold tracking-tight text-slate-900 dark:text-foreground leading-[1.12] mb-6">
                            Messages that{" "}
                            <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 dark:from-indigo-400 dark:via-purple-400 dark:to-blue-400">
                                bring people closer.
                            </span>
                        </h1>

                        {/* Subtitle Description */}
                        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mb-8">
                            A modern, real-time encrypted messaging experience with powerful features for individuals and teams.
                        </p>

                        {/* Social Proof / Key Stats Row */}
                        <div className="flex flex-wrap items-center gap-6 sm:gap-8 pb-8 mb-8 border-b border-slate-200/80 dark:border-border/60 w-full">
                            {/* Stat 1: Overlapping Avatars + 50K+ Users */}
                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-2.5 overflow-hidden">
                                    <img
                                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces"
                                        alt="user"
                                        className="inline-block h-8 w-8 rounded-full ring-2 ring-background object-cover"
                                    />
                                    <img
                                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces"
                                        alt="user"
                                        className="inline-block h-8 w-8 rounded-full ring-2 ring-background object-cover"
                                    />
                                    <img
                                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces"
                                        alt="user"
                                        className="inline-block h-8 w-8 rounded-full ring-2 ring-background object-cover"
                                    />
                                </div>
                                <div>
                                    <div className="text-sm font-extrabold text-slate-900 dark:text-foreground">50K+</div>
                                    <div className="text-[11px] text-slate-600 dark:text-slate-400">Active users</div>
                                </div>
                            </div>

                            {/* Stat 2: 1M+ Messages daily */}
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100/70 dark:from-purple-950/70 dark:to-indigo-950/60 border border-purple-200/90 dark:border-purple-800/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-2xs">
                                    <MessageSquare size={16} className="stroke-[2.2]" />
                                </div>
                                <div>
                                    <div className="text-sm font-extrabold text-slate-900 dark:text-foreground">1M+</div>
                                    <div className="text-[11px] text-slate-600 dark:text-slate-400">Messages daily</div>
                                </div>
                            </div>

                            {/* Stat 3: 99.9% Uptime */}
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100/70 dark:from-purple-950/70 dark:to-indigo-950/60 border border-purple-200/90 dark:border-purple-800/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-2xs">
                                    <ShieldCheck size={16} className="stroke-[2.2]" />
                                </div>
                                <div>
                                    <div className="text-sm font-extrabold text-slate-900 dark:text-foreground">99.9%</div>
                                    <div className="text-[11px] text-slate-600 dark:text-slate-400">Uptime</div>
                                </div>
                            </div>
                        </div>

                        {/* CTA Buttons Row */}
                        <div className="flex flex-wrap items-center gap-4 mb-10 w-full sm:w-auto">
                            {user ? (
                                <Link
                                    to={ROUTES.CHAT.path}
                                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    <span>Go to Messages</span>
                                    <ArrowRight size={17} className="stroke-[2.5]" />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to={ROUTES.REGISTER.path}
                                        className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>Get Started Free</span>
                                        <ArrowRight size={17} className="stroke-[2.5]" />
                                    </Link>
                                    <Link
                                        to={ROUTES.LOGIN.path}
                                        className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-sm font-bold text-slate-800 dark:text-foreground bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-muted/80 shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center"
                                    >
                                        <span>Go to Messages</span>
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Platforms Download Badges Row */}
                        <div className="grid grid-cols-3 gap-3 w-full max-w-md pt-2">
                            {/* iOS App */}
                            <div className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-muted/50 transition-colors cursor-pointer group">
                                <svg className="h-6 w-6 text-slate-800 dark:text-foreground shrink-0 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 3.5c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.98.6-2.61 1.35-.55.63-1.03 1.66-.9 2.67 1 .08 2.02-.42 2.59-1.17z"/>
                                </svg>
                                <div className="min-w-0">
                                    <div className="text-[10px] font-bold text-slate-900 dark:text-foreground truncate">iOS App</div>
                                    <div className="text-[9px] text-slate-500 dark:text-muted-foreground truncate">On App Store</div>
                                </div>
                            </div>

                            {/* Android App */}
                            <div className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-muted/50 transition-colors cursor-pointer group">
                                <svg className="h-6 w-6 text-slate-800 dark:text-foreground shrink-0 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                    <path d="M3.6 2.3c-.3.3-.4.8-.4 1.4v16.6c0 .6.2 1.1.5 1.4l9.1-9.7-9.2-9.7zm11.5 8.1l2.4-2.5-12.7-7.2 10.3 9.7zm0 3.2l-10.3 9.7 12.7-7.2-2.4-2.5zm1.5-1.6l2.9 1.6c1.1.6 1.1 1.6 0 2.2l-2.9 1.6-2.3-2.7 2.3-2.7z"/>
                                </svg>
                                <div className="min-w-0">
                                    <div className="text-[10px] font-bold text-slate-900 dark:text-foreground truncate">Android App</div>
                                    <div className="text-[9px] text-slate-500 dark:text-muted-foreground truncate">On Google Play</div>
                                </div>
                            </div>

                            {/* Web App */}
                            <div className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-muted/50 transition-colors cursor-pointer group">
                                <Globe size={22} className="text-slate-800 dark:text-foreground shrink-0 group-hover:scale-110 transition-transform" />
                                <div className="min-w-0">
                                    <div className="text-[10px] font-bold text-slate-900 dark:text-foreground truncate">Web App</div>
                                    <div className="text-[9px] text-slate-500 dark:text-muted-foreground truncate">Use in Browser</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT COLUMN: DEVICE SHOWCASE MOCKUPS ───── */}
                    <div className="lg:col-span-7 flex items-center justify-center animate-in fade-in zoom-in-95 duration-700 delay-200">
                        <HeroVisualShowcase />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
