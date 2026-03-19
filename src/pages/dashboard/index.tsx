import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { LogOut, User, ShieldCheck, Mail, Chrome } from "lucide-react";

import Button from "@/common/Button";
import Loader from "@/common/Loader";
import { useGetApi } from "@/hooks/api";
import { clearAuth } from "@/redux/slices/auth.slice";
import { ROUTES } from "@/constants/routes";

interface UserProfile {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    google_id?: string;
    is_online: boolean;
}

interface MeResponse {
    user: UserProfile;
}

const Dashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { data, isLoading } = useGetApi<MeResponse>("me", "/auth/me");
    console.log(data)

    const user = data?.data?.user;

    const handleLogout = () => {
        dispatch(clearAuth());
        navigate(ROUTES.LOGIN.path);
    };

    if (isLoading) {
        return <Loader fullScreen size="lg" />;
    }

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Top bar */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <ShieldCheck size={18} className="text-white" />
                    </div>
                    <span className="font-semibold text-gray-900">AuthApp</span>
                </div>
                <Button
                    color="red"
                    leftIcon={<LogOut size={15} />}
                    onClick={handleLogout}
                    className="!bg-white !text-red-600 border border-red-200 hover:!bg-red-50"
                >
                    Logout
                </Button>
            </header>

            {/* Content */}
            <main className="max-w-2xl mx-auto px-4 py-12">

                {/* Welcome */}
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
                    </h1>
                    <p className="text-gray-500 mt-1">You're successfully authenticated.</p>
                </div>

                {/* Profile card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

                    {/* Header gradient */}
                    <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-500" />

                    <div className="px-6 pb-6">

                        {/* Avatar + Name */}
                        <div className="flex items-center gap-4 -mt-12 mb-6">
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-24 h-24 rounded-2xl border-4 border-white object-cover shadow-md"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-2xl border-4 border-white bg-blue-100 flex items-center justify-center shadow-md">
                                    <User size={36} className="text-blue-600" />
                                </div>
                            )}

                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>

                                <span className={`inline-flex items-center gap-2 mt-1 text-xs font-medium px-3 py-1 rounded-full 
                    ${user?.is_online ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                    <span className={`w-2 h-2 rounded-full 
                        ${user?.is_online ? "bg-green-500" : "bg-gray-400"}`} />
                                    {user?.is_online ? "Online" : "Offline"}
                                </span>
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="grid gap-4">

                            {/* Email */}
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Mail size={18} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Email</p>
                                    <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                                </div>
                            </div>

                            {/* Auth */}
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <ShieldCheck size={18} className="text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Authentication</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {user?.google_id ? "Google OAuth" : "Email & Password"}
                                    </p>
                                </div>
                            </div>

                            {/* Google */}
                            {user?.google_id && (
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                        <Chrome size={18} className="text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Google Account</p>
                                        <p className="text-sm font-medium text-gray-900">Connected</p>
                                    </div>
                                </div>
                            )}

                            {/* User ID */}
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <User size={18} className="text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">User ID</p>
                                    <p className="text-sm font-mono text-gray-900">#{user?.id}</p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* JWT info note */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-700">
                        <span className="font-semibold">JWT token active.</span> Your session is stored in Redux with persistence. The token is automatically attached to every API request via the Axios interceptor.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
