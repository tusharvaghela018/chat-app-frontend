/**
 * Utilities for AES-GCM encryption and PBKDF2 key derivation.
 * Used to encrypt the user's private key before sending it to the server.
 */

const PBKDF2_ITERATIONS = 600000;
const AES_ALGO = 'AES-GCM';

export interface EncryptedVault {
    ciphertext: string; // Base64
    iv: string;         // Base64
}

/**
 * Derives a 256-bit AES key from a PIN and salt using PBKDF2.
 */
async function deriveKey(pin: string, saltBase64: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const salt = Uint8Array.from(atob(saltBase64), (c) => c.charCodeAt(0));
    
    // Import the raw PIN as a key material
    const baseKey = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(pin),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    // Derive the final AES key
    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256',
        },
        baseKey,
        { name: AES_ALGO, length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypts a private key using a PIN.
 * Returns the ciphertext, IV, and the Salt used.
 */
export async function encryptPrivateKey(
    privateKeyBase64: string,
    pin: string
): Promise<{ vault: EncryptedVault; salt: string }> {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const saltBase64 = btoa(String.fromCharCode(...salt));
    
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptionKey = await deriveKey(pin, saltBase64);
    
    const encoder = new TextEncoder();
    const ciphertextBuffer = await window.crypto.subtle.encrypt(
        { name: AES_ALGO, iv },
        encryptionKey,
        encoder.encode(privateKeyBase64)
    );

    return {
        vault: {
            ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertextBuffer))),
            iv: btoa(String.fromCharCode(...iv)),
        },
        salt: saltBase64,
    };
}

/**
 * Decrypts a private key using a PIN and the stored vault data.
 */
export async function decryptPrivateKey(
    vault: EncryptedVault,
    salt: string,
    pin: string
): Promise<string> {
    const encryptionKey = await deriveKey(pin, salt);
    
    const iv = Uint8Array.from(atob(vault.iv), (c) => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(vault.ciphertext), (c) => c.charCodeAt(0));

    try {
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: AES_ALGO, iv },
            encryptionKey,
            ciphertext
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    } catch (e) {
        throw new Error('INVALID_PIN');
    }
}
