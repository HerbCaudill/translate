import { useState } from "react"
import { IconKey, IconExternalLink } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const ApiKeyPrompt = ({ onSubmit }: Props) => {
  const [apiKey, setApiKey] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit(apiKey.trim())
    } finally {
      setIsSubmitting(false)
    }
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="api-key">API key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="sk-ant-..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                autoFocus
                disabled={isSubmitting}
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
