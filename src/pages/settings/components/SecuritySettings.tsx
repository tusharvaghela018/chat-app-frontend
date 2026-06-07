import { useState } from "react"
import { Lock, ChevronDown, Fingerprint, ShieldCheck, ShieldAlert, QrCode, Copy, Check, Loader2, Download } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"

import { usePostApi } from "@/hooks/api"
import { setUser } from "@/redux/slices/auth.slice"
import { type RootState } from "@/redux/store"
import Button from "@/common/Button"
import Input from "@/common/Input"
import useToast from "@/hooks/toast"

interface TwoFactorForm {
    code: string;
}

const twoFactorSchema = yup.object({
    code: yup
        .string()
        .required("Code is required")
        .min(6, "Minimum 6 characters")
});

const SecuritySettings = () => {
    const dispatch = useDispatch()
    const toast = useToast()
    const user = useSelector((state: RootState) => state.auth.user)

    const [isOpen, setIsOpen] = useState(true)
    const [isSettingUp2FA, setIsSettingUp2FA] = useState(false)
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [otpUri, setOtpUri] = useState<string | null>(null)
    const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
    const [copied, setCopied] = useState(false)
    const [isDisabling, setIsDisabling] = useState(false)
    const [isCodesHidden, setIsCodesHidden] = useState(false)

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
                setQrCode(response.data?.qrcode || null)
                setOtpUri(response.data?.uri || null)
                setIsSettingUp2FA(true)
                setIsCodesHidden(false)
            },
        }
    )

    // ── Verify & Enable 2FA ──────────────────────────────────────────────
    const { mutate: verify2FA, isPending: isVerifying } = usePostApi<{ recovery_codes: string[] }, { code: string }>(
        "/auth/2fa/verify",
        {
            onSuccess: (response) => {
                setRecoveryCodes(response.data?.recovery_codes || [])
                dispatch(setUser({ ...user!, two_factor_enabled: true }))
                resetSetup();
            },
        }
    )

    // ── Disable 2FA ──────────────────────────────────────────────────────
    const { mutate: disable2FA, isPending: isDisablePending } = usePostApi<any, { code?: string; recovery_code?: string }>(
        "/auth/2fa/disable",
        {
            onSuccess: () => {
                dispatch(setUser({ ...user!, two_factor_enabled: false }))
                setIsDisabling(false)
                resetDisable();
            },
        }
    )

    const handleToggle2FA = () => {
        if (!user?.two_factor_enabled) {
            setup2FA({})
        } else {
            setIsDisabling(true)
        }
    }

    const onDisableSubmit = (data: TwoFactorForm) => {
        // If it's a recovery code (contains letters or length > 6), pass it as recovery_code
        if (data.code.length > 6 || !/^\d+$/.test(data.code)) {
            disable2FA({ recovery_code: data.code });
        } else {
            disable2FA({ code: data.code });
        }
    };

    const copyToClipboard = () => {
        if (!recoveryCodes || isCodesHidden) return
        navigator.clipboard.writeText(recoveryCodes.join("\n"))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        setIsCodesHidden(true)
        toast.success("Recovery codes copied to clipboard")
    }

    const downloadRecoveryCodes = () => {
        if (!recoveryCodes || isCodesHidden) return
        const element = document.createElement("a")
        const file = new Blob([recoveryCodes.join("\n")], { type: 'text/plain' })
        element.href = URL.createObjectURL(file)
        element.download = "nexus-recovery-codes.txt"
        document.body.appendChild(element)
        element.click()
        setIsCodesHidden(true)
        toast.success("Recovery codes downloaded successfully")
    }

    const finishSetup = () => {
        setIsSettingUp2FA(false)
        setRecoveryCodes(null)
        setQrCode(null)
        setIsCodesHidden(false)
        resetSetup();
    }

    return (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between p-4 sm:p-6 transition-colors hover:bg-muted/50"
            >
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Lock size={20} className="sm:size-[22px]" />
                    </div>
                    <div className="text-left">
                        <h2 className="text-base sm:text-lg font-bold">Security</h2>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">2FA and account security</p>
                    </div>
                </div>
                <ChevronDown
                    size={18}
                    className={`text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            {isOpen && (
                <div className="border-t bg-card/50 p-4 sm:p-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-4 sm:space-y-6">
                        {/* 2FA Status Card */}
                        <div className={`rounded-xl border p-4 sm:p-5 ${user?.two_factor_enabled ? 'bg-green-500/5 border-green-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                <div className="flex gap-3 sm:gap-4">
                                    <div className={`mt-0.5 flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full ${user?.two_factor_enabled ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                        <ShieldCheck size={18} className="sm:size-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold">Two-Factor Authentication</h3>
                                        <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed max-w-md">
                                            Add an extra layer of security to your account by requiring more than just a password.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-end sm:block">
                                    <button
                                        onClick={handleToggle2FA}
                                        disabled={isSettingUp}
                                        className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${user?.two_factor_enabled ? 'bg-green-500' : 'bg-muted'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${user?.two_factor_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Setup Phase */}
                            {isSettingUp2FA && !recoveryCodes && (
                                <div className="mt-5 space-y-4 border-t border-dashed pt-5 animate-in fade-in zoom-in-95 duration-300">
                                    <div className="flex items-center gap-2 text-primary font-bold text-xs sm:text-sm">
                                        <QrCode size={16} />
                                        Setup Authenticator App
                                    </div>
                                    <div className="rounded-xl bg-background p-4 border flex flex-col items-center gap-4">
                                        {qrCode ? (
                                            <div className="flex flex-col items-center gap-4 w-full">
                                                <div className="bg-white p-2 rounded-lg border-2 border-primary/20">
                                                    <img src={qrCode} alt="2FA QR Code" className="w-32 h-32 sm:w-40 sm:h-40" />
                                                </div>
                                                
                                                {/* Mobile Deep Link Button */}
                                                {otpUri && (
                                                    <Button 
                                                        variant="outline" 
                                                        className="w-full text-[11px] sm:text-xs gap-2 rounded-xl h-9 border-primary/30 text-primary hover:bg-primary/5 font-bold"
                                                        onClick={() => window.open(otpUri)}
                                                    >
                                                        <Fingerprint size={14} />
                                                        Open in Authenticator
                                                    </Button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="aspect-square w-32 sm:w-40 bg-muted rounded-lg flex items-center justify-center animate-pulse">
                                                <Loader2 size={24} className="animate-spin text-muted-foreground" />
                                            </div>
                                        )}
                                        <form onSubmit={handleSubmitSetup((data) => verify2FA({ code: data.code }))} className="w-full space-y-3">
                                            <p className="text-[10px] sm:text-xs text-center text-muted-foreground px-2">Scan QR code or use the button above, then enter the 6-digit code.</p>
                                            <Input
                                                placeholder="000000"
                                                maxLength={6}
                                                register={registerSetup("code")}
                                                error={errorsSetup.code?.message}
                                                inputClassName="text-center font-bold text-base sm:text-lg tracking-[0.4em] sm:tracking-[0.5em]"
                                                onChange={(e) => {
                                                    const val = e.target.value.toUpperCase();
                                                    setValueSetup("code", val);
                                                }}
                                                value={setupCodeValue}
                                            />
                                            <div className="flex gap-2 pt-1">
                                                <Button 
                                                    variant="ghost" 
                                                    className="flex-1 rounded-xl text-[11px] sm:text-xs h-9 font-bold" 
                                                    onClick={() => { setIsSettingUp2FA(false); resetSetup(); }}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    className="flex-1 rounded-xl text-[11px] sm:text-xs h-9 font-bold"
                                                    disabled={isVerifying}
                                                    loading={isVerifying}
                                                >
                                                    Verify
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* Recovery Codes Display */}
                            {recoveryCodes && (
                                <div className="mt-5 space-y-4 border-t border-dashed pt-5 animate-in fade-in zoom-in-95 duration-300">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 text-green-600 font-bold text-xs sm:text-sm">
                                            <ShieldCheck size={16} />
                                            Recovery Codes
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <button
                                                onClick={downloadRecoveryCodes}
                                                disabled={isCodesHidden}
                                                className={`text-[10px] sm:text-xs flex flex-1 sm:flex-none justify-center items-center gap-1.5 font-bold transition-all py-1.5 sm:py-0 rounded-lg border border-primary/20 sm:border-none ${isCodesHidden ? "text-muted-foreground opacity-50" : "text-primary hover:underline"}`}
                                            >
                                                <Download size={13} />
                                                Download
                                            </button>
                                            <button
                                                onClick={copyToClipboard}
                                                disabled={isCodesHidden}
                                                className={`text-[10px] sm:text-xs flex flex-1 sm:flex-none justify-center items-center gap-1.5 font-bold transition-all py-1.5 sm:py-0 rounded-lg border border-primary/20 sm:border-none ${isCodesHidden ? "text-muted-foreground opacity-50" : "text-primary hover:underline"}`}
                                            >
                                                {copied ? <Check size={13} /> : <Copy size={13} />}
                                                {copied ? "Copied!" : "Copy All"}
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] sm:text-[11px] text-muted-foreground bg-muted/50 p-2.5 sm:p-3 rounded-lg border border-dashed border-muted-foreground/30">
                                        Save these codes securely. They allow account access if you lose your phone.
                                    </p>
                                    {isCodesHidden ? (
                                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center space-y-2 animate-in fade-in zoom-in-95 duration-500">
                                            <ShieldCheck className="mx-auto text-primary" size={28} />
                                            <p className="text-xs sm:text-sm font-bold">Codes Secured</p>
                                            <p className="text-[10px] sm:text-[11px] text-muted-foreground italic px-2">
                                                Your recovery codes have been saved and hidden.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            {recoveryCodes.map((code, idx) => (
                                                <div key={idx} className="bg-background border rounded-lg py-2 px-1 sm:px-3 text-center font-mono text-[10px] sm:text-xs font-bold tracking-tight sm:tracking-wider">
                                                    {code}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <Button fullWidth className="rounded-xl h-10 mt-1 font-bold text-xs sm:text-sm" onClick={finishSetup}>
                                        I've saved these codes
                                    </Button>
                                </div>
                            )}

                            {/* Disable Phase */}
                            {isDisabling && (
                                <div className="mt-5 space-y-4 border-t border-dashed pt-5 animate-in fade-in zoom-in-95 duration-300">
                                    <div className="flex items-center gap-2 text-red-500 font-bold text-xs sm:text-sm">
                                        <ShieldAlert size={16} />
                                        Disable 2FA
                                    </div>
                                    <div className="rounded-xl bg-background p-4 border space-y-3">
                                        <p className="text-[10px] sm:text-xs text-muted-foreground text-center">Enter the 6-digit code or a recovery code to confirm.</p>
                                        <form onSubmit={handleSubmitDisable(onDisableSubmit)} className="space-y-3">
                                            <Input
                                                placeholder="Code"
                                                register={registerDisable("code")}
                                                error={errorsDisable.code?.message}
                                                inputClassName="text-center font-bold text-base sm:text-lg"
                                                onChange={(e) => {
                                                    const val = e.target.value.toUpperCase();
                                                    setValueDisable("code", val);
                                                }}
                                                value={disableCodeValue}
                                            />
                                            <div className="flex gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    className="flex-1 rounded-xl text-[11px] sm:text-xs h-9 font-bold" 
                                                    onClick={() => { setIsDisabling(false); resetDisable(); }}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    variant="danger"
                                                    className="flex-1 rounded-xl text-[11px] sm:text-xs h-9 font-bold"
                                                    disabled={isDisablePending}
                                                    loading={isDisablePending}
                                                >
                                                    Disable
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SecuritySettings
