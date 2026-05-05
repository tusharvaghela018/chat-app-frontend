import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
    MessageSquare, LayoutDashboard, LogOut,
    ChevronDown, ShieldCheck, Bell,
    Home, Menu, X, User as UserIcon
} from "lucide-react";
import { getUser, clearAuth } from "@/redux/slices/auth.slice";
import { ROUTES } from "@/constants/routes";
import ThemeToggle from "@/common/ThemeToggle";
import { clearLocalSecrets } from "@/utils/indexeddb";

const NAV_LINKS = [
    { to: ROUTES.HOME.path, icon: <Home size={18} />, label: 'Home' },
    { to: ROUTES.DASHBOARD.path, icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { to: ROUTES.CHAT.path, icon: <MessageSquare size={18} />, label: "Messages" },
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
            if (dropRef.current && !dropRef.current.contains(e.target as Node))
                setIsProfileOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    const logout = async () => {
        await clearLocalSecrets();
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
        <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link to={ROUTES.HOME.path} className="flex items-center gap-2 transition-opacity hover:opacity-90">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                        <ShieldCheck size={20} />
                    </div>
                    <span className="hidden font-display text-xl font-bold tracking-tight text-foreground sm:block">
                        NexusApp
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden items-center gap-1 md:flex">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                                location.pathname === link.to
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            }`}
                        >
                            {link.icon}
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="hidden sm:block">
                        <ThemeToggle />
                    </div>
                    
                    <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                        <Bell size={18} />
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full border-2 border-background bg-primary" />
                    </button>

                    {/* Profile Dropdown */}
                    <div className="relative" ref={dropRef}>
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-2 rounded-xl border bg-background p-1 pr-3 transition-all hover:bg-accent"
                        >
                            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary to-purple-600 font-display text-xs font-bold text-white shadow-inner">
                                {showAvatar ? (
                                    <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" onError={() => setImgError(true)} />
                                ) : (
                                    initials
                                )}
                            </div>
                            <span className="hidden max-w-[100px] truncate text-sm font-medium text-foreground lg:block">
                                {user?.name ?? "User"}
                            </span>
                            <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border bg-popover p-2 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
                                <div className="px-3 py-3 border-b mb-1">
                                    <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                                    <div className="mt-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                        Online
                                    </div>
                                </div>
                                
                                <Link
                                    to={ROUTES.PROFILE.path}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                                    onClick={() => setIsProfileOpen(false)}
                                >
                                    <UserIcon size={16} />
                                    My Profile
                                </Link>
                                
                                <div className="sm:hidden">
                                    <ThemeToggle />
                                </div>

                                <button
                                    onClick={logout}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                                >
                                    <LogOut size={16} />
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
                    >
                        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
                <div className="border-t bg-background px-4 py-4 md:hidden animate-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-col gap-2">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-all ${
                                    location.pathname === link.to
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                }`}
                            >
                                {link.icon}
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
}
