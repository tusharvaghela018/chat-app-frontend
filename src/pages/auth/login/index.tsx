import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Loader2, MessageSquare, Send } from "lucide-react";
import { useDispatch } from "react-redux";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";

import Input from "@/common/Input";
import { usePostApi } from "@/hooks/api";
import { setUser } from "@/redux/slices/auth.slice";
import { ROUTES } from "@/constants/routes";
import ForgotPasswordModal from "./components/ForgotPasswordModal";
import axiosInstance from "@/api/axios";

interface LoginForm {
    email: string;
    password: string;
}

interface LoginResponse {
    token?: string;
    requires_2fa?: boolean;
    user: {
        id: number;
        name: string;
        username: string;
        email: string;
        is_online: boolean;
        avatar?: string;
        public_key?: string;
        encrypted_vault?: string;
        vault_salt?: string;
    };
}

const loginSchema = yup.object({
    email: yup
        .string()
        .required("Email is required")
        .email("Enter a valid email"),
    password: yup
        .string()
        .required("Password is required")
        .min(6, "Minimum 6 characters"),
});

const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [keepSignedIn, setKeepSignedIn] = useState(true);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
    } = useForm<LoginForm>({
        resolver: yupResolver(loginSchema),
    });

    const { mutate: login, isPending } = usePostApi<LoginResponse, LoginForm>(
        "/auth/login",
        {
            onSuccess: (response) => {
                if (response.data?.requires_2fa) {
                    navigate(`${ROUTES.VERIFY_2FA.path}?token=${response.data.token}`);
                    return;
                }
                const { id, name, username, email, avatar, is_online, public_key, encrypted_vault, vault_salt } = { ...response.data?.user };
                const userData = {
                    id: Number(id),
                    name: String(name),
                    username: String(username),
                    email: String(email),
                    avatar: String(avatar),
                    is_online: is_online || false,
                    public_key,
                    encrypted_vault,
                    vault_salt,
                };
                dispatch(setUser(userData));
                navigate(ROUTES.CHAT.path);
            },
            onError: (error) => {
                const message = axios.isAxiosError(error)
                    ? error.response?.data?.message || "Invalid email or password"
                    : "Invalid email or password";
                setError("root", { message });
            },
        }
    );

    const handleGoogleLogin = () => {
        window.location.href = `${axiosInstance.defaults.baseURL}/auth/google`;
    };

    return (
        <div className="min-h-screen relative flex flex-col justify-between bg-[#080716] text-white selection:bg-purple-600 selection:text-white overflow-hidden">
            {/* Ambient Background Glowing Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] rounded-full bg-purple-700/20 blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-700/20 blur-[160px] pointer-events-none" />
            <div className="absolute top-[40%] right-[20%] w-[350px] h-[350px] rounded-full bg-purple-500/10 blur-[130px] pointer-events-none" />

            {/* Top Navigation Bar */}
            <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-purple-600/30">
                        N
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-lg tracking-tight text-white">NexusApp</span>
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                        </div>
                        <p className="text-[11px] text-purple-200/60 hidden sm:block tracking-wide">
                            Connect • Chat • Collaborate
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 hidden sm:inline">New to NexusApp?</span>
                    <Link
                        to={ROUTES.REGISTER.path}
                        className="px-4 py-1.5 rounded-full border border-purple-500/40 text-purple-200 text-xs font-semibold hover:bg-purple-500/15 hover:border-purple-400 transition-all cursor-pointer shadow-xs"
                    >
                        Sign up
                    </Link>
                </div>
            </header>

            {/* Floating Decorative Elements (Desktop View) */}
            <div className="hidden lg:block absolute left-[8%] top-[35%] -rotate-6 pointer-events-none z-10 animate-pulse duration-1000">
                <div className="p-3.5 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-xl shadow-purple-950/40 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center">
                        <MessageSquare size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-white">Real Conversations</p>
                        <p className="text-[10px] text-purple-300/70">Real Connections</p>
                    </div>
                </div>
            </div>

            <div className="hidden lg:block absolute right-[8%] top-[38%] rotate-6 pointer-events-none z-10">
                <div className="p-3.5 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-xl shadow-purple-950/40 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-300 flex items-center justify-center">
                        <Send size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-white">Chat • Collaborate</p>
                        <p className="text-[10px] text-indigo-300/70">Build Together</p>
                    </div>
                </div>
            </div>

            {/* Center Auth Card */}
            <main className="relative z-20 flex-1 flex items-center justify-center px-4 py-6 sm:py-10">
                <div className="w-full max-w-[430px] rounded-3xl bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-6 sm:p-9 shadow-2xl shadow-purple-950/70">
                    
                    {/* Card Header */}
                    <div className="text-center mb-6">
                        <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-purple-600/40 mb-3.5">
                            <Lock size={22} className="stroke-[2.5]" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            Welcome <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">back</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                            Sign in to your account and continue your conversations.
                        </p>
                    </div>

                    {/* Root error */}
                    {errors.root && (
                        <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs animate-shake">
                            {errors.root.message}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit((data) => login(data))} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-0.5">
                                Email
                            </label>
                            <Input
                                type="email"
                                placeholder="you@example.com"
                                leftIcon={<Mail size={16} className="text-slate-400" />}
                                register={register("email")}
                                error={errors.email?.message}
                                inputClassName="!bg-slate-950/60 !border-slate-800 !text-white !placeholder:text-slate-500 focus:!border-purple-500 focus:!ring-purple-500/20 rounded-xl"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-0.5">
                                Password
                            </label>
                            <Input
                                isPassword
                                placeholder="Enter your password"
                                leftIcon={<Lock size={16} className="text-slate-400" />}
                                register={register("password")}
                                error={errors.password?.message}
                                inputClassName="!bg-slate-950/60 !border-slate-800 !text-white !placeholder:text-slate-500 focus:!border-purple-500 focus:!ring-purple-500/20 rounded-xl"
                            />
                        </div>

                        {/* Keep me signed in & Forgot Password */}
                        <div className="flex items-center justify-between text-xs pt-0.5">
                            <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                                <input
                                    type="checkbox"
                                    checked={keepSignedIn}
                                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-700 bg-slate-950/80 text-purple-600 focus:ring-purple-500/30 accent-purple-600 cursor-pointer"
                                />
                                <span>Keep me signed in</span>
                            </label>

                            <button
                                type="button"
                                onClick={() => setIsForgotModalOpen(true)}
                                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors cursor-pointer"
                            >
                                Forgot password?
                            </button>
                        </div>

                        {/* Sign in Button */}
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign in</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-slate-800/80" />
                        <span className="text-[11px] text-slate-500 font-medium">or continue with</span>
                        <div className="flex-1 h-px bg-slate-800/80" />
                    </div>

                    {/* Google Login Button */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full py-2.5 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800/60 text-slate-200 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2.5 cursor-pointer hover:border-slate-700 active:scale-[0.99]"
                    >
                        <svg width="18" height="18" viewBox="0 0 48 48">
                            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.7 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z" />
                            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.7 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.7-3.3-11.3-8H6.1C9.5 38.2 16.2 44 24 44z" />
                            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C37 38.2 44 33 44 24c0-1.3-.1-2.7-.4-3.9z" />
                        </svg>
                        <span>Continue with Google</span>
                    </button>

                    {/* Bottom link */}
                    <p className="text-center text-xs text-slate-400 mt-6">
                        Don't have an account?{" "}
                        <Link to={ROUTES.REGISTER.path} className="text-purple-400 hover:text-purple-300 font-bold transition-colors">
                            Sign up
                        </Link>
                    </p>
                </div>
            </main>

            {/* Bottom minimal footer */}
            <footer className="relative z-20 py-4 text-center text-[11px] text-slate-500">
                <span>© {new Date().getFullYear()} NexusApp. All rights reserved.</span>
            </footer>

            <ForgotPasswordModal
                open={isForgotModalOpen}
                onClose={() => setIsForgotModalOpen(false)}
            />
        </div>
    );
};

export default Login;
