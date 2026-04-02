import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User } from "lucide-react";
import { useDispatch } from "react-redux";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";

import Input from "@/common/Input";
import Button from "@/common/Button";
import { usePostApi } from "@/hooks/api";
import { setToken, setUser } from "@/redux/slices/auth.slice";
import { ROUTES } from "@/constants/routes";

interface RegisterForm {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

interface RegisterResponse {
    token: string;
    user: { id: number; name: string; avatar: string; is_online: boolean };
}

const registerSchema = yup.object({
    name: yup
        .string()
        .required("Name is required")
        .min(2, "Name must be at least 2 characters"),
    email: yup
        .string()
        .required("Email is required")
        .email("Enter a valid email"),
    password: yup
        .string()
        .required("Password is required")
        .min(6, "Minimum 6 characters"),
    confirmPassword: yup
        .string()
        .required("Please confirm your password")
        .oneOf([yup.ref("password")], "Passwords do not match"),
});

const Register = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
    } = useForm<RegisterForm>({
        resolver: yupResolver(registerSchema),
    });

    const { mutate: signup, isPending } = usePostApi<RegisterResponse, Omit<RegisterForm, "confirmPassword">>(
        "/auth/register",
        {
            onSuccess: (response) => {
                const { id, name, avatar, is_online } = response.data?.user ?? {};
                const userData = {
                    id: Number(id),
                    name: String(name),
                    avatar: String(avatar),
                    is_online: is_online || false,
                };
                dispatch(setToken(response.data?.token || ""));
                dispatch(setUser(userData));
                navigate(ROUTES.DASHBOARD.path);
            },
            onError: (error) => {
                const message = axios.isAxiosError(error)
                    ? error.response?.data?.message || "Registration failed"
                    : "Registration failed";
                setError("root", { message });
            },
        }
    );

    const handleGoogleLogin = () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md">
                <div className="bg-card rounded-2xl shadow-sm border border-border p-8">

                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4">
                            <User size={22} className="text-primary-foreground" />
                        </div>
                        <h1 className="text-2xl font-semibold text-foreground">Create an account</h1>
                        <p className="text-sm text-muted-foreground mt-1">Start your journey today</p>
                    </div>

                    {/* Root error */}
                    {errors.root && (
                        <div className="mb-4 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20">
                            <p className="text-sm text-destructive">{errors.root.message}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form
                        onSubmit={handleSubmit(({ name, email, password }) =>
                            signup({ name, email, password })
                        )}
                        className="flex flex-col gap-4"
                    >
                        <Input
                            label="Full name"
                            placeholder="John Doe"
                            leftIcon={<User size={16} />}
                            register={register("name")}
                            error={errors.name?.message}
                        />

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
                            placeholder="Create a password"
                            leftIcon={<Lock size={16} />}
                            register={register("password")}
                            error={errors.password?.message}
                        />

                        <Input
                            label="Confirm password"
                            isPassword
                            placeholder="Re-enter your password"
                            leftIcon={<Lock size={16} />}
                            register={register("confirmPassword")}
                            error={errors.confirmPassword?.message}
                        />

                        <Button type="submit" fullWidth loading={isPending} className="mt-2">
                            Create account
                        </Button>
                    </form>

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
                        Already have an account?{" "}
                        <Link to={ROUTES.LOGIN.path} className="text-primary font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;