import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || "", "hex");
const IV_LENGTH = 16; // For AES, this is always 16

export function encrypt(text: string) {
    if (!process.env.ENCRYPTION_KEY) {
        throw new Error("ENCRYPTION_KEY is not set");
    }
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return {
        iv: iv.toString("hex"),
        encryptedData: encrypted.toString("hex"),
    };
}

export function decrypt(text: string, iv: string) {
    if (!process.env.ENCRYPTION_KEY) {
        throw new Error("ENCRYPTION_KEY is not set");
    }
    const ivBuffer = Buffer.from(iv, "hex");
    const encryptedText = Buffer.from(text, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, ivBuffer);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
