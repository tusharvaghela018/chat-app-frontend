import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User } from "lucide-react";
import { useDispatch } from "react-redux";

import Input from "@/common/Input";
import Button from "@/common/Button";
import { usePostApi } from "@/hooks/api";
import { setToken } from "@/redux/slices/auth.slice";
import { ROUTES } from "@/constants/routes";

interface RegisterForm {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

interface RegisterResponse {
    token: string;
    user: { id: number; name: string; email: string };
}

const Register = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        setError,
    } = useForm<RegisterForm>();

    const { mutate: signup, isPending } = usePostApi<RegisterResponse, Omit<RegisterForm, "confirmPassword">>(
        "/auth/register",
        {
            onSuccess: (data) => {
                dispatch(setToken(data.token));
                navigate(ROUTES.DASHBOARD.path);
            },
            onError: (error: any) => {
                const message = error?.response?.data?.message || "Registration failed";
                setError("root", { message });
            },
        }
    );

    const handleGoogleLogin = () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-4">
                            <User size={22} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-semibold text-gray-900">Create an account</h1>
                        <p className="text-sm text-gray-500 mt-1">Start your journey today</p>
                    </div>

                    {/* Root error */}
                    {errors.root && (
                        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
                            <p className="text-sm text-red-600">{errors.root.message}</p>
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
                            register={register("name", {
                                required: "Name is required",
                                minLength: { value: 2, message: "Name must be at least 2 characters" },
                            })}
                            error={errors.name?.message}
                        />

                        <Input
                            label="Email"
                            type="email"
                            placeholder="you@example.com"
                            leftIcon={<Mail size={16} />}
                            register={register("email", {
                                required: "Email is required",
                                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
                            })}
                            error={errors.email?.message}
                        />

                        <Input
                            label="Password"
                            isPassword
                            placeholder="Create a password"
                            leftIcon={<Lock size={16} />}
                            register={register("password", {
                                required: "Password is required",
                                minLength: { value: 6, message: "Minimum 6 characters" },
                            })}
                            error={errors.password?.message}
                        />

                        <Input
                            label="Confirm password"
                            isPassword
                            placeholder="Re-enter your password"
                            leftIcon={<Lock size={16} />}
                            register={register("confirmPassword", {
                                required: "Please confirm your password",
                                validate: (val) =>
                                    val === watch("password") || "Passwords do not match",
                            })}
                            error={errors.confirmPassword?.message}
                        />

                        <Button type="submit" fullWidth loading={isPending} className="mt-2">
                            Create account
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400">or continue with</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* Google Button */}
                    <button
                        onClick={handleGoogleLogin}
                        type="button"
                        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                        <svg width="18" height="18" viewBox="0 0 48 48">
                            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.7 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z" />
                            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.7 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.7-3.3-11.3-8H6.1C9.5 38.2 16.2 44 24 44z" />
                            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C37 38.2 44 33 44 24c0-1.3-.1-2.7-.4-3.9z" />
                        </svg>
                        Continue with Google
                    </button>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        Already have an account?{" "}
                        <Link to={ROUTES.LOGIN.path} className="text-blue-600 font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
