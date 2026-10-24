import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { ROUTES } from "@/constants/routes";

export const HomePricingSection: React.FC = () => {
    const [yearly, setYearly] = useState(false);

    const plans = [
        {
            name: "Personal",
            tagline: "Ideal for friends, family, and direct secure messaging.",
            price: "$0",
            period: "forever free",
            popular: false,
            features: [
                "End-to-end encrypted 1:1 direct messaging",
                "Unlimited encrypted group chats up to 100 members",
                "HD voice notes & audio streaming",
                "Emoji reactions & message receipts",
                "Multi-device sync across Web & Mobile",
                "Zero ads, zero data tracking"
            ],
            buttonText: "Get Started Free",
            buttonLink: ROUTES.REGISTER.path,
            buttonVariant: "outline"
        },
        {
            name: "Pro & Communities",
            tagline: "Supercharged features for growing creator communities & teams.",
            price: yearly ? "$6" : "$8",
            period: "per user / month",
            popular: true,
            features: [
                "Everything in Personal",
                "Large groups with up to 10,000 members",
                "Role-based governance & member permissions",
                "Admin activity audit logs & moderation tools",
                "Priority WebSocket relay routing (ultra-low latency)",
                "Custom emoji packs & community invite vanity links",
                "Dedicated 24/7 technical support"
            ],
            buttonText: "Upgrade to Pro",
            buttonLink: ROUTES.REGISTER.path,
            buttonVariant: "primary"
        }
    ];

    return (
        <section id="pricing" className="py-24 relative overflow-hidden bg-background border-t border-border/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-xs font-bold text-purple-700 dark:text-purple-300 mb-4 uppercase tracking-wider">
                        <Sparkles size={13} /> Transparent Pricing
                    </div>
                    <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
                        Simple, honest plans for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 dark:from-indigo-400 dark:via-purple-400 dark:to-blue-400">everyone</span>.
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
                        Start completely free without any credit card. Upgrade whenever your team or community needs enterprise scale.
                    </p>

                    {/* Billing Toggle */}
                    <div className="mt-8 inline-flex items-center gap-3 p-1 rounded-2xl bg-muted/70 border border-border">
                        <button
                            type="button"
                            onClick={() => setYearly(false)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                !yearly ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            Monthly Billing
                        </button>
                        <button
                            type="button"
                            onClick={() => setYearly(true)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                yearly ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <span>Yearly Billing</span>
                            <span className="px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 text-[10px] font-extrabold">
                                Save 25%
                            </span>
                        </button>
                    </div>
                </div>

                {/* 2-Card Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
                    {plans.map((plan, i) => (
                        <div
                            key={i}
                            className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
                                plan.popular
                                    ? "bg-card border-2 border-purple-500 shadow-2xl shadow-purple-500/10 ring-1 ring-purple-500/20"
                                    : "bg-card border border-border/80 shadow-md hover:shadow-xl"
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[11px] font-bold uppercase tracking-wider shadow-md">
                                    Most Popular
                                </div>
                            )}

                            <div>
                                <h3 className="font-display font-bold text-xl text-foreground mb-1">{plan.name}</h3>
                                <p className="text-xs text-muted-foreground mb-6 leading-relaxed">{plan.tagline}</p>

                                <div className="flex items-baseline gap-1.5 mb-6">
                                    <span className="font-display text-4xl sm:text-5xl font-extrabold text-foreground">{plan.price}</span>
                                    <span className="text-xs text-muted-foreground font-medium">{plan.period}</span>
                                </div>

                                <div className="space-y-3 pt-6 border-t border-border/60">
                                    {plan.features.map((feat, fIdx) => (
                                        <div key={fIdx} className="flex items-start gap-2.5 text-xs text-foreground">
                                            <div className="h-4 w-4 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                                                <Check size={11} strokeWidth={3} />
                                            </div>
                                            <span>{feat}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-8 pt-4">
                                <Link
                                    to={plan.buttonLink}
                                    className={`w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                                        plan.popular
                                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35"
                                            : "border border-border bg-muted/40 hover:bg-muted text-foreground"
                                    }`}
                                >
                                    <span>{plan.buttonText}</span>
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HomePricingSection;
