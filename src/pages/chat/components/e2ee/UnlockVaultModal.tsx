import { useState } from "react";
import Modal from "@/common/Modal";
import Button from "@/common/Button";
import Input from "@/common/Input";
import { Lock, Unlock, AlertCircle } from "lucide-react";
import { decryptPrivateKey, type EncryptedVault } from "@/utils/vault";
import { storeLocalPrivateKey } from "@/utils/indexeddb";
import { setSessionKeys } from "@/utils/crypto";

interface Props {
    open: boolean;
    vault: string; // JSON string
    salt: string;
    publicKey: string;
    onComplete: () => void;
}

const UnlockVaultModal = ({ open, vault, salt, publicKey, onComplete }: Props) => {
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleUnlock = async () => {
        if (pin.length < 6) {
            setError("PIN must be at least 6 digits");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const parsedVault = JSON.parse(vault) as EncryptedVault;
            
            // 1. Decrypt private key with PIN
            const privateKey = await decryptPrivateKey(parsedVault, salt, pin);

            // 2. Store locally in IndexedDB
            await storeLocalPrivateKey(privateKey);
            
            // 3. Update session memory
            setSessionKeys({ publicKey, secretKey: privateKey });

            // 4. Success
            onComplete();
        } catch (e: any) {
            console.error(e);
            if (e.message === 'INVALID_PIN') {
                setError("Incorrect PIN. Please try again.");
            } else {
                setError("Failed to unlock messages. Is your PIN correct?");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={() => {}} title="Unlock Your Messages">
            <div className="space-y-6">
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-inner animate-in zoom-in duration-300">
                        <Unlock size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Identity Verification</h3>
                        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                            Messages are encrypted on this device. Enter your Chat PIN to restore your keys.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <Input
                        label="Chat PIN"
                        type="password"
                        placeholder="Enter your 6-digit PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        leftIcon={<Lock size={16} />}
                        disabled={loading}
                        onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                        autoFocus
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium animate-in slide-in-from-top-1">
                        <AlertCircle size={14} />
                        {error}
                    </div>
                )}

                <div className="pt-2">
                    <Button 
                        fullWidth 
                        onClick={handleUnlock} 
                        loading={loading}
                        className="rounded-xl h-11"
                    >
                        Access Chats
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground mt-4 leading-relaxed uppercase tracking-wider font-bold opacity-60">
                        Your PIN never leaves this device.
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default UnlockVaultModal;
