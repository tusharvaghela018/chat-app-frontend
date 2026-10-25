import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Lock, ArrowLeft, KeyRound, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";

import Input from "@/common/Input";
import { usePostApi } from "@/hooks/api";
import { ROUTES } from "@/constants/routes";

const resetPasswordSchema = yup.object({
    password: yup
        .string()
        .required("Password is required")
        .min(6, "Password must be at least 6 characters"),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref("password")], "Passwords must match")
        .required("Confirm password is required"),
});

type ResetPasswordForm = yup.InferType<typeof resetPasswordSchema>;

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
    } = useForm<ResetPasswordForm>({
        resolver: yupResolver(resetPasswordSchema),
    });

    const { mutate: resetPassword, isPending } = usePostApi<unknown, any>(
        "/auth/reset-password",
        {
            onSuccess: (_) => {
                navigate(ROUTES.LOGIN.path);
            },
            onError: (error) => {
                const message = axios.isAxiosError(error)
                    ? error.response?.data?.message || "Failed to reset password"
                    : "Failed to reset password";
                setError("root", { message });
            },
        }
    );

    const onSubmit = (data: ResetPasswordForm) => {
        if (!token) {
            return;
        }
        resetPassword({
            token,
            password: data.password,
        });
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#090b16] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 relative overflow-hidden transition-colors">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="w-full max-w-md relative z-10">
                    <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-8 sm:p-10 shadow-xl text-center space-y-5">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                            <AlertCircle size={30} />
                        </div>
                        <div className="space-y-1.5">
                            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                                Invalid Link
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                This password reset link is invalid, malformed, or has already expired.
                            </p>
                        </div>
                        <Link 
                            to={ROUTES.LOGIN.path}
                            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-full text-xs sm:text-sm font-bold text-white shadow-lg shadow-purple-600/25 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 transition-all cursor-pointer"
                        >
                            <ArrowLeft size={16} />
                            <span>Return to Login</span>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#090b16] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 relative overflow-hidden transition-colors">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-purple-500/15 dark:bg-purple-600/20 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10 space-y-6">
                
                {/* Brand Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-600/30 mb-2">
                        <Lock size={26} className="stroke-[2.2]" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Create New Password
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        Choose a strong, unique password to secure your account.
                    </p>
                </div>

                {/* Glassmorphic Form Card */}
                <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-7 sm:p-9 shadow-xl shadow-purple-500/5 space-y-6">
                    
                    {/* Root error */}
                    {errors.root && (
                        <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 flex items-center gap-2.5 text-red-600 dark:text-red-400 text-xs font-semibold animate-in slide-in-from-top-1">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{errors.root.message}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-0.5">
                                New Password
                            </label>
                            <Input
                                isPassword
                                placeholder="At least 6 characters"
                                leftIcon={<Lock size={16} className="text-slate-400" />}
                                register={register("password")}
                                error={errors.password?.message}
                                inputClassName="!bg-slate-50 dark:!bg-slate-950/60 !border-slate-200 dark:!border-slate-800 focus:!border-purple-500 focus:!ring-purple-500/20 rounded-2xl text-xs sm:text-sm font-semibold"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-0.5">
                                Confirm New Password
                            </label>
                            <Input
                                isPassword
                                placeholder="Re-enter your new password"
                                leftIcon={<KeyRound size={16} className="text-slate-400" />}
                                register={register("confirmPassword")}
                                error={errors.confirmPassword?.message}
                                inputClassName="!bg-slate-50 dark:!bg-slate-950/60 !border-slate-200 dark:!border-slate-800 focus:!border-purple-500 focus:!ring-purple-500/20 rounded-2xl text-xs sm:text-sm font-semibold"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full py-3.5 px-6 rounded-full text-xs sm:text-sm font-bold text-white shadow-lg shadow-purple-600/25 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Updating Password...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={16} />
                                        <span>Update Password</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800/80">
                        <Link 
                            to={ROUTES.LOGIN.path}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        >
                            <ArrowLeft size={13} />
                            <span>Back to sign in</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
