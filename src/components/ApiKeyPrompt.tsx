import { useState, useEffect } from "react"
import { IconKey, IconExternalLink } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { validateApiKey } from "@/lib/validateApiKey"
import { decryptSecret, type EncryptedData } from "@herbcaudill/easy-api-key"

const loadEncryptedKey = async (): Promise<EncryptedData | null> => {
  try {
    return await import("@/encrypted-key.json")
  } catch {
    return null
  }
}

// Check if a string looks like an Anthropic API key format
const looksLikeApiKey = (text: string): boolean => {
  return text.trim().startsWith("sk-ant-")
}

export const ApiKeyPrompt = ({ onSubmit }: Props) => {
  const [input, setInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [encryptedKey, setEncryptedKey] = useState<EncryptedData | null>(null)

  useEffect(() => {
    loadEncryptedKey().then(setEncryptedKey)
  }, [])

  const submitInput = async (value: string) => {
    if (!value.trim()) return

    setIsSubmitting(true)
    setError(null)

    let apiKey: string

    // If it looks like an API key, use it directly; otherwise try to decrypt
    if (looksLikeApiKey(value)) {
      apiKey = value.trim()
    } else if (encryptedKey) {
      try {
        apiKey = await decryptSecret(value, encryptedKey)
      } catch {
        setError("Invalid password")
        setIsSubmitting(false)
        return
      }
    } else {
      setError("Invalid API key format")
      setIsSubmitting(false)
      return
    }

    const result = await validateApiKey(apiKey)

    if (!result.valid) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    await onSubmit(apiKey)
    setIsSubmitting(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitInput(input)
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text")
    if (looksLikeApiKey(pastedText)) {
      // Prevent default paste so we can handle it ourselves
      e.preventDefault()
      setInput(pastedText.trim())
      await submitInput(pastedText)
    }
    // Otherwise, let the default paste behavior happen
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconKey className="size-5" />
            API key required
          </CardTitle>
          <CardDescription>
            Enter your Anthropic API key to use the translation service.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Input
                id="api-key"
                type="text"
                placeholder="sk-ant-..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onPaste={handlePaste}
                autoFocus
                disabled={isSubmitting}
                aria-label="API key"
              />
              <p className="text-muted-foreground my-3 text-sm">
                Get your API key from the{" "}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center gap-1 underline underline-offset-2"
                >
                  Anthropic Console
                  <IconExternalLink className="size-3" />
                </a>
              </p>
              {error && <p className="text-destructive text-sm">{error}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={!input.trim() || isSubmitting}>
              {isSubmitting ? "Validating..." : "Save API key"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

type Props = {
  onSubmit: (apiKey: string) => Promise<void>
}
