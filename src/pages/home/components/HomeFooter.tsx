import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import NexusLogo from "./NexusLogo";

export const HomeFooter: React.FC = () => {
    return (
        <footer className="w-full bg-background border-t border-border/80 pt-16 pb-12 text-sm text-muted-foreground select-none">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-border/60">
                    {/* Brand Info (2 cols) */}
                    <div className="lg:col-span-2 space-y-4">
                        <NexusLogo size="md" />
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed">
                            A modern, real-time encrypted messaging experience with powerful features for individuals, teams, and thriving communities.
                        </p>
                        <div className="flex items-center gap-2 pt-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-semibold text-foreground">
                                All systems operational · 99.9% uptime
                            </span>
                        </div>
                    </div>

                    {/* Links: Product */}
                    <div>
                        <h4 className="font-display font-bold text-xs uppercase tracking-wider text-foreground mb-4">
                            Product
                        </h4>
                        <ul className="space-y-2.5 text-xs">
                            <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                            <li><a href="#security" className="hover:text-foreground transition-colors">End-to-End Encryption</a></li>
                            <li><Link to={ROUTES.CHAT.path} className="hover:text-foreground transition-colors">Web App</Link></li>
                            <li><a href="#faq" className="hover:text-foreground transition-colors">Help Center & FAQ</a></li>
                        </ul>
                    </div>

                    {/* Links: Security */}
                    <div>
                        <h4 className="font-display font-bold text-xs uppercase tracking-wider text-foreground mb-4">
                            Trust & Safety
                        </h4>
                        <ul className="space-y-2.5 text-xs">
                            <li><a href="#security" className="hover:text-foreground transition-colors">Zero-Knowledge Proofs</a></li>
                            <li><Link to={ROUTES.PRIVACY_POLICY.path} className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                            <li><span className="text-muted-foreground/80">Device Key Storage</span></li>
                            <li><span className="text-muted-foreground/80">Cryptographic Relay</span></li>
                        </ul>
                    </div>

                    {/* Links: Connect */}
                    <div>
                        <h4 className="font-display font-bold text-xs uppercase tracking-wider text-foreground mb-4">
                            Support & Code
                        </h4>
                        <ul className="space-y-2.5 text-xs">
                            <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
                            <li><Link to={ROUTES.CHAT.path} className="hover:text-foreground transition-colors">Start Chatting</Link></li>
                            <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">GitHub <ArrowUpRight size={11} /></a></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Legal / Copyright */}
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                    <p>© {new Date().getFullYear()} NexusApp. All rights reserved. Built with cryptographic privacy in mind.</p>
                    <div className="flex items-center gap-4 text-xs">
                        <Link to={ROUTES.PRIVACY_POLICY.path} className="hover:text-foreground transition-colors">Privacy Policy</Link>
                        <span>·</span>
                        <a href="#security" className="hover:text-foreground transition-colors">Security Whitepaper</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default HomeFooter;
