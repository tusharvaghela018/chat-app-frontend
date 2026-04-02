import { 
    MessageSquare, 
    Users, 
    TrendingUp, 
    Clock, 
    ShieldCheck,
    Bell
} from "lucide-react";
import { useSelector } from "react-redux";
import { getUser } from "@/redux/slices/auth.slice";
import Button from "@/common/Button";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { useGetApi } from "@/hooks/api";
import type { IUser, IGroup } from "@/types";
import { formatRelativeTime } from "@/utils/date";

function Dashboard() {
    const user = useSelector(getUser);

    const { data: dashboardData } = useGetApi<{ 
        stats: { last_login: string, notifications: number, messages: number, active_chats: number },
        activities: Array<{ id: string, user: string, action: string, time: string, type: string }>
    }>("/dashboard");
    const { data: usersData } = useGetApi<{ users: IUser[], count: number }>("/users", { limit: 1 });
    const { data: groupsData } = useGetApi<{ groups: IGroup[], count: number }>("/groups", { limit: 1 });

    const liveStats = {
        total_messages: dashboardData?.data?.stats?.messages || 0,
        active_chats: dashboardData?.data?.stats?.active_chats || (usersData?.data?.count || 0) + (groupsData?.data?.count || 0),
        notifications: dashboardData?.data?.stats?.notifications || 0,
        uptime: "99.9%",
        security_score: "A+"
    };

    const STATS = [
        { label: "Total Messages", value: liveStats.total_messages.toLocaleString(), icon: <MessageSquare className="text-blue-500" />, change: "Lifetime" },
        { label: "Active Chats", value: liveStats.active_chats.toLocaleString(), icon: <Users className="text-purple-500" />, change: "Current" },
        { label: "New Alerts", value: liveStats.notifications.toLocaleString(), icon: <Bell className={`text-yellow-500 ${liveStats.notifications > 0 ? 'animate-bounce' : ''}`} />, change: liveStats.notifications > 0 ? "Action needed" : "All clear" },
        { label: "Security Score", value: liveStats.security_score, icon: <ShieldCheck className="text-green-500" />, change: "Top Tier" },
    ];

    const RECENT_ACTIVITY = (dashboardData?.data?.activities || []).map(activity => ({
        id: activity.id,
        user: activity.user,
        action: activity.action,
        time: formatRelativeTime(activity.time),
        icon: activity.type === 'message' ? <MessageSquare size={14} /> : <Users size={14} />
    }));

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                        Welcome back, {user?.name?.split(' ')[0] || 'User'}!
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Here's what's happening with your account today.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link to={ROUTES.CHAT.path}>
                        <Button variant="outline" className="rounded-xl">View Messages</Button>
                    </Link>
                    <Button variant="primary" className="rounded-xl shadow-lg shadow-primary/20">
                        New Message
                    </Button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {STATS.map((stat) => (
                    <div key={stat.label} className="group rounded-2xl border bg-card p-6 transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <div className="rounded-xl bg-muted p-2.5 transition-colors group-hover:bg-primary/10">
                                {stat.icon}
                            </div>
                            <span className={`text-xs font-bold ${stat.change.startsWith('+') ? 'text-green-500' : 'text-muted-foreground'}`}>
                                {stat.change}
                            </span>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                            <h3 className="mt-1 font-display text-2xl font-bold text-foreground">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Main Content Area */}
                <div className="lg:col-span-2">
                    <div className="rounded-2xl border bg-card overflow-hidden">
                        <div className="border-b bg-muted/30 px-6 py-4">
                            <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                                <TrendingUp size={18} className="text-primary" />
                                Growth Overview
                            </h3>
                        </div>
                        <div className="flex h-64 items-center justify-center p-6">
                            <div className="text-center">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <TrendingUp size={24} />
                                </div>
                                <p className="mt-4 text-sm font-medium text-foreground">Analytics integration coming soon</p>
                                <p className="text-xs text-muted-foreground">Your chat engagement trends will appear here.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Area */}
                <div className="flex flex-col gap-8">
                    <div className="rounded-2xl border bg-card overflow-hidden">
                        <div className="border-b bg-muted/30 px-6 py-4">
                            <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                                <Clock size={18} className="text-primary" />
                                Recent Activity
                            </h3>
                        </div>
                        <div className="divide-y">
                            {RECENT_ACTIVITY.length > 0 ? (
                                RECENT_ACTIVITY.map((activity) => (
                                    <div key={activity.id} className="flex gap-4 p-4 transition-colors hover:bg-muted/50">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            {activity.icon}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground">
                                                <span className="font-bold">{activity.user}</span> {activity.action}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center">
                                    <p className="text-sm text-muted-foreground">No recent activity found.</p>
                                </div>
                            )}
                        </div>
                        <div className="border-t p-3 text-center">
                            <button className="text-xs font-semibold text-primary hover:underline">View all activity</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;