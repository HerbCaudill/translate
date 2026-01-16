import * as crypto from "crypto"
import * as fs from "fs"
import * as path from "path"
import * as readline from "readline"

const ITERATIONS = 100_000

const loadEnvApiKey = (): string | undefined => {
  const envPath = path.join(import.meta.dirname, "..", ".env")
  if (!fs.existsSync(envPath)) return undefined

  const envContent = fs.readFileSync(envPath, "utf8")
  const match = envContent.match(/VITE_ANTHROPIC_API_KEY=["']?([^"'\n]+)["']?/)
  return match?.[1]
}
const KEY_LENGTH = 32 // 256 bits for AES-256
const SALT_LENGTH = 16
const IV_LENGTH = 12 // 96 bits for GCM

const question = (rl: readline.Interface, prompt: string): Promise<string> => {
  return new Promise(resolve => {
    rl.question(prompt, resolve)
  })
}

const deriveKey = (password: string, salt: Buffer): Buffer => {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha256")
}

const encrypt = (
  plaintext: string,
  password: string,
): { salt: string; iv: string; ciphertext: string } => {
  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = deriveKey(password, salt)

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()

  // Append auth tag to ciphertext (GCM standard practice)
  const ciphertextWithTag = Buffer.concat([encrypted, authTag])

  return {
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    ciphertext: ciphertextWithTag.toString("base64"),
  }
}

const main = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  try {
    const envApiKey = loadEnvApiKey()
    let apiKey: string

    if (envApiKey) {
      console.log(`Using API key from .env (${envApiKey.slice(0, 15)}...)`)
      apiKey = envApiKey
    } else {
      apiKey = await question(rl, "Enter your Anthropic API key: ")
      if (!apiKey.trim()) {
        console.error("API key is required")
        process.exit(1)
      }
    }

    const password = await question(rl, "Enter encryption password: ")
    if (!password.trim()) {
      console.error("Password is required")
      process.exit(1)
    }

    if (password.length < 4) {
      console.error("Password should be at least 4 characters")
      process.exit(1)
    }

    const encrypted = encrypt(apiKey.trim(), password.trim())

    const outputPath = path.join(import.meta.dirname, "..", "src", "encrypted-key.json")
    fs.writeFileSync(outputPath, JSON.stringify(encrypted, null, 2) + "\n")

    console.log(`\nEncrypted key written to: ${outputPath}`)
    console.log("Users can now enter the password instead of the full API key.")
  } finally {
    rl.close()
  }
}

main()
