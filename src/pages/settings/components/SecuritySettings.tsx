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
    const { mutate: setup2FA, isPending: isSettingUp } = usePostApi<{ qrcode: string }, any>(
        "/auth/2fa/setup",
        {
            onSuccess: (response) => {
                setQrCode(response.data?.qrcode || null)
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
                className="flex w-full items-center justify-between p-6 transition-colors hover:bg-muted/50"
            >
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Lock size={22} />
                    </div>
                    <div className="text-left">
                        <h2 className="text-lg font-bold">Security</h2>
                        <p className="text-xs text-muted-foreground">Two-factor authentication and account security</p>
                    </div>
                </div>
                <ChevronDown
                    size={20}
                    className={`text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            {isOpen && (
                <div className="border-t bg-card/50 p-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-6">
                        {/* 2FA Status Card */}
                        <div className={`rounded-xl border p-5 ${user?.two_factor_enabled ? 'bg-green-500/5 border-green-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                    <div className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full ${user?.two_factor_enabled ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold">Two-Factor Authentication</h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                                            Add an extra layer of security to your account by requiring more than just a password to log in.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleToggle2FA}
                                    disabled={isSettingUp}
                                    className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${user?.two_factor_enabled ? 'bg-green-500' : 'bg-muted'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${user?.two_factor_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {/* Setup Phase */}
                            {isSettingUp2FA && !recoveryCodes && (
                                <div className="mt-6 space-y-4 border-t border-dashed pt-6 animate-in fade-in zoom-in-95 duration-300">
                                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                        <QrCode size={16} />
                                        Setup Google Authenticator
                                    </div>
                                    <div className="rounded-xl bg-background p-4 border flex flex-col items-center gap-4">
                                        {qrCode ? (
                                            <div className="bg-white p-2 rounded-lg border-2 border-primary/20">
                                                <img src={qrCode} alt="2FA QR Code" className="w-40 h-40" />
                                            </div>
                                        ) : (
                                            <div className="aspect-square w-40 bg-muted rounded-lg flex items-center justify-center animate-pulse">
                                                <Loader2 size={24} className="animate-spin text-muted-foreground" />
                                            </div>
                                        )}
                                        <form onSubmit={handleSubmitSetup((data) => verify2FA({ code: data.code }))} className="w-full space-y-3">
                                            <p className="text-xs text-center text-muted-foreground">Scan this QR code with your authenticator app, then enter the 6-digit code below.</p>
                                            <Input
                                                placeholder="000000"
                                                maxLength={6}
                                                register={registerSetup("code")}
                                                error={errorsSetup.code?.message}
                                                inputClassName="text-center font-bold text-lg tracking-[0.5em]"
                                                onChange={(e) => {
                                                    const val = e.target.value.toUpperCase();
                                                    setValueSetup("code", val);
                                                }}
                                                value={setupCodeValue}
                                            />
                                            <div className="flex gap-2 pt-2">
                                                <Button variant="ghost" className="flex-1 rounded-xl text-xs h-9" onClick={() => { setIsSettingUp2FA(false); resetSetup(); }}>Cancel</Button>
                                                <Button
                                                    type="submit"
                                                    className="flex-1 rounded-xl text-xs h-9"
                                                    disabled={isVerifying}
                                                    loading={isVerifying}
                                                >
                                                    Verify & Enable
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* Recovery Codes Display */}
                            {recoveryCodes && (
                                <div className="mt-6 space-y-4 border-t border-dashed pt-6 animate-in fade-in zoom-in-95 duration-300">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                                            <ShieldCheck size={16} />
                                            Recovery Codes Generated
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={downloadRecoveryCodes}
                                                disabled={isCodesHidden}
                                                title={isCodesHidden ? "Codes already saved" : "Download codes as .txt - This can only be done now"}
                                                className={`text-xs flex items-center gap-1.5 font-medium transition-all ${isCodesHidden ? "text-muted-foreground cursor-not-allowed opacity-50" : "text-primary hover:underline"}`}
                                            >
                                                <Download size={14} />
                                                Download
                                            </button>
                                            <button
                                                onClick={copyToClipboard}
                                                disabled={isCodesHidden}
                                                title={isCodesHidden ? "Codes already saved" : "Copy all codes - This can only be done now"}
                                                className={`text-xs flex items-center gap-1.5 font-medium transition-all ${isCodesHidden ? "text-muted-foreground cursor-not-allowed opacity-50" : "text-primary hover:underline"}`}
                                            >
                                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                                {copied ? "Copied!" : "Copy All"}
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground bg-muted/50 p-3 rounded-lg border border-dashed border-muted-foreground/30">
                                        Save these codes in a secure place. Each code can be used once to log in if you lose access to your authenticator app.
                                    </p>
                                    {isCodesHidden ? (
                                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center space-y-2 animate-in fade-in zoom-in-95 duration-500">
                                            <ShieldCheck className="mx-auto text-primary" size={32} />
                                            <p className="text-sm font-bold">Codes Secured & Hidden</p>
                                            <p className="text-[11px] text-muted-foreground italic px-4">
                                                You have successfully saved your recovery codes. They are now hidden from view for your security.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            {recoveryCodes.map((code, idx) => (
                                                <div key={idx} className="bg-background border rounded-lg py-2 px-3 text-center font-mono text-xs font-bold tracking-wider">
                                                    {code}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <Button fullWidth className="rounded-xl h-10 mt-2" onClick={finishSetup}>
                                        I've saved these codes
                                    </Button>
                                </div>
                            )}

                            {/* Disable Phase */}
                            {isDisabling && (
                                <div className="mt-6 space-y-4 border-t border-dashed pt-6 animate-in fade-in zoom-in-95 duration-300">
                                    <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                                        <ShieldAlert size={16} />
                                        Disable Two-Factor Authentication
                                    </div>
                                    <div className="rounded-xl bg-background p-4 border space-y-3">
                                        <p className="text-xs text-muted-foreground text-center">Please enter the 6-digit code from your app or a recovery code to confirm.</p>
                                        <form onSubmit={handleSubmitDisable(onDisableSubmit)} className="space-y-3">
                                            <Input
                                                placeholder="Code"
                                                register={registerDisable("code")}
                                                error={errorsDisable.code?.message}
                                                inputClassName="text-center font-bold text-lg"
                                                onChange={(e) => {
                                                    const val = e.target.value.toUpperCase();
                                                    setValueDisable("code", val);
                                                }}
                                                value={disableCodeValue}
                                            />
                                            <div className="flex gap-2">
                                                <Button variant="ghost" className="flex-1 rounded-xl text-xs h-9" onClick={() => { setIsDisabling(false); resetDisable(); }}>Cancel</Button>
                                                <Button
                                                    type="submit"
                                                    variant="danger"
                                                    className="flex-1 rounded-xl text-xs h-9"
                                                    disabled={isDisablePending}
                                                    loading={isDisablePending}
                                                >
                                                    Confirm Disable
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
