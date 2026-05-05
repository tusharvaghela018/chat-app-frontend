import { useState, useEffect } from "react";
import Modal from "@/common/Modal";
import Button from "@/common/Button";
import Input from "@/common/Input";
import { AlertCircle, Trash2, Info } from "lucide-react";
import { decryptPrivateKey, type EncryptedVault } from "@/utils/vault";
import { storeLocalPrivateKey } from "@/utils/indexeddb";
import { setSessionKeys } from "@/utils/crypto";
import { BsFillLockFill, BsFillUnlockFill } from "react-icons/bs";
import { Link, useLocation } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

interface Props {
    open: boolean;
    vault: string; // JSON string
    salt: string;
    publicKey: string;
    onComplete: () => void;
    onReset: () => void; // Added for PIN reset
}

const UnlockVaultModal = ({ open, vault, salt, publicKey, onComplete, onReset }: Props) => {
    const location = useLocation();
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetLoading] = useState(false);

    // Reset state whenever modal opens or location changes (e.g. going back from privacy policy)
    useEffect(() => {
        if (open) {
            setPin("");
            setError("");
            setIsUnlocked(false);
            setShowResetConfirm(false);
        }
    }, [open, location.pathname]);

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

            // 4. Success Animation
            setIsUnlocked(true);
            setTimeout(() => {
                onComplete();
            }, 800);
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

    const handleResetPIN = async () => {
        // Just notify parent to switch to Setup mode
        onReset();
        setShowResetConfirm(false);
    };

    if (showResetConfirm) {
        return (
            <Modal open={open} onClose={() => setShowResetConfirm(false)} title="Reset Chat PIN?">
                <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex gap-4">
                        <div className="text-destructive shrink-0">
                            <Trash2 size={24} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-destructive uppercase tracking-wider">Warning</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                After resetting your PIN, your <span className="text-foreground font-bold">old chats cannot be recovered</span>. All existing encrypted messages will become unreadable.
                            </p>
                        </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-xl space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                            <Info size={14} />
                            What happens next?
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
                            <li>Your current security keys will be deleted.</li>
                            <li>You will be prompted to set up a new Chat PIN.</li>
                            <li>Your contact list and groups will remain, but message history will be lost.</li>
                        </ul>
                        <p className="text-[10px] text-muted-foreground leading-relaxed pt-2">
                            For more information, please read our <Link to={ROUTES.PRIVACY_POLICY.path} className="text-primary font-bold hover:underline">Privacy Policy</Link>.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button 
                            variant="secondary" 
                            fullWidth 
                            onClick={() => setShowResetConfirm(false)}
                            disabled={resetLoading}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="danger" 
                            fullWidth 
                            onClick={handleResetPIN}
                            loading={resetLoading}
                        >
                            Reset Everything
                        </Button>
                    </div>
                </div>
            </Modal>
        );
    }

    return (
        <Modal open={open} onClose={() => {}} title="Unlock Your Messages">
            <div className="space-y-6">
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
                        isUnlocked 
                        ? "bg-green-500 text-white scale-110 rotate-[360deg]" 
                        : "bg-primary/10 text-primary"
                    }`}>
                        {isUnlocked ? <BsFillUnlockFill size={36} /> : <BsFillLockFill size={36} />}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Identity Verification</h3>
                        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                            {isUnlocked 
                                ? "Vault decrypted successfully. Entering chat..." 
                                : "Messages are encrypted on this device. Enter your Chat PIN to restore your keys."
                            }
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
                        leftIcon={<BsFillLockFill size={16} />}
                        disabled={loading || isUnlocked}
                        onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                        autoFocus
                    />
                    <div className="flex justify-end">
                        <button 
                            type="button"
                            onClick={() => setShowResetConfirm(true)}
                            className="text-xs font-bold text-primary hover:underline transition-all opacity-80 hover:opacity-100"
                        >
                            Forgot PIN?
                        </button>
                    </div>
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
                        disabled={isUnlocked}
                        className={`rounded-xl h-12 text-sm font-bold transition-all duration-300 ${
                            isUnlocked ? "bg-green-500 hover:bg-green-600 scale-95 opacity-0" : ""
                        }`}
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
