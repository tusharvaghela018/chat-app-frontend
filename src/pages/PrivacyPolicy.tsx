import React from "react";
import { Shield, Lock, Trash2, Smartphone, KeyRound, ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate(ROUTES.HOME.path);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#090b16] text-slate-900 dark:text-slate-100 p-6 md:p-12 transition-colors relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute top-1/2 right-10 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto space-y-10">
                {/* Top Navigation */}
                <div>
                    <button 
                        type="button"
                        onClick={handleBack}
                        className="group inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-800 transition-all shadow-2xs cursor-pointer"
                    >
                        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                        <span>Go Back</span>
                    </button>
                </div>

                {/* Hero Header */}
                <header className="space-y-4 text-center max-w-xl mx-auto">
                    <div className="w-18 h-18 sm:w-20 sm:h-20 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-xl shadow-purple-600/25">
                        <Shield size={36} className="stroke-[2.2]" />
                    </div>
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/90 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/40 text-[11px] font-bold">
                            <span>Zero-Knowledge Security</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Privacy Policy & Terms
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            How NexusApp safeguards your identity, cryptographic keys, and communication privacy.
                        </p>
                    </div>
                </header>

                {/* Security Pillars Cards */}
                <section className="space-y-8">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <SecurityCard 
                            icon={<Lock size={22} className="text-purple-600 dark:text-purple-400" />}
                            badge="Cryptographic Standard"
                            title="End-to-End Encryption"
                            description="Your messages and media are encrypted with Curve25519 on your device before they ever reach our transport servers. Only you and your verified chat partners have keys to decrypt them."
                        />
                        <SecurityCard 
                            icon={<Smartphone size={22} className="text-emerald-600 dark:text-emerald-400" />}
                            badge="Client-Side Only"
                            title="Local Vault Storage (IndexedDB)"
                            description="Private keys are kept in your browser's private IndexedDB session storage. Secret keys are never transmitted over the network and never touch our databases."
                        />
                        <SecurityCard 
                            icon={<KeyRound size={22} className="text-amber-600 dark:text-amber-400" />}
                            badge="Zero-Knowledge"
                            title="Irreversible PIN Security"
                            description="Because we operate on a zero-knowledge architecture, we cannot recover or decrypt your PIN. If you forget your Chat PIN, previous encrypted message history cannot be restored."
                        />
                        <SecurityCard 
                            icon={<Trash2 size={22} className="text-rose-600 dark:text-rose-400" />}
                            badge="Instant Erasure"
                            title="Complete Data Deletion"
                            description="When you log out, reset your vault PIN, or choose to delete conversations, all cryptographic material and local message caches are immediately wiped from your device."
                        />
                    </div>

                    {/* Terms of Service & User Guidelines */}
                    <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-9 space-y-6 shadow-sm">
                        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <ShieldAlert size={20} className="text-purple-600 dark:text-purple-400" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                Security Responsibilities & Terms
                            </h3>
                        </div>

                        <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            <p>
                                By utilizing NexusApp, you acknowledge that you hold complete custody over your account's Chat PIN and encrypted communication keys. We have no mathematical or architectural backdoor to decrypt your conversations.
                            </p>
                            <p>
                                We do not profile users, sell metadata to third parties, or monitor private messages. The server only routes encrypted payloads and verifies identity through modern authentication protocols.
                            </p>
                        </div>

                        <div className="pt-2">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
                                Best Practices for Users
                            </h4>
                            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                                <li className="flex items-start gap-2.5">
                                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                                    <span>Choose a memorable, 6-digit or higher Chat PIN that you do not share with anyone.</span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                                    <span>Always log out when accessing NexusApp from public or shared computer terminals.</span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                                    <span>Enable Two-Factor Authentication (2FA) in Settings for an extra layer of defense.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Footer Back Button */}
                <footer className="flex justify-center pt-4 pb-8">
                    <button 
                        type="button"
                        onClick={handleBack}
                        className="px-8 py-3 rounded-full text-xs sm:text-sm font-bold text-white shadow-lg shadow-purple-600/25 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-600/40 transition-all cursor-pointer active:scale-95"
                    >
                        Return to Application
                    </button>
                </footer>
            </div>
        </div>
    );
};

const SecurityCard = ({ 
    icon, 
    badge,
    title, 
    description 
}: { 
    icon: React.ReactNode;
    badge: string;
    title: string; 
    description: string;
}) => (
    <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-6 space-y-3.5 shadow-sm hover:border-purple-300 dark:hover:border-purple-800 transition-all">
        <div className="flex items-center justify-between gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner">
                {icon}
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                {badge}
            </span>
        </div>
        <div className="space-y-1.5">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
        </div>
    </div>
);

export default PrivacyPolicy;
