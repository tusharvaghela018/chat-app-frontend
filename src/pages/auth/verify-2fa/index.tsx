import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, ArrowLeft, KeyRound } from "lucide-react";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { usePostApi } from "@/hooks/api";
import { setUser } from "@/redux/slices/auth.slice";
import { ROUTES } from "@/constants/routes";
import Button from "@/common/Button";
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
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-card rounded-2xl shadow-sm border border-border p-8">

                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                            <ShieldCheck size={24} />
                        </div>
                        <h1 className="text-2xl font-semibold text-foreground">Two-Step Verification</h1>
                        <p className="text-sm text-muted-foreground mt-2 px-4">
                            {isRecoveryMode
                                ? "Enter one of your 8-character recovery codes to access your account."
                                : "Enter the 6-digit code from your authenticator app to continue."
                            }
                        </p>

                        {timeLeft !== null && (
                            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                                <span className={`w-2 h-2 rounded-full animate-pulse ${timeLeft < 60 ? "bg-destructive" : "bg-primary"}`} />
                                Session expires in: <span className={`font-bold ${timeLeft < 60 ? "text-destructive" : "text-foreground"}`}>{formatTime(timeLeft)}</span>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                            <Input
                                placeholder={isRecoveryMode ? "Recovery Code (e.g. ABCD1234)" : "000000"}
                                maxLength={isRecoveryMode ? 10 : 6}
                                register={register("code")}
                                error={errors.code?.message}
                                leftIcon={<KeyRound size={18} />}
                                inputClassName="text-center font-mono text-xl tracking-[0.2em] h-14"
                                onChange={(e) => {
                                    const val = e.target.value.toUpperCase();
                                    setValue("code", val);
                                }}
                                value={codeValue}
                                autoFocus
                            />
                        </div>

                        <Button
                            type="submit"
                            fullWidth
                            disabled={isPending}
                            loading={isPending}
                        >
                            Verify & Login
                        </Button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-border flex flex-col gap-3">
                        <button
                            onClick={toggleMode}
                            className="text-sm font-medium text-primary hover:underline transition-all"
                        >
                            {isRecoveryMode ? "Use authenticator app instead" : "Lost access to your phone?"}
                        </button>

                        <button
                            onClick={() => navigate(ROUTES.LOGIN.path)}
                            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all"
                        >
                            <ArrowLeft size={14} />
                            Back to login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Verify2FA;
