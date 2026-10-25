import { useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { 
    User, 
    Shield, 
    Lock, 
    Eye, 
    Bell, 
    Palette, 
    Globe, 
    Database, 
    HelpCircle, 
    Pencil, 
    Copy, 
    Check, 
    Camera, 
    ChevronDown, 
    ArrowLeft,
    Users,
    Moon,
    Sun
} from "lucide-react"

import { type RootState } from "@/redux/store"
import { ROUTES } from "@/constants/routes"
import { usePatchApi } from "@/hooks/api"
import { setUser } from "@/redux/slices/auth.slice"
import PrivacySettings from "./components/PrivacySettings"
import SecuritySettings from "./components/SecuritySettings"
import useToast from "@/hooks/toast"

type SettingsTab = 
    | "profile" 
    | "security" 
    | "privacy" 
    | "visibility" 
    | "notifications" 
    | "appearance" 
    | "language" 
    | "storage" 
    | "help"

const SettingsPage = () => {
    const navigate = useNavigate()
    const toast = useToast()
    const dispatch = useDispatch()
    const user = useSelector((state: RootState) => state.auth.user)

    const [activeTab, setActiveTab] = useState<SettingsTab>("privacy")
    const [copiedUsername, setCopiedUsername] = useState(false)
    const [copiedId, setCopiedId] = useState(false)
    const [isVisibilityOpen, setIsVisibilityOpen] = useState(false)
    const [isAppearanceOpen, setIsAppearanceOpen] = useState(false)

    const { mutate: updateSettings } = usePatchApi("/users/settings")

    const handleToggleFindByEmail = () => {
        const nextVal = user?.find_by_email_phone === false ? true : false
        updateSettings({ body: { find_by_email_phone: nextVal } }, {
            onSuccess: (res: any) => {
                if (res.data?.user) dispatch(setUser(res.data.user))
            }
        })
    }

    const handleToggleSearchDiscoverable = () => {
        const nextVal = user?.search_discoverable === false ? true : false
        updateSettings({ body: { search_discoverable: nextVal } }, {
            onSuccess: (res: any) => {
                if (res.data?.user) dispatch(setUser(res.data.user))
            }
        })
    }

    // User display details fallback
    const displayName = user?.name || "Tushar Vaghela"
    const displayUsername = user?.username ? `@${user.username}` : "@tusharvaghela"
    const userIdDisplay = user?.id ? `NX-9F73K-${user.id}D7H` : "NX-9F73K-2D7H"

    const handleCopyUsername = () => {
        navigator.clipboard.writeText(user?.username || "tusharvaghela")
        setCopiedUsername(true)
        setTimeout(() => setCopiedUsername(false), 2000)
        toast.success("Username copied to clipboard")
    }

    const handleCopyId = () => {
        navigator.clipboard.writeText(userIdDisplay)
        setCopiedId(true)
        setTimeout(() => setCopiedId(false), 2000)
        toast.success("User ID copied to clipboard")
    }

    const navTabs = [
        { id: "profile" as SettingsTab, label: "Profile", icon: User },
        { id: "security" as SettingsTab, label: "Security", icon: Shield },
        { id: "privacy" as SettingsTab, label: "Privacy", icon: Lock },
        { id: "visibility" as SettingsTab, label: "Account Visibility", icon: Eye },
        { id: "notifications" as SettingsTab, label: "Notifications", icon: Bell },
        { id: "appearance" as SettingsTab, label: "Appearance", icon: Palette },
        { id: "language" as SettingsTab, label: "Language", icon: Globe },
        { id: "storage" as SettingsTab, label: "Data & Storage", icon: Database },
        { id: "help" as SettingsTab, label: "Help & Support", icon: HelpCircle },
    ]

    const handleTabClick = (tabId: SettingsTab) => {
        setActiveTab(tabId)
        if (tabId === "profile") {
            navigate(ROUTES.PROFILE.path)
            return
        }
        if (tabId === "visibility") {
            setIsVisibilityOpen(true)
        }
        if (tabId === "appearance") {
            setIsAppearanceOpen(true)
        }
        const targetElement = document.getElementById(`section-${tabId}`)
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: "smooth", block: "start" })
        }
    }

    return (
        <div className="min-h-full bg-slate-50 dark:bg-[#090b16] text-slate-900 dark:text-slate-100 pb-24 pt-6 sm:pt-8 transition-colors">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                
                {/* Back button for mobile navigation */}
                <div className="mb-4 sm:mb-6 flex items-center justify-between lg:hidden">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                        <ArrowLeft size={14} />
                        <span>Back</span>
                    </button>
                    <span className="text-sm font-bold">Settings</span>
                </div>

                {/* Main 2-Column Responsive Layout matching Mockup */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* ── Left Sidebar Sub-Navigation Column ───────────────── */}
                    <aside className="lg:col-span-4 xl:col-span-3 space-y-6">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                Account Settings
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                Manage your account, security and privacy for a safer chatting experience.
                            </p>
                        </div>

                        {/* Navigation Tabs List */}
                        <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0 custom-scrollbar">
                            {navTabs.map((tab) => {
                                const Icon = tab.icon
                                const isActive = activeTab === tab.id

                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => handleTabClick(tab.id)}
                                        className={`flex items-center gap-3 px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer text-left ${
                                            isActive
                                                ? "bg-purple-100/90 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 shadow-2xs"
                                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                                        }`}
                                    >
                                        <Icon 
                                            size={18} 
                                            className={isActive ? "text-purple-600 dark:text-purple-400" : "text-slate-400"} 
                                        />
                                        <span>{tab.label}</span>
                                    </button>
                                )
                            })}
                        </nav>
                    </aside>

                    {/* ── Right Content Panels Column ─────────────────────── */}
                    <main className="lg:col-span-8 xl:col-span-9 space-y-6">
                        
                        {/* 1. Profile Banner Card */}
                        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 sm:p-7 shadow-sm transition-all">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
                                
                                {/* Avatar with Camera Badge */}
                                <div className="relative group shrink-0">
                                    <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-purple-600/20 border-2 border-white dark:border-slate-900">
                                        {user?.avatar ? (
                                            <img src={user.avatar} className="w-full h-full object-cover" />
                                        ) : (
                                            (displayName?.[0] || "U").toUpperCase()
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate(ROUTES.PROFILE.path)}
                                        className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-md transition-all active:scale-90 cursor-pointer border-2 border-white dark:border-slate-900"
                                        title="Change profile photo"
                                    >
                                        <Camera size={13} />
                                    </button>
                                </div>

                                {/* User Meta Info */}
                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                                            {displayName}
                                        </h2>
                                        <button
                                            type="button"
                                            onClick={() => navigate(ROUTES.PROFILE.path)}
                                            className="text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors p-1"
                                            title="Edit Profile"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                    </div>

                                    {/* Username with Copy */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                            {displayUsername}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleCopyUsername}
                                            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                            title="Copy username"
                                        >
                                            {copiedUsername ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                                        </button>
                                    </div>

                                    {/* Bio / Headline */}
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                                        Full Stack Developer | Building modern web experiences.
                                    </p>

                                    {/* Meta Badges Row */}
                                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                                        {/* Online Badge */}
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            <span>Online</span>
                                        </span>

                                        {/* Member Since */}
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                            <Users size={12} className="text-slate-400" />
                                            <span>Member since Oct 2024</span>
                                        </span>

                                        {/* User ID with Copy */}
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                            <span>ID: {userIdDisplay}</span>
                                            <button
                                                type="button"
                                                onClick={handleCopyId}
                                                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors ml-0.5"
                                                title="Copy User ID"
                                            >
                                                {copiedId ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Security Accordion Section */}
                        <SecuritySettings />

                        {/* 3. Privacy Accordion Section */}
                        <PrivacySettings />

                        {/* 4. Account Visibility Accordion Section */}
                        <div id="section-visibility" className="overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm transition-all">
                            <button
                                type="button"
                                onClick={() => setIsVisibilityOpen(!isVisibilityOpen)}
                                className="flex w-full items-center justify-between p-5 sm:p-6 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 text-left cursor-pointer"
                            >
                                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                                    <div className="flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shadow-2xs">
                                        <Eye size={20} className="stroke-[2.5]" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                                            Account Visibility
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                            Control who can find you and how your profile appears to others.
                                        </p>
                                    </div>
                                </div>
                                <ChevronDown
                                    size={20}
                                    className={`text-slate-400 transition-transform duration-300 flex-shrink-0 ml-2 ${isVisibilityOpen ? "rotate-180 text-purple-600 dark:text-purple-400" : ""}`}
                                />
                            </button>

                            {isVisibilityOpen && (
                                <div className="border-t border-slate-100 dark:border-slate-800/80 p-5 sm:p-7 pt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                    <div className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                                                Find me by email or phone
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                Allow users to locate your profile when searching your email address.
                                            </p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={user?.find_by_email_phone !== false}
                                            onChange={handleToggleFindByEmail}
                                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-purple-600 accent-purple-600 cursor-pointer"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                                                Public search inclusion
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                Show your profile in global member directories.
                                            </p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={user?.search_discoverable !== false}
                                            onChange={handleToggleSearchDiscoverable}
                                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-purple-600 accent-purple-600 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 5. Appearance Accordion Section */}
                        <div id="section-appearance" className="overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm transition-all">
                            <button
                                type="button"
                                onClick={() => setIsAppearanceOpen(!isAppearanceOpen)}
                                className="flex w-full items-center justify-between p-5 sm:p-6 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 text-left cursor-pointer"
                            >
                                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                                    <div className="flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shadow-2xs">
                                        <Palette size={20} className="stroke-[2.5]" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                                            Appearance
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                            Customize your interface theme, colors, and layout appearance.
                                        </p>
                                    </div>
                                </div>
                                <ChevronDown
                                    size={20}
                                    className={`text-slate-400 transition-transform duration-300 flex-shrink-0 ml-2 ${isAppearanceOpen ? "rotate-180 text-purple-600 dark:text-purple-400" : ""}`}
                                />
                            </button>

                            {isAppearanceOpen && (
                                <div className="border-t border-slate-100 dark:border-slate-800/80 p-5 sm:p-7 pt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        Choose your preferred viewing mode:
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 max-w-sm">
                                        <button
                                            type="button"
                                            onClick={() => document.documentElement.classList.remove("dark")}
                                            className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-bold hover:border-purple-400 cursor-pointer"
                                        >
                                            <Sun size={16} className="text-amber-500" />
                                            <span>Light mode</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => document.documentElement.classList.add("dark")}
                                            className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white text-xs font-bold hover:border-purple-500 cursor-pointer"
                                        >
                                            <Moon size={16} className="text-purple-400" />
                                            <span>Dark mode</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </main>
                </div>
            </div>
        </div>
    )
}

export default SettingsPage
