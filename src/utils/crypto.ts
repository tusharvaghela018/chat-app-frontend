import nacl from 'tweetnacl';
import { decodeBase64, encodeBase64, decodeUTF8, encodeUTF8 } from 'tweetnacl-util';

export interface KeyPair {
    publicKey: string;
    secretKey: string;
}

export interface EncryptedMessage {
    c: string; // ciphertext (base64)
    n: string; // nonce (base64)
}

/**
 * Fetches keys for the current session.
 * We store the secret key in IndexedDB for security and the public key in localStorage or memory.
 */
let sessionKeys: KeyPair | null = null;

export const setSessionKeys = (keys: KeyPair) => {
    sessionKeys = keys;
};

export const getSessionKeys = (): KeyPair | null => {
    return sessionKeys;
};

/**
 * Encrypts a message for a specific recipient.
 */
export const encryptDirectMessage = (
    message: string,
    recipientPublicKey: string,
    senderSecretKey: string
): EncryptedMessage => {
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const encrypted = nacl.box(
        decodeUTF8(message),
        nonce,
        decodeBase64(recipientPublicKey),
        decodeBase64(senderSecretKey)
    );

    return {
        c: encodeBase64(encrypted),
        n: encodeBase64(nonce),
    };
};

/**
 * Decrypts a direct message.
 */
export const decryptDirectMessage = (
    encryptedMessage: EncryptedMessage,
    senderPublicKey: string,
    recipientSecretKey: string
): string | null => {
    try {
        const decrypted = nacl.box.open(
            decodeBase64(encryptedMessage.c),
            decodeBase64(encryptedMessage.n),
            decodeBase64(senderPublicKey),
            decodeBase64(recipientSecretKey)
        );

        return decrypted ? encodeUTF8(decrypted) : null;
    } catch (e) {
        console.error('Decryption failed', e);
        return null;
    }
};

/**
 * Generates a random symmetric key for group messages.
 */
export const generateGroupKey = (): string => {
    return encodeBase64(nacl.randomBytes(nacl.secretbox.keyLength));
};

/**
 * Encrypts a group payload with a symmetric key.
 */
export const encryptGroupPayload = (
    message: string,
    groupKey: string
): EncryptedMessage => {
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const encrypted = nacl.secretbox(
        decodeUTF8(message),
        nonce,
        decodeBase64(groupKey)
    );

    return {
        c: encodeBase64(encrypted),
        n: encodeBase64(nonce),
    };
};

/**
 * Decrypts a group payload with a symmetric key.
 */
export const decryptGroupPayload = (
    encryptedMessage: EncryptedMessage,
    groupKey: string
): string | null => {
    try {
        const decrypted = nacl.secretbox.open(
            decodeBase64(encryptedMessage.c),
            decodeBase64(encryptedMessage.n),
            decodeBase64(groupKey)
        );

        return decrypted ? encodeUTF8(decrypted) : null;
    } catch (e) {
        console.error('Group decryption failed', e);
        return null;
    }
};

/**
 * Encrypts the Group Key for a specific member so they can decrypt the payload.
 * This is effectively a direct message but for the symmetric key.
 */
export const encryptGroupKeyForMember = (
    groupKey: string,
    memberPublicKey: string,
    senderSecretKey: string
): EncryptedMessage => {
    return encryptDirectMessage(groupKey, memberPublicKey, senderSecretKey);
};

/**
 * Decrypts the Group Key sent to the current user.
 */
export const decryptGroupKey = (
    encryptedGroupKey: EncryptedMessage,
    senderPublicKey: string,
    mySecretKey: string
): string | null => {
    return decryptDirectMessage(encryptedGroupKey, senderPublicKey, mySecretKey);
};
