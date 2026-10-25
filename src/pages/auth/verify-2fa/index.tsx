import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ShieldCheck, ArrowLeft, KeyRound, Clock, Loader2, Sparkles, Smartphone, LifeBuoy } from "lucide-react";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { usePostApi } from "@/hooks/api";
import { setUser } from "@/redux/slices/auth.slice";
import { ROUTES } from "@/constants/routes";
import Input from "@/common/Input";

interface Verify2FAForm {
    code: string;
}

const Verify2FA = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const preAuthToken = searchParams.get("token");
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    const schema = yup.object({
        code: yup
            .string()
            .required("Verification code is required")
            .test("len", (val) => {
                if (!val) return false;
                if (isRecoveryMode) return val.length === 8 || val.length === 10;
                return val.length === 6;
            })
    });

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<Verify2FAForm>({
        resolver: yupResolver(schema),
        defaultValues: { code: "" }
    });

    const codeValue = watch("code");

    useEffect(() => {
        if (!preAuthToken) {
            navigate(ROUTES.LOGIN.path);
            return;
        }

        try {
            // Decode JWT to get expiration time
            const payload = JSON.parse(atob(preAuthToken.split('.')[1]));
            const expiry = payload.exp * 1000;

            const updateTimer = () => {
                const now = Date.now();
                const diff = Math.max(0, Math.floor((expiry - now) / 1000));
                setTimeLeft(diff);

                if (diff <= 0) {
                    navigate(ROUTES.LOGIN.path);
                }
            };

            updateTimer();
            const interval = setInterval(updateTimer, 1000);
            return () => clearInterval(interval);
        } catch (error) {
            navigate(ROUTES.LOGIN.path);
        }
    }, [preAuthToken, navigate]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const { mutate: verify2FA, isPending } = usePostApi<any, { token: string; code?: string; recovery_code?: string }>(
        "/auth/2fa/login",
        {
            onSuccess: (response) => {
                dispatch(setUser(response.data?.user));
                navigate(ROUTES.CHAT.path);
            },
        }
    );

    const onSubmit = (data: Verify2FAForm) => {
        const payload: { token: string; code?: string; recovery_code?: string } = {
            token: preAuthToken!
        };

        if (isRecoveryMode) {
            payload.recovery_code = data.code;
        } else {
            payload.code = data.code;
        }

        verify2FA(payload);
    };

    const toggleMode = () => {
        setIsRecoveryMode(!isRecoveryMode);
        reset({ code: "" });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#090b16] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 relative overflow-hidden transition-colors">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-purple-500/15 dark:bg-purple-600/20 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10 space-y-6">
                
                {/* Brand & Hero Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-600/30 mb-2">
                        {isRecoveryMode ? <LifeBuoy size={26} /> : <ShieldCheck size={26} className="stroke-[2.2]" />}
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-100/90 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/40 text-[11px] font-bold">
                        <Sparkles size={11} className="text-purple-600 dark:text-purple-400" />
                        <span>Security Challenge</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {isRecoveryMode ? "Account Recovery" : "Two-Step Verification"}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                        {isRecoveryMode
                            ? "Enter one of your 8-character recovery backup codes to unlock your account."
                            : "Enter the 6-digit code from your authenticator app to complete verification."
                        }
                    </p>

                    {timeLeft !== null && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-semibold text-slate-600 dark:text-slate-300 shadow-2xs mt-1">
                            <Clock size={12} className={timeLeft < 60 ? "text-red-500 animate-pulse" : "text-purple-500"} />
                            <span>Session expires in:</span>
                            <span className={`font-mono font-bold ${timeLeft < 60 ? "text-red-500" : "text-purple-600 dark:text-purple-400"}`}>
                                {formatTime(timeLeft)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Glassmorphic Form Card */}
                <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-7 sm:p-9 shadow-xl shadow-purple-500/5 space-y-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-0.5">
                                {isRecoveryMode ? "Emergency Recovery Code" : "6-Digit Authenticator Code"}
                            </label>
                            <Input
                                placeholder={isRecoveryMode ? "ABCD1234" : "000000"}
                                maxLength={isRecoveryMode ? 10 : 6}
                                register={register("code")}
                                error={errors.code?.message}
                                leftIcon={<KeyRound size={16} className="text-slate-400" />}
                                inputClassName="text-center font-mono text-xl tracking-[0.25em] h-13 sm:h-14 !bg-slate-50 dark:!bg-slate-950/60 !border-slate-200 dark:!border-slate-800 focus:!border-purple-500 focus:!ring-purple-500/20 rounded-2xl font-bold"
                                onChange={(e) => {
                                    const val = e.target.value.toUpperCase();
                                    setValue("code", val);
                                }}
                                value={codeValue}
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full py-3.5 px-6 rounded-full text-xs sm:text-sm font-bold text-white shadow-lg shadow-purple-600/25 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Verifying Code...</span>
                                </>
                            ) : (
                                <>
                                    <ShieldCheck size={16} />
                                    <span>Verify & Continue</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Mode Switch & Back Button */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col items-center gap-3">
                        <button
                            type="button"
                            onClick={toggleMode}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer"
                        >
                            {isRecoveryMode ? (
                                <>
                                    <Smartphone size={13} />
                                    <span>Use authenticator app instead</span>
                                </>
                            ) : (
                                <>
                                    <LifeBuoy size={13} />
                                    <span>Lost access to your authenticator?</span>
                                </>
                            )}
                        </button>

                        <Link
                            to={ROUTES.LOGIN.path}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        >
                            <ArrowLeft size={13} />
                            <span>Return to login</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Verify2FA;
