import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Modal from "@/common/Modal";
import Button from "@/common/Button";
import Input from "@/common/Input";
import { ShieldCheck, Lock, AlertCircle, ShieldAlert } from "lucide-react";
import nacl from 'tweetnacl';
import { encodeBase64 } from 'tweetnacl-util';
import { encryptPrivateKey } from "@/utils/vault";
import { storeLocalPrivateKey } from "@/utils/indexeddb";
import { setSessionKeys } from "@/utils/crypto";

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
});

type SetupForm = yup.InferType<typeof setupSchema>;

const SetupVaultModal = ({ open, onComplete }: Props) => {
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SetupForm>({
        resolver: yupResolver(setupSchema),
    });

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

            // 5. Notify parent to save to backend
            onComplete({
                public_key: publicKey,
                encrypted_vault: JSON.stringify(vault),
                vault_salt: salt
            });
        } catch (e) {
            console.error(e);
            setServerError("Failed to secure vault. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={() => {}} title="Activate Privacy Guard">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Secure Your Privacy</h3>
                        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                            To ensure only <span className="text-foreground font-bold italic">YOU</span> can read your messages, we need to create an encrypted vault.
                        </p>
                    </div>
                </div>

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
                        leftIcon={<Lock size={16} />}
                        disabled={loading}
                        register={register("pin")}
                        error={errors.pin?.message}
                    />
                    <Input
                        label="Confirm Chat PIN"
                        type="password"
                        placeholder="Repeat your secret PIN"
                        leftIcon={<Lock size={16} />}
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

                <div className="pt-2">
                    <Button 
                        fullWidth 
                        type="submit"
                        loading={loading}
                        className="rounded-xl h-12 text-sm font-bold shadow-lg shadow-primary/20"
                    >
                        Initialize Private Chat
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground mt-4 leading-relaxed font-medium">
                        Remember: Your PIN is never stored on our servers. If lost, your old messages cannot be recovered.
                    </p>
                </div>
            </form>
        </Modal>
    );
};

export default SetupVaultModal;
