import CryptoJS from "crypto-js"

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "your-secret-key-here"

export const encryptMessage = (message) => {
  try {
    return CryptoJS.AES.encrypt(message, ENCRYPTION_KEY).toString()
  } catch (error) {
    console.error("Encryption failed:", error)
    return message // Fallback to plain text
  }
}

export const decryptMessage = (encryptedMessage) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, ENCRYPTION_KEY)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    return decrypted || "[Unable to decrypt]"
  } catch (error) {
    console.error("Decryption failed:", error)
    return "[Encrypted Message]"
  }
}

export const generateChatId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9)
}
