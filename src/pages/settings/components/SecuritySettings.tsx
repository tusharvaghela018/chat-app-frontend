import { useState } from "react";
import { ChevronDown, Fingerprint, ShieldCheck, ShieldAlert, QrCode, Copy, Check, Loader2, Download, Smartphone, KeyRound } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { usePostApi } from "@/hooks/api";
import { setUser } from "@/redux/slices/auth.slice";
import { type RootState } from "@/redux/store";
import Input from "@/common/Input";
import useToast from "@/hooks/toast";

interface TwoFactorForm {
    code: string;
}

const twoFactorSchema = yup.object({
    code: yup
        .string()
        .required("Verification code is required")
        .min(6, "Code must be at least 6 characters")
});

const SecuritySettings = () => {
    const dispatch = useDispatch();
    const toast = useToast();
    const user = useSelector((state: RootState) => state.auth.user);

    const [isOpen, setIsOpen] = useState(true);
    const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [otpUri, setOtpUri] = useState<string | null>(null);
    const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
    const [copied, setCopied] = useState(false);
    const [isDisabling, setIsDisabling] = useState(false);
    const [isCodesHidden, setIsCodesHidden] = useState(false);

    // Setup Form
    const {
        register: registerSetup,
        handleSubmit: handleSubmitSetup,
        reset: resetSetup,
        watch: watchSetup,
        setValue: setValueSetup,
        formState: { errors: errorsSetup }
    } = useForm<TwoFactorForm>({
        resolver: yupResolver(twoFactorSchema),
        defaultValues: { code: "" }
    });

    // Disable Form
    const {
        register: registerDisable,
        handleSubmit: handleSubmitDisable,
        reset: resetDisable,
        watch: watchDisable,
        setValue: setValueDisable,
        formState: { errors: errorsDisable }
    } = useForm<TwoFactorForm>({
        resolver: yupResolver(twoFactorSchema),
        defaultValues: { code: "" }
    });

    const setupCodeValue = watchSetup("code");
    const disableCodeValue = watchDisable("code");

    // ── Setup 2FA ────────────────────────────────────────────────────────
    const { mutate: setup2FA, isPending: isSettingUp } = usePostApi<{ qrcode: string; uri: string }, any>(
        "/auth/2fa/setup",
        {
            onSuccess: (response) => {
                setQrCode(response.data?.qrcode || null);
                setOtpUri(response.data?.uri || null);
                setIsSettingUp2FA(true);
                setIsCodesHidden(false);
            },
        }
    );

    // ── Verify & Enable 2FA ──────────────────────────────────────────────
    const { mutate: verify2FA, isPending: isVerifying } = usePostApi<{ recovery_codes: string[] }, { code: string }>(
        "/auth/2fa/verify",
        {
            onSuccess: (response) => {
                setRecoveryCodes(response.data?.recovery_codes || []);
                dispatch(setUser({ ...user!, two_factor_enabled: true }));
                resetSetup();
                toast.success("Two-Factor Authentication activated successfully!");
            },
        }
    );

    // ── Disable 2FA ──────────────────────────────────────────────────────
    const { mutate: disable2FA, isPending: isDisablePending } = usePostApi<any, { code?: string; recovery_code?: string }>(
        "/auth/2fa/disable",
        {
            onSuccess: () => {
                dispatch(setUser({ ...user!, two_factor_enabled: false }));
                setIsDisabling(false);
                resetDisable();
                toast.success("Two-Factor Authentication has been disabled");
            },
        }
    );

    const handleToggle2FA = () => {
        if (!user?.two_factor_enabled) {
            setup2FA({});
        } else {
            setIsDisabling(true);
        }
    };

    const onDisableSubmit = (data: TwoFactorForm) => {
        if (data.code.length > 6 || !/^\d+$/.test(data.code)) {
            disable2FA({ recovery_code: data.code });
        } else {
            disable2FA({ code: data.code });
        }
    };

    const copyToClipboard = () => {
        if (!recoveryCodes || isCodesHidden) return;
        navigator.clipboard.writeText(recoveryCodes.join("\n"));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        setIsCodesHidden(true);
        toast.success("Recovery codes copied to clipboard");
    };

    const downloadRecoveryCodes = () => {
        if (!recoveryCodes || isCodesHidden) return;
        const element = document.createElement("a");
        const file = new Blob([recoveryCodes.join("\n")], { type: "text/plain" });
        element.href = URL.createObjectURL(file);
        element.download = "nexus-recovery-codes.txt";
        document.body.appendChild(element);
        element.click();
        setIsCodesHidden(true);
        toast.success("Recovery codes downloaded successfully");
    };

    const finishSetup = () => {
        setIsSettingUp2FA(false);
        setRecoveryCodes(null);
        setQrCode(null);
        setIsCodesHidden(false);
        resetSetup();
    };

    return (
        <div id="section-security" className="overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm transition-all">
            {/* Accordion Header */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between p-5 sm:p-6 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 text-left cursor-pointer"
            >
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                    <div className="flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shadow-2xs">
                        <ShieldCheck size={20} className="stroke-[2.5]" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                            Security
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            Manage two-factor authentication, active sessions, and credential safety.
                        </p>
                    </div>
                </div>
                <ChevronDown
                    size={20}
                    className={`text-slate-400 transition-transform duration-300 flex-shrink-0 ml-2 ${isOpen ? "rotate-180 text-purple-600 dark:text-purple-400" : ""}`}
                />
            </button>

            {isOpen && (
                <div className="border-t border-slate-100 dark:border-slate-800/80 p-5 sm:p-7 pt-5 space-y-6 animate-in slide-in-from-top-2 duration-200">
                    
                    {/* 2FA Main Status Card */}
                    <div className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                        user?.two_factor_enabled 
                            ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/40" 
                            : "bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/70 dark:border-purple-900/30"
                    }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
                                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl shadow-2xs ${
                                    user?.two_factor_enabled 
                                        ? "bg-emerald-500 text-white" 
                                        : "bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300"
                                }`}>
                                    <Smartphone size={20} className="stroke-[2.2]" />
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            Two-Factor Authentication (2FA)
                                        </h3>
                                        {user?.two_factor_enabled ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40 text-[10px] font-bold">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Active & Protected
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 text-[10px] font-semibold">
                                                Not Configured
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                                        Protect your account by requiring an authenticator app verification code on every login.
                                    </p>
                                </div>
                            </div>

                            {/* Toggle Switch */}
                            <div className="flex justify-end sm:block shrink-0">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={!!user?.two_factor_enabled}
                                    onClick={handleToggle2FA}
                                    disabled={isSettingUp}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 ${
                                        user?.two_factor_enabled ? "bg-purple-600" : "bg-slate-300 dark:bg-slate-700"
                                    }`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                            user?.two_factor_enabled ? "translate-x-5" : "translate-x-0"
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Setup Phase (QR Code & Verify Input) */}
                        {isSettingUp2FA && !recoveryCodes && (
                            <div className="mt-5 pt-5 border-t border-purple-200/60 dark:border-purple-800/40 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                                
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs sm:text-sm">
                                        <QrCode size={16} />
                                        <span>Setup Authenticator App</span>
                                    </div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/40">
                                        Step 1 of 2
                                    </span>
                                </div>

                                <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 flex flex-col items-center gap-5 shadow-sm">
                                    {qrCode ? (
                                        <div className="flex flex-col items-center gap-4 w-full">
                                            {/* QR Code Container */}
                                            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-md">
                                                <img src={qrCode} alt="2FA QR Code" className="w-36 h-36 sm:w-44 sm:h-44 object-contain" />
                                            </div>
                                            
                                            {/* Mobile Deep Link Button */}
                                            {otpUri && (
                                                <button 
                                                    type="button"
                                                    onClick={() => window.open(otpUri)}
                                                    className="w-full max-w-xs py-2.5 px-4 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/70 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                                                >
                                                    <Fingerprint size={15} />
                                                    <span>Open in Authenticator App</span>
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="aspect-square w-36 sm:w-44 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center animate-pulse">
                                            <Loader2 size={24} className="animate-spin text-purple-600 dark:text-purple-400" />
                                        </div>
                                    )}

                                    {/* Verification Form */}
                                    <form onSubmit={handleSubmitSetup((data) => verify2FA({ code: data.code }))} className="w-full max-w-sm space-y-4 pt-1">
                                        <p className="text-xs text-center text-slate-500 dark:text-slate-400 leading-relaxed">
                                            Scan the QR code with Google Authenticator, Authy, or 1Password, then enter the 6-digit confirmation code below.
                                        </p>

                                        <Input
                                            placeholder="000000"
                                            maxLength={6}
                                            register={registerSetup("code")}
                                            error={errorsSetup.code?.message}
                                            inputClassName="text-center font-mono font-bold text-lg sm:text-xl tracking-[0.35em] sm:tracking-[0.45em] h-13 !bg-slate-50 dark:!bg-slate-950/60 !border-slate-200 dark:!border-slate-800 focus:!border-purple-500 focus:!ring-purple-500/20 rounded-2xl"
                                            onChange={(e) => {
                                                const val = e.target.value.toUpperCase();
                                                setValueSetup("code", val);
                                            }}
                                            value={setupCodeValue}
                                            autoFocus
                                        />

                                        <div className="flex items-center gap-2.5 pt-1">
                                            <button 
                                                type="button" 
                                                onClick={() => { setIsSettingUp2FA(false); resetSetup(); }}
                                                className="flex-1 py-2.5 px-4 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isVerifying}
                                                className="flex-1 py-2.5 px-4 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-600/25 hover:shadow-purple-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                                            >
                                                {isVerifying ? (
                                                    <>
                                                        <Loader2 size={14} className="animate-spin" />
                                                        <span>Verifying...</span>
                                                    </>
                                                ) : (
                                                    <span>Verify & Enable</span>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Recovery Codes Display Phase */}
                        {recoveryCodes && (
                            <div className="mt-5 pt-5 border-t border-emerald-200/60 dark:border-emerald-800/40 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs sm:text-sm">
                                        <ShieldCheck size={18} />
                                        <span>Emergency Recovery Codes</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={downloadRecoveryCodes}
                                            disabled={isCodesHidden}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
                                        >
                                            <Download size={13} />
                                            <span>Download</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={copyToClipboard}
                                            disabled={isCodesHidden}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
                                        >
                                            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                                            <span>{copied ? "Copied!" : "Copy All"}</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                                    Save these emergency codes in a safe place. If you lose access to your authenticator app, each code can be used once to regain access to your account.
                                </div>

                                {isCodesHidden ? (
                                    <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 rounded-2xl p-6 text-center space-y-1.5 animate-in fade-in duration-300">
                                        <ShieldCheck className="mx-auto text-emerald-600 dark:text-emerald-400" size={28} />
                                        <p className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200">
                                            Recovery Codes Saved & Secured
                                        </p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            Your codes have been copied or downloaded.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {recoveryCodes.map((code, idx) => (
                                            <div key={idx} className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200/90 dark:border-slate-800 rounded-xl py-2.5 px-3 text-center font-mono text-xs font-extrabold tracking-wider text-slate-900 dark:text-white shadow-2xs">
                                                {code}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="pt-2">
                                    <button 
                                        type="button"
                                        onClick={finishSetup}
                                        className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
                                    >
                                        I Have Saved These Codes
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Disable Phase */}
                        {isDisabling && (
                            <div className="mt-5 pt-5 border-t border-red-200/60 dark:border-red-900/40 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs sm:text-sm">
                                    <ShieldAlert size={16} />
                                    <span>Disable Two-Factor Authentication</span>
                                </div>

                                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-red-200/70 dark:border-red-900/40 p-5 sm:p-6 space-y-4 shadow-sm">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                                        Enter your 6-digit authenticator code or an 8-character recovery code to confirm disabling 2FA.
                                    </p>

                                    <form onSubmit={handleSubmitDisable(onDisableSubmit)} className="space-y-4 max-w-sm mx-auto">
                                        <Input
                                            placeholder="Code"
                                            register={registerDisable("code")}
                                            error={errorsDisable.code?.message}
                                            leftIcon={<KeyRound size={16} className="text-slate-400" />}
                                            inputClassName="text-center font-mono font-bold text-lg sm:text-xl tracking-[0.25em] h-12 !bg-slate-50 dark:!bg-slate-950/60 !border-slate-200 dark:!border-slate-800 focus:!border-red-500 focus:!ring-red-500/20 rounded-2xl"
                                            onChange={(e) => {
                                                const val = e.target.value.toUpperCase();
                                                setValueDisable("code", val);
                                            }}
                                            value={disableCodeValue}
                                            autoFocus
                                        />

                                        <div className="flex items-center gap-2.5 pt-1">
                                            <button 
                                                type="button" 
                                                onClick={() => { setIsDisabling(false); resetDisable(); }}
                                                className="flex-1 py-2.5 px-4 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isDisablePending}
                                                className="flex-1 py-2.5 px-4 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                                            >
                                                {isDisablePending ? (
                                                    <>
                                                        <Loader2 size={14} className="animate-spin" />
                                                        <span>Disabling...</span>
                                                    </>
                                                ) : (
                                                    <span>Confirm Disable</span>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecuritySettings;
