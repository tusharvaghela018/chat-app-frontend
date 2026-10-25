import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowRight, Menu, X, Sun, Moon, MessageSquare, User as UserIcon } from "lucide-react";

import { getUser } from "@/redux/slices/auth.slice";
import { ROUTES } from "@/constants/routes";
import { useTheme } from "@/common/ThemeProvider";
import NexusLogo from "./NexusLogo";

export const HomeNavbar: React.FC = () => {
    const user = useSelector(getUser);
    const { theme, toggleTheme } = useTheme();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Full navigation definitions preserved for future release; currently displaying active features
    const allNavLinks = [
        { label: "Features", href: "#features", active: true },
        { label: "Security", href: "#security", active: true },
        { label: "Community", href: "#community", active: false }, // Preserved for future community launch
        { label: "Pricing", href: "#pricing", active: false },     // Preserved for future pricing launch
        { label: "Support", href: "#faq", active: true },
    ];
    const navLinks = allNavLinks.filter((link) => link.active);

    const scrollTo = (href: string) => {
        setMobileOpen(false);
        const el = document.querySelector(href);
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrolled
                    ? "bg-background/85 backdrop-blur-xl border-b border-border/60 shadow-xs py-3"
                    : "bg-transparent py-5"
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    {/* Brand Logo */}
                    <NexusLogo size="md" />

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <button
                                key={link.label}
                                onClick={() => scrollTo(link.href)}
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            >
                                {link.label}
                            </button>
                        ))}
                    </nav>

                    {/* Right Action Controls */}
                    <div className="hidden sm:flex items-center gap-3">
                        {/* Theme Toggle Button */}
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 border border-border/50 cursor-pointer"
                            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
                            aria-label="Toggle theme"
                        >
                            {theme === "light" ? (
                                <Sun size={18} className="text-amber-500 animate-in zoom-in duration-200" />
                            ) : (
                                <Moon size={18} className="text-indigo-400 animate-in zoom-in duration-200" />
                            )}
                        </button>

                        {/* Sign In / Auth status */}
                        {user ? (
                            <Link
                                to={ROUTES.PROFILE.path}
                                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-muted/80 transition-colors"
                            >
                                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase overflow-hidden">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                                    ) : (
                                        user.name?.[0] || <UserIcon size={13} />
                                    )}
                                </div>
                                <span className="max-w-28 truncate">{user.name}</span>
                            </Link>
                        ) : (
                            <Link
                                to={ROUTES.LOGIN.path}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-muted/70 transition-colors"
                            >
                                Sign in
                            </Link>
                        )}

                        {/* Primary CTA Button: Go to Messages */}
                        <Link
                            to={user ? ROUTES.CHAT.path : ROUTES.REGISTER.path}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <span>Go to Messages</span>
                            <ArrowRight size={16} className="stroke-[2.5]" />
                        </Link>
                    </div>

                    {/* Mobile Hamburger Button */}
                    <div className="flex sm:hidden items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="h-9 w-9 flex items-center justify-center rounded-lg bg-muted text-muted-foreground"
                            aria-label="Toggle theme"
                        >
                            {theme === "light" ? <Sun size={17} className="text-amber-500" /> : <Moon size={17} className="text-indigo-400" />}
                        </button>
                        <button
                            type="button"
                            onClick={() => setMobileOpen((prev) => !prev)}
                            className="p-2 rounded-xl bg-muted/60 text-foreground"
                            aria-label="Open menu"
                        >
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Drawer Menu */}
                {mobileOpen && (
                    <div className="sm:hidden mt-3 p-4 rounded-2xl bg-card/95 backdrop-blur-2xl border border-border shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
                        <div className="flex flex-col space-y-3 pb-3 border-b border-border/60">
                            {navLinks.map((link) => (
                                <button
                                    key={link.label}
                                    onClick={() => scrollTo(link.href)}
                                    className="text-left py-2 px-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                                >
                                    {link.label}
                                </button>
                            ))}
                        </div>

                        <div className="pt-3 flex flex-col gap-2">
                            {user ? (
                                <Link
                                    to={ROUTES.CHAT.path}
                                    onClick={() => setMobileOpen(false)}
                                    className="w-full py-2.5 rounded-xl text-center text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2"
                                >
                                    <MessageSquare size={16} /> Open Chat
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to={ROUTES.REGISTER.path}
                                        onClick={() => setMobileOpen(false)}
                                        className="w-full py-2.5 rounded-xl text-center text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2"
                                    >
                                        Get Started Free <ArrowRight size={16} />
                                    </Link>
                                    <Link
                                        to={ROUTES.LOGIN.path}
                                        onClick={() => setMobileOpen(false)}
                                        className="w-full py-2.5 rounded-xl text-center text-sm font-semibold border border-border text-foreground hover:bg-muted"
                                    >
                                        Sign In
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default HomeNavbar;
