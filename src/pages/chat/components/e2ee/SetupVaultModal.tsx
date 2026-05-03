import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Modal from "@/common/Modal";
import Button from "@/common/Button";
import Input from "@/common/Input";
import { ShieldCheck, AlertCircle, ShieldAlert } from "lucide-react";
import nacl from 'tweetnacl';
import { encodeBase64 } from 'tweetnacl-util';
import { encryptPrivateKey } from "@/utils/vault";
import { storeLocalPrivateKey } from "@/utils/indexeddb";
import { setSessionKeys } from "@/utils/crypto";
import { Link } from "react-router-dom";
import { BsFillLockFill, BsFillShieldLockFill } from "react-icons/bs";

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

    return (
        <Modal open={open} onClose={() => {}} title="Activate Privacy Guard">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
                        isSuccess 
                        ? "bg-green-500 text-white scale-110 rotate-[360deg]" 
                        : "bg-primary/10 text-primary"
                    }`}>
                        {isSuccess ? <BsFillShieldLockFill size={36} /> : <ShieldCheck size={36} />}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">
                            {isSuccess ? "Privacy Activated!" : "Secure Your Privacy"}
                        </h3>
                        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                            {isSuccess 
                                ? "Your encrypted vault has been created successfully." 
                                : "To ensure only YOU can read your messages, we need to create an encrypted vault."
                            }
                        </p>
                    </div>
                </div>

                <div className={`space-y-6 transition-all duration-300 ${isSuccess ? "opacity-0 scale-95 pointer-events-none" : "opacity-100"}`}>
                    <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 space-y-2">
                        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                            <ShieldAlert size={16} />
                            <span className="text-[11px] font-bold uppercase tracking-wider">Security Rule</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Don't use easy patterns like <span className="font-mono">111...</span> or <span className="font-mono">123456</span>. Your PIN should be unique and non-predictable for maximum security.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Input
                            label="Create Chat PIN"
                            type="password"
                            placeholder="At least 6 characters"
                            leftIcon={<BsFillLockFill size={16} />}
                            disabled={loading}
                            register={register("pin")}
                            error={errors.pin?.message}
                        />
                        <Input
                            label="Confirm Chat PIN"
                            type="password"
                            placeholder="Repeat your secret PIN"
                            leftIcon={<BsFillLockFill size={16} />}
                            disabled={loading}
                            register={register("confirmPin")}
                            error={errors.confirmPin?.message}
                        />
                    </div>

                    {serverError && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">
                            <AlertCircle size={14} />
                            {serverError}
                        </div>
                    )}

                    <div className="space-y-4">
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                {...register("agreed")}
                            />
                            <span className="text-xs text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                                I have read and agree to the <Link to="/privacy-policy" target="_blank" className="text-primary font-bold hover:underline">Privacy Policy & Terms</Link>
                            </span>
                        </label>
                        {errors.agreed && <p className="text-[10px] text-destructive font-medium">{errors.agreed.message}</p>}
                    </div>

                    <div className="pt-2">
                        <Button 
                            fullWidth 
                            type="submit"
                            loading={loading}
                            disabled={!isAgreed || loading}
                            className={`rounded-xl h-12 text-sm font-bold shadow-lg transition-all ${!isAgreed ? 'opacity-50 grayscale' : 'shadow-primary/20'}`}
                        >
                            Initialize Private Chat
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground mt-4 leading-relaxed font-medium">
                            Remember: Your PIN is never stored on our servers. If lost, your old messages cannot be recovered.
                        </p>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default SetupVaultModal;
