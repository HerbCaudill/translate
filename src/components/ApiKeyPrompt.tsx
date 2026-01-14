import { useState } from "react"
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

// Check if a string looks like an Anthropic API key format
const looksLikeApiKey = (text: string): boolean => {
  return text.trim().startsWith("sk-ant-")
}

export const ApiKeyPrompt = ({ onSubmit }: Props) => {
  const [apiKey, setApiKey] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitApiKey = async (key: string) => {
    if (!key.trim()) return

    setIsSubmitting(true)
    setError(null)

    const result = await validateApiKey(key.trim())

    if (!result.valid) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    await onSubmit(key.trim())
    setIsSubmitting(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitApiKey(apiKey)
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text")
    if (looksLikeApiKey(pastedText)) {
      // Prevent default paste so we can handle it ourselves
      e.preventDefault()
      setApiKey(pastedText.trim())
      await submitApiKey(pastedText)
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
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                onPaste={handlePaste}
                autoFocus
                disabled={isSubmitting}
                aria-label="API key"
              />
              <p className="text-muted-foreground text-sm">
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
            <Button type="submit" className="w-full" disabled={!apiKey.trim() || isSubmitting}>
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
