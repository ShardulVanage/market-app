// Utility function to handle message decryption with fallback
export const safeDecryptMessage = (message) => {
  // If message looks like encrypted text (base64-like), try to handle it
  if (typeof message === "string" && message.includes("U2FsdGVk")) {
    // This appears to be encrypted, but since we removed encryption,
    // we'll return a fallback message
    return "[Message could not be decrypted - please send a new message]"
  }

  // Return the message as-is if it's plain text
  return message
}

export const isEncryptedMessage = (message) => {
  return typeof message === "string" && message.includes("U2FsdGVk")
}
