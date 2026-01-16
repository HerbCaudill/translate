const ITERATIONS = 100_000
const KEY_LENGTH = 32 // 256 bits for AES-256

type EncryptedData = {
  salt: string
  iv: string
  ciphertext: string
}

const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  )

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: KEY_LENGTH * 8 },
    false,
    ["decrypt"],
  )
}

const base64ToUint8Array = (base64: string): Uint8Array => {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export const decryptApiKey = async (password: string): Promise<string> => {
  // Dynamic import of the encrypted key file
  const encryptedData: EncryptedData = await import("@/encrypted-key.json")

  const salt = base64ToUint8Array(encryptedData.salt)
  const iv = base64ToUint8Array(encryptedData.iv)
  const ciphertextWithTag = base64ToUint8Array(encryptedData.ciphertext)

  const key = await deriveKey(password, salt)

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    ciphertextWithTag as BufferSource,
  )

  return new TextDecoder().decode(decrypted)
}

export const hasEncryptedKey = async (): Promise<boolean> => {
  try {
    await import("@/encrypted-key.json")
    return true
  } catch {
    return false
  }
}
