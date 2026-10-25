import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Modal from "@/common/Modal";
import Input from "@/common/Input";
import { ShieldCheck, AlertCircle, ShieldAlert, KeyRound, Loader2, Lock } from "lucide-react";
import nacl from 'tweetnacl';
import { encodeBase64 } from 'tweetnacl-util';
import { encryptPrivateKey } from "@/utils/vault";
import { storeLocalPrivateKey } from "@/utils/indexeddb";
import { setSessionKeys } from "@/utils/crypto";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

interface Props {
    open: boolean;
    onComplete: (data: { public_key: string; encrypted_vault: string; vault_salt: string }) => void;
}

const setupSchema = yup.object({
    pin: yup
        .string()
        .required("PIN is required")
        .min(6, "PIN must be at least 6 characters")
        .test("no-3-repeats", "PIN cannot contain 3 or more identical characters in a row (e.g. 111)", (val) => {
            if (!val) return true;
            return !/(.)\1{2,}/.test(val);
        })
        .test("not-predictable", "This PIN is too common or predictable", (val) => {
            if (!val) return true;
            const common = ["123456", "654321", "121212", "112233", "112244"];
            return !common.includes(val);
        }),
    confirmPin: yup
        .string()
        .required("Please confirm your PIN")
        .oneOf([yup.ref("pin")], "PINs do not match"),
    agreed: yup
        .boolean()
        .required("You must agree to the Privacy Policy")
        .oneOf([true], "You must agree to the Privacy Policy")
});

type SetupForm = yup.InferType<typeof setupSchema>;

const SetupVaultModal = ({ open, onComplete }: Props) => {
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<SetupForm>({
        resolver: yupResolver(setupSchema),
        defaultValues: {
            agreed: false
        }
    });

    const isAgreed = watch("agreed");

    const onSubmit = async (data: SetupForm) => {
        setLoading(true);
        setServerError("");

        try {
            // 1. Generate new E2EE Keypair
            const keyPair = nacl.box.keyPair();
            const publicKey = encodeBase64(keyPair.publicKey);
            const privateKey = encodeBase64(keyPair.secretKey);

            // 2. Encrypt private key with PIN
            const { vault, salt } = await encryptPrivateKey(privateKey, data.pin);

            // 3. Store locally in IndexedDB
            await storeLocalPrivateKey(privateKey);
            
            // 4. Update session memory
            setSessionKeys({ publicKey, secretKey: privateKey });

            // 5. Success Animation
            setIsSuccess(true);
            setTimeout(() => {
                onComplete({
                    public_key: publicKey,
                    encrypted_vault: JSON.stringify(vault),
                    vault_salt: salt
                });
            }, 800);
        } catch (e) {
            console.error(e);
            setServerError("Failed to secure vault. Please try again.");
            setLoading(false);
        }
    };

    const renderFooter = (
        <div className="w-full space-y-3">
            <button
                type="submit"
                form="setup-vault-form"
                disabled={!isAgreed || loading || isSuccess}
                className="w-full py-3 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Initializing Vault...</span>
                    </>
                ) : isSuccess ? (
                    <>
                        <ShieldCheck size={16} />
                        <span>Privacy Guard Active!</span>
                    </>
                ) : (
                    <span>Initialize Private Chat</span>
                )}
            </button>

            <p className="text-[10px] text-center text-slate-400 font-semibold leading-relaxed">
                Remember: Your PIN is never stored on our servers. If lost, old messages cannot be recovered.
            </p>
        </div>
    );

    return (
        <Modal
            open={open}
            onClose={() => {}}
            title="Activate Privacy Guard"
            subtitle="Client-side end-to-end encryption setup"
            icon={<ShieldCheck size={20} />}
            maxWidth="max-w-md"
            footer={renderFooter}
        >
            <form id="setup-vault-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
                {/* Hero Icon */}
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`w-18 h-18 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-xl ${
                        isSuccess 
                            ? "bg-emerald-500 text-white scale-110 rotate-[360deg] shadow-emerald-500/30" 
                            : "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-purple-600/30"
                    }`}>
                        {isSuccess ? <ShieldCheck size={32} /> : <Lock size={32} className="stroke-[2.2]" />}
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                            {isSuccess ? "Privacy Activated!" : "Secure Your Privacy"}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mt-1">
                            {isSuccess 
                                ? "Your encrypted vault has been created successfully." 
                                : "To ensure only YOU can read your messages, create a secret Chat PIN to protect your keys."
                            }
                        </p>
                    </div>
                </div>

                <div className={`space-y-4 transition-all duration-300 ${isSuccess ? "opacity-0 scale-95 pointer-events-none" : "opacity-100"}`}>
                    {/* Security Tip Box */}
                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 space-y-1">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                            <ShieldAlert size={15} />
                            <span className="text-[11px] font-bold uppercase tracking-wider">Security Rule</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                            Don't use easy patterns like <span className="font-mono font-bold">111...</span> or <span className="font-mono font-bold">123456</span>. Your PIN must be unique and non-predictable.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Input
                            label="Create Chat PIN"
                            type="password"
                            placeholder="At least 6 characters"
                            leftIcon={<KeyRound size={16} className="text-slate-400" />}
                            disabled={loading}
                            register={register("pin")}
                            error={errors.pin?.message}
                            inputClassName="!bg-slate-50 dark:!bg-slate-900/80 !border-slate-200 dark:!border-slate-700/80 focus:!border-purple-500 focus:!ring-purple-500/20 rounded-xl"
                        />
                        <Input
                            label="Confirm Chat PIN"
                            type="password"
                            placeholder="Repeat your secret PIN"
                            leftIcon={<KeyRound size={16} className="text-slate-400" />}
                            disabled={loading}
                            register={register("confirmPin")}
                            error={errors.confirmPin?.message}
                            inputClassName="!bg-slate-50 dark:!bg-slate-900/80 !border-slate-200 dark:!border-slate-700/80 focus:!border-purple-500 focus:!ring-purple-500/20 rounded-xl"
                        />
                    </div>

                    {serverError && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs font-medium">
                            <AlertCircle size={15} className="shrink-0" />
                            <span>{serverError}</span>
                        </div>
                    )}

                    {/* Agreement Checkbox */}
                    <div className="pt-1">
                        <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-purple-600 accent-purple-600 focus:ring-purple-500/30 cursor-pointer"
                                {...register("agreed")}
                            />
                            <span className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                                I have read and agree to the{" "}
                                <Link to={ROUTES.PRIVACY_POLICY.path} target="_blank" className="text-purple-600 dark:text-purple-400 font-bold hover:underline">
                                    Privacy Policy & Terms
                                </Link>
                            </span>
                        </label>
                        {errors.agreed && <p className="text-[11px] text-red-500 font-medium mt-1 ml-6">{errors.agreed.message}</p>}
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default SetupVaultModal;
