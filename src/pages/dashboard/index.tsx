import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { LogOut, User, ShieldCheck, Mail, Chrome } from "lucide-react";

import Button from "@/common/Button";
import Loader from "@/common/Loader";
import { useGetApi } from "@/hooks/api";
import { clearToken } from "@/redux/slices/auth.slice";
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
    suceess: boolean,
    message: string | null,
    error: string | null
    data: {
        user: UserProfile;
    }
}

const Dashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { data, isLoading } = useGetApi<MeResponse>("me", "/auth/me");

    const user = data?.data.user;

    const handleLogout = () => {
        dispatch(clearToken());
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
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

                    {/* Avatar strip */}
                    <div className="bg-blue-600 h-20 relative" />

                    <div className="px-6 pb-6">
                        <div className="flex items-end gap-4 -mt-10 mb-6">
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-20 h-20 rounded-xl border-4 border-white object-cover shadow-sm"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-xl border-4 border-white bg-blue-100 flex items-center justify-center shadow-sm">
                                    <User size={32} className="text-blue-600" />
                                </div>
                            )}
                            <div className="pb-1">
                                <h2 className="text-lg font-semibold text-gray-900">{user?.name}</h2>
                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${user?.is_online ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${user?.is_online ? "bg-green-500" : "bg-gray-400"}`} />
                                    {user?.is_online ? "Online" : "Offline"}
                                </span>
                            </div>
                        </div>

                        {/* Info rows */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Mail size={16} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium">Email address</p>
                                    <p className="text-sm text-gray-900 font-medium">{user?.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <ShieldCheck size={16} className="text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium">Auth method</p>
                                    <p className="text-sm text-gray-900 font-medium">
                                        {user?.google_id ? "Google OAuth 2.0" : "Email & Password"}
                                    </p>
                                </div>
                            </div>

                            {user?.google_id && (
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                    <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Chrome size={16} className="text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium">Google account linked</p>
                                        <p className="text-sm text-gray-900 font-medium">Connected</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                <div className="w-9 h-9 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <User size={16} className="text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium">User ID</p>
                                    <p className="text-sm text-gray-900 font-mono">#{user?.id}</p>
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
