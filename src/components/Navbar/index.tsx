import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
    MessageSquare, LogOut,
    ChevronDown, ShieldCheck, Bell,
    Home, Menu, X, User as UserIcon,
    Settings as SettingsIcon
} from "lucide-react";
import { getUser, clearAuth } from "@/redux/slices/auth.slice";
import { ROUTES } from "@/constants/routes";
import ThemeToggle from "@/common/ThemeToggle";
import { clearLocalSecrets } from "@/utils/indexeddb";
import { clearSessionKeys } from "@/utils/crypto";
import axiosInstance from "@/api/axios";

const NAV_LINKS = [
    { to: ROUTES.HOME.path, icon: Home, label: "Home" },
    { to: ROUTES.CHAT.path, icon: MessageSquare, label: "Messages" },
    { to: ROUTES.SETTINGS.path, icon: SettingsIcon, label: "Settings" },
];

export default function Navbar() {
    const user = useSelector(getUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    
    const dropRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMenuOpen(false);
        setIsProfileOpen(false);
    }, [location.pathname]);

    const logout = async () => {
        try {
            await axiosInstance.post("/auth/logout");
        } catch {
            // Ignore error if already logged out
        }
        await clearLocalSecrets();
        clearSessionKeys();
        dispatch(clearAuth());
        navigate("/");
    };

    const initials = user?.name 
        ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
        : "U";

    const [imgError, setImgError] = useState(false);
    useEffect(() => setImgError(false), [user?.avatar]);
    const showAvatar = user?.avatar && user.avatar !== "null" && !imgError;

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#090b16]/80 backdrop-blur-xl transition-colors">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                
                {/* Brand Logo */}
                <Link 
                    to={ROUTES.HOME.path} 
                    className="flex items-center gap-2.5 transition-all hover:opacity-95 group cursor-pointer"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 group-hover:scale-105 transition-transform">
                        <ShieldCheck size={20} className="stroke-[2.3]" />
                    </div>
                    <span className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        NexusApp
                    </span>
                </Link>

                {/* Desktop Navigation Links */}
                <div className="hidden items-center gap-1.5 md:flex">
                    {NAV_LINKS.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.to;

                        return (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                                    isActive
                                        ? "bg-purple-100/90 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 shadow-2xs font-bold"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                                }`}
                            >
                                <Icon size={16} className={isActive ? "text-purple-600 dark:text-purple-400" : "text-slate-400"} />
                                <span>{link.label}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* Right Action Icons & Profile Trigger */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden sm:block">
                        <ThemeToggle />
                    </div>
                    
                    {/* Notifications Button */}
                    <button 
                        type="button"
                        title="Notifications"
                        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 shadow-2xs cursor-pointer"
                    >
                        <Bell size={16} />
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-purple-600 ring-2 ring-white dark:ring-slate-900" />
                    </button>

                    {/* Profile Dropdown Menu Trigger */}
                    <div className="relative" ref={dropRef}>
                        <button
                            type="button"
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-2.5 rounded-full border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 pr-3.5 transition-all hover:border-purple-300 dark:hover:border-purple-800 shadow-2xs cursor-pointer"
                        >
                            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 font-display text-xs font-bold text-white shadow-sm ring-1 ring-white dark:ring-slate-800">
                                {showAvatar ? (
                                    <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" onError={() => setImgError(true)} />
                                ) : (
                                    initials
                                )}
                            </div>
                            <span className="hidden max-w-[110px] truncate text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 lg:block">
                                {user?.name ?? "User"}
                            </span>
                            <ChevronDown 
                                size={14} 
                                className={`text-slate-400 transition-transform duration-200 ${isProfileOpen ? "rotate-180 text-purple-600" : ""}`} 
                            />
                        </button>

                        {/* Floating Profile Dropdown Card */}
                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-2.5 shadow-2xl shadow-purple-500/10 animate-in fade-in zoom-in-95 duration-150 z-50">
                                
                                {/* User Mini Header */}
                                <div className="px-3 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
                                            {showAvatar ? (
                                                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" onError={() => setImgError(true)} />
                                            ) : (
                                                initials
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                {user?.name}
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                @{user?.username || "user"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>Encrypted & Online</span>
                                    </div>
                                </div>
                                
                                {/* Dropdown Menu Links */}
                                <div className="space-y-0.5">
                                    <Link
                                        to={ROUTES.PROFILE.path}
                                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-300"
                                        onClick={() => setIsProfileOpen(false)}
                                    >
                                        <UserIcon size={15} className="text-slate-400" />
                                        <span>My Profile</span>
                                    </Link>

                                    <Link
                                        to={ROUTES.SETTINGS.path}
                                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-300"
                                        onClick={() => setIsProfileOpen(false)}
                                    >
                                        <SettingsIcon size={15} className="text-slate-400" />
                                        <span>Account Settings</span>
                                    </Link>
                                </div>

                                <div className="sm:hidden px-3 py-2 border-t border-slate-100 dark:border-slate-800 my-1">
                                    <ThemeToggle />
                                </div>

                                <div className="border-t border-slate-100 dark:border-slate-800/80 mt-1.5 pt-1.5">
                                    <button
                                        type="button"
                                        onClick={logout}
                                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                                    >
                                        <LogOut size={15} />
                                        <span>Sign out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Toggle Button */}
                    <button
                        type="button"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden shadow-2xs"
                    >
                        {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {isMenuOpen && (
                <div className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#090b16]/95 backdrop-blur-xl px-4 py-4 md:hidden animate-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-col gap-1.5">
                        {NAV_LINKS.map((link) => {
                            const Icon = link.icon;
                            const isActive = location.pathname === link.to;

                            return (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all ${
                                        isActive
                                            ? "bg-purple-100/90 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                                    }`}
                                >
                                    <Icon size={18} className={isActive ? "text-purple-600" : "text-slate-400"} />
                                    <span>{link.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </nav>
    );
}
