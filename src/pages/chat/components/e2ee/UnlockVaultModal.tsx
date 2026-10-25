import { useState, useEffect } from "react";
import Modal from "@/common/Modal";
import Input from "@/common/Input";
import { AlertCircle, Trash2, Info, Lock, Unlock, ShieldAlert, Loader2, KeyRound } from "lucide-react";
import { decryptPrivateKey, type EncryptedVault } from "@/utils/vault";
import { storeLocalPrivateKey } from "@/utils/indexeddb";
import { setSessionKeys } from "@/utils/crypto";
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

    // Reset state whenever modal opens or location changes
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
        onReset();
        setShowResetConfirm(false);
    };

    if (showResetConfirm) {
        const renderResetFooter = (
            <div className="flex items-center justify-end gap-3 w-full">
                <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleResetPIN}
                    className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/25 transition-all active:scale-95 cursor-pointer"
                >
                    Reset Everything
                </button>
            </div>
        );

        return (
            <Modal
                open={open}
                onClose={() => setShowResetConfirm(false)}
                title="Reset Chat PIN?"
                subtitle="Irreversible security action"
                icon={<Trash2 size={20} />}
                maxWidth="max-w-md"
                footer={renderResetFooter}
            >
                <div className="space-y-4 py-1">
                    <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 flex gap-3.5">
                        <div className="text-red-500 shrink-0 mt-0.5">
                            <ShieldAlert size={20} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                                Permanent Data Loss Warning
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                After resetting your PIN, your <span className="font-bold text-slate-900 dark:text-white">old chats cannot be recovered</span>. All existing encrypted messages will become unreadable.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <Info size={14} className="text-purple-600 dark:text-purple-400" />
                            <span>What happens next?</span>
                        </div>
                        <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 list-disc pl-4 leading-relaxed">
                            <li>Your current security keys will be deleted.</li>
                            <li>You will be prompted to set up a new Chat PIN.</li>
                            <li>Your contact list and groups will remain, but message history will be lost.</li>
                        </ul>
                        <p className="text-[11px] text-slate-400 pt-1">
                            For more information, please read our{" "}
                            <Link to={ROUTES.PRIVACY_POLICY.path} className="text-purple-600 dark:text-purple-400 font-bold hover:underline">
                                Privacy Policy
                            </Link>.
                        </p>
                    </div>
                </div>
            </Modal>
        );
    }

    const renderFooter = (
        <div className="w-full space-y-3">
            <button
                type="button"
                onClick={handleUnlock}
                disabled={loading || isUnlocked}
                className={`w-full py-3 rounded-full text-xs sm:text-sm font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${
                    isUnlocked
                        ? "bg-emerald-600 shadow-emerald-600/30"
                        : "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/25 hover:shadow-purple-600/40"
                }`}
            >
                {loading ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Verifying PIN...</span>
                    </>
                ) : isUnlocked ? (
                    <>
                        <Unlock size={16} />
                        <span>Vault Decrypted</span>
                    </>
                ) : (
                    <span>Access Chats</span>
                )}
            </button>

            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Lock size={11} className="text-purple-500" />
                <span>Your PIN never leaves this device.</span>
            </p>
        </div>
    );

    return (
        <Modal
            open={open}
            onClose={() => {}}
            title="Unlock Your Messages"
            subtitle="End-to-end encrypted identity verification"
            icon={<Lock size={20} />}
            maxWidth="max-w-md"
            footer={renderFooter}
        >
            <div className="space-y-6 py-2">
                {/* Hero Icon & Title */}
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`w-18 h-18 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-xl ${
                        isUnlocked 
                            ? "bg-emerald-500 text-white scale-110 rotate-[360deg] shadow-emerald-500/30" 
                            : "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-purple-600/30"
                    }`}>
                        {isUnlocked ? <Unlock size={32} /> : <Lock size={32} className="stroke-[2.2]" />}
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                            Identity Verification
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mt-1">
                            {isUnlocked 
                                ? "Vault decrypted successfully. Entering chat..." 
                                : "Messages are encrypted on this device. Enter your Chat PIN to restore your keys."
                            }
                        </p>
                    </div>
                </div>

                {/* Input Field */}
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-0.5">
                            Chat PIN
                        </label>
                        <Input
                            type="password"
                            placeholder="Enter your 6-digit PIN"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            leftIcon={<KeyRound size={16} className="text-slate-400" />}
                            disabled={loading || isUnlocked}
                            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                            autoFocus
                            inputClassName="!bg-slate-50 dark:!bg-slate-900/80 !border-slate-200 dark:!border-slate-700/80 focus:!border-purple-500 focus:!ring-purple-500/20 rounded-xl text-center tracking-[0.3em] font-mono text-base"
                        />
                    </div>

                    <div className="flex justify-end">
                        <button 
                            type="button"
                            onClick={() => setShowResetConfirm(true)}
                            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer"
                        >
                            Forgot PIN?
                        </button>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs font-medium animate-in slide-in-from-top-1">
                        <AlertCircle size={15} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default UnlockVaultModal;
