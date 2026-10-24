import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export const HomeFAQSection: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqs = [
        {
            q: "How does End-to-End Encryption work in NexusApp?",
            a: "When you register, your browser or device creates a public/private cryptographic keypair using TweetNaCl. Your private key never leaves your device storage. When you send a message, it is encrypted using the recipient's public key into unreadable ciphertext. Even if intercepted on the server, nobody can decrypt it without the corresponding private key."
        },
        {
            q: "Can I use NexusApp across both my phone and computer?",
            a: "Yes! NexusApp is engineered with seamless multi-device cryptographic sync. You can use NexusApp in any modern browser on your desktop/laptop and synchronize conversations smoothly."
        },
        {
            q: "How many members can join an encrypted group chat?",
            a: "On the free Personal plan, groups support up to 100 members with instant pairwise encrypted messaging and live role management (Admin, Member). Pro plans support large communities of up to 10,000 members."
        },
        {
            q: "Are message reactions and voice notes also encrypted?",
            a: "Yes. Every message payload — including voice notes, media file attachments, and emoji reactions — is encrypted client-side using authenticated cryptographic envelopes before transmission."
        },
        {
            q: "Is there any phone number or personal tracking required?",
            a: "No! NexusApp values your anonymity. You only need a username and password (or Google OAuth 2.0). We do not require your phone number, nor do we track your location or sell user analytics."
        }
    ];

    const toggle = (idx: number) => {
        setOpenIndex(openIndex === idx ? null : idx);
    };

    return (
        <section id="faq" className="py-24 relative overflow-hidden bg-muted/20 border-t border-border/60">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-xs font-bold text-purple-700 dark:text-purple-300 mb-4 uppercase tracking-wider">
                        <HelpCircle size={13} /> Frequently Asked Questions
                    </div>
                    <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                        Everything you need to know about NexusApp.
                    </h2>
                </div>

                {/* FAQ Accordion List */}
                <div className="space-y-4">
                    {faqs.map((faq, idx) => {
                        const isOpen = openIndex === idx;
                        return (
                            <div
                                key={idx}
                                className="rounded-2xl border border-border/80 bg-card overflow-hidden transition-all duration-200"
                            >
                                <button
                                    type="button"
                                    onClick={() => toggle(idx)}
                                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-display font-bold text-sm sm:text-base text-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
                                >
                                    <span>{faq.q}</span>
                                    <ChevronDown
                                        size={18}
                                        className={`shrink-0 text-muted-foreground transition-transform duration-300 ${
                                            isOpen ? "rotate-180 text-purple-600 dark:text-purple-400" : ""
                                        }`}
                                    />
                                </button>
                                {isOpen && (
                                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 animate-in fade-in duration-200">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default HomeFAQSection;
