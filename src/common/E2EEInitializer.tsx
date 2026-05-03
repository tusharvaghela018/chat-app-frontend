import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { getUser, setUser } from '@/redux/slices/auth.slice';
import { getSessionKeys, setSessionKeys } from '@/utils/crypto';
import { getLocalPrivateKey, clearLocalSecrets } from '@/utils/indexeddb';
import { usePatchApi } from '@/hooks/api';
import SetupVaultModal from '@/pages/chat/components/e2ee/SetupVaultModal';
import UnlockVaultModal from '@/pages/chat/components/e2ee/UnlockVaultModal';
import { ROUTES } from '@/constants/routes';

const E2EEInitializer = () => {
    const user = useSelector(getUser);
    const dispatch = useDispatch();
    const location = useLocation();
    const [showSetup, setShowSetup] = useState(false);
    const [showUnlock, setShowUnlock] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const { mutate: updateSecurityData } = usePatchApi('/users/public-key');

    useEffect(() => {
        const initializeKeys = async () => {
            if (!user || initialized) return;
            
            // Skip showing modals on privacy policy page
            if (location.pathname === ROUTES.PRIVACY_POLICY.path) {
                return;
            }

            console.log("[E2EE] Checking keys for user:", user.email);

            // 1. Check if keys already in memory (this session)
            if (getSessionKeys()) {
                console.log("[E2EE] Keys found in memory.");
                setInitialized(true);
                return;
            }

            // 2. Check IndexedDB for the private key
            const localPrivateKey = await getLocalPrivateKey();

            if (localPrivateKey && user.public_key && !isResetting) {
                console.log("[E2EE] Keys found in IndexedDB. Restoring session.");
                setSessionKeys({
                    publicKey: user.public_key,
                    secretKey: localPrivateKey
                });
                setInitialized(true);
            } else if (user.encrypted_vault && user.vault_salt && user.public_key && !isResetting) {
                console.log("[E2EE] Vault found on server. Prompting for UNLOCK.");
                setShowUnlock(true);
            } else {
                console.log("[E2EE] No security data found (or resetting). Prompting for SETUP.");
                setShowSetup(true);
            }
        };

        initializeKeys();
    }, [user, initialized, location.pathname, isResetting]);

    const handleSetupComplete = async (data: { public_key: string; encrypted_vault: string; vault_salt: string }) => {
        if (isResetting) {
            await clearLocalSecrets();
        }

        updateSecurityData({
            body: data
        }, {
            onSuccess: () => {
                if (user) {
                    dispatch(setUser({ 
                        ...user, 
                        public_key: data.public_key,
                        encrypted_vault: data.encrypted_vault,
                        vault_salt: data.vault_salt
                    }));
                }
                setShowSetup(false);
                setIsResetting(false);
                setInitialized(true);
            }
        });
    };

    const handleUnlockComplete = () => {
        setShowUnlock(false);
        setInitialized(true);
    };

    const handleReset = () => {
        setIsResetting(true);
        setShowUnlock(false);
        setInitialized(false);
    };

    if (!user || location.pathname === ROUTES.PRIVACY_POLICY.path) return null;

    return (
        <>
            <SetupVaultModal 
                open={showSetup} 
                onComplete={handleSetupComplete} 
            />
            
            {user.encrypted_vault && user.vault_salt && user.public_key && (
                <UnlockVaultModal
                    open={showUnlock}
                    vault={user.encrypted_vault}
                    salt={user.vault_salt}
                    publicKey={user.public_key}
                    onComplete={handleUnlockComplete}
                    onReset={handleReset}
                />
            )}
        </>
    );
};

export default E2EEInitializer;
