import CryptoJS from 'crypto-js';

const CIT_HMAC_SECRET = "ourSuperSecretKeyEnrollmentAdmin123";
const CIT_AES_KEY_TEXT = "anotherUniqueSuperSecretKeyEnrollmentAdmin123";
const CIT_H_VALUE = "aP9!vB7@kL3#xY5$zQ2^mN8&dR1*oW6%uJ4(eT0)";

const INTERNAL_APP_KEY = "WildcatTunnel_Internal_Security_Key_99"; 

export function encryptPayload(data: any): string {
    return CryptoJS.AES.encrypt(JSON.stringify(data), INTERNAL_APP_KEY).toString();
}

export function decryptPayload(encryptedStr: string): any {
    if (!encryptedStr) return null;
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedStr, INTERNAL_APP_KEY);
        const decoded = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decoded);
    } catch (e) { return null; }
}

export function encrypt(data: object): string {
    const key = CryptoJS.SHA256(CIT_AES_KEY_TEXT);
    const iv = CryptoJS.enc.Utf8.parse(CIT_AES_KEY_TEXT.substring(0, 16));
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key, {
        iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
}

export function decrypt(cipherText: string): any {
    if (!cipherText) return null;
    try {
        const key = CryptoJS.SHA256(CIT_AES_KEY_TEXT);
        const iv = CryptoJS.enc.Utf8.parse(CIT_AES_KEY_TEXT.substring(0, 16));
        const decrypted = CryptoJS.AES.decrypt(cipherText.trim(), key, {
            iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7
        });
        return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
    } catch (e) { return null; }
}

export function getHmacHeaders(method: string) {
    const nonce = `${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;
    const salt = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Base64);
    const message = `${nonce}:studentportal:${method.toUpperCase()}:${salt}:${CIT_H_VALUE}`;
    const signature = CryptoJS.HmacSHA256(message, CIT_HMAC_SECRET).toString(CryptoJS.enc.Hex);
    return {
        "X-HMAC-Signature": signature,
        "X-HMAC-Nonce": nonce,
        "X-HMAC-Salt": salt,
        "X-Origin": "studentportal",
        "Origin": "https://student.cituwits.com",
        "Referer": "https://student.cituwits.com/"
    };
}