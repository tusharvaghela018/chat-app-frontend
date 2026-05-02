import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { useDispatch } from "react-redux";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import Input from "@/common/Input";
import Button from "@/common/Button";
import { usePostApi } from "@/hooks/api";
import { setToken, setUser } from "@/redux/slices/auth.slice";
import { ROUTES } from "@/constants/routes";
import axios from "axios";
import ForgotPasswordModal from "./components/ForgotPasswordModal";
import { useState } from "react";

interface LoginForm {
    email: string;
    password: string;
}

interface LoginResponse {
    token: string;
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

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
    } = useForm<LoginForm>(
        {
            resolver: yupResolver(loginSchema)
        }
    );

    const { mutate: login, isPending } = usePostApi<LoginResponse, LoginForm>(
        "/auth/login",
        {
            onSuccess: (response) => {
                dispatch(setToken(response.data?.token || ""));
                const { id, name, username, email, avatar, is_online, public_key, encrypted_vault, vault_salt } = { ...response.data?.user }
                const userData = {
                    id: Number(id),
                    name: String(name),
                    username: String(username),
                    email: String(email),
                    avatar: String(avatar),
                    is_online: is_online || false,
                    public_key,
                    encrypted_vault,
                    vault_salt
                }
                dispatch(setUser(userData))
                navigate(ROUTES.DASHBOARD.path);
            },
            onError: (error) => {
                const message = axios.isAxiosError(error)
                    ? error.response?.data?.message || "Invalid email or password"
                    : "Invalid email or password";
                // const message = error?.response?.data?.message || "Invalid email or password";
                setError("root", { message });
            },
        }
    );

    const handleGoogleLogin = () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-card rounded-2xl shadow-sm border border-border p-8">

                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4">
                            <Lock size={22} className="text-primary-foreground" />
                        </div>
                        <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
                        <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
                    </div>

                    {/* Root error */}
                    {errors.root && (
                        <div className="mb-4 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20">
                            <p className="text-sm text-destructive">{errors.root.message}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit((data) => login(data))} className="flex flex-col gap-4">
                        <Input
                            label="Email"
                            type="email"
                            placeholder="you@example.com"
                            leftIcon={<Mail size={16} />}
                            register={register("email")}
                            error={errors.email?.message}
                        />

                        <Input
                            label="Password"
                            isPassword
                            placeholder="Enter your password"
                            leftIcon={<Lock size={16} />}
                            register={register("password")}
                            error={errors.password?.message}
                        />

                        <div className="flex justify-end">
                            <Button
                                type="button"
                                onClick={() => setIsForgotModalOpen(true)}
                                variant="link"
                                className="text-sm font-medium text-primary hover:underline focus:outline-none p-0 h-auto"
                            >
                                Forgot password?
                            </Button>
                        </div>

                        <Button type="submit" fullWidth loading={isPending} className="mt-2">
                            Sign in
                        </Button>
                    </form>

                    <ForgotPasswordModal
                        open={isForgotModalOpen}
                        onClose={() => setIsForgotModalOpen(false)}
                    />

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground">or continue with</span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Google Button */}
                    <Button
                        onClick={handleGoogleLogin}
                        type="button"
                        variant="outline"
                        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-accent transition"
                    >
                        <svg width="18" height="18" viewBox="0 0 48 48">
                            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.7 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z" />
                            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.7 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.7-3.3-11.3-8H6.1C9.5 38.2 16.2 44 24 44z" />
                            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C37 38.2 44 33 44 24c0-1.3-.1-2.7-.4-3.9z" />
                        </svg>
                        Continue with Google
                    </Button>

                    <p className="text-center text-sm text-muted-foreground mt-6">
                        Don't have an account?{" "}
                        <Link to={ROUTES.REGISTER.path} className="text-primary font-medium hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
