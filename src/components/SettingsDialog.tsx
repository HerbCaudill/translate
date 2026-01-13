import { useState } from "react"
import { IconSettings, IconRestore } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LanguageList } from "@/components/LanguageList"
import { Language } from "@/types"
import { DEFAULT_SETTINGS } from "@/hooks/useSettings"

export const SettingsDialog = ({
  languages,
  onLanguagesChange,
  translationPrompt,
  onTranslationPromptChange,
  children,
}: Props) => {
  const [open, setOpen] = useState(false)

  const isDefaultPrompt = translationPrompt === DEFAULT_SETTINGS.translationPrompt

  const handleResetPrompt = () => {
    onTranslationPromptChange(DEFAULT_SETTINGS.translationPrompt)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="ghost" size="icon" aria-label="Settings">
            <IconSettings className="size-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Configure your translation preferences.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Target languages</Label>
            <LanguageList languages={languages} onChange={onLanguagesChange} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="translation-prompt">Translation prompt</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetPrompt}
                disabled={isDefaultPrompt}
                className="h-7 gap-1 text-xs"
              >
                <IconRestore className="size-3.5" />
                Reset to default
              </Button>
            </div>
            <Textarea
              id="translation-prompt"
              value={translationPrompt}
              onChange={e => onTranslationPromptChange(e.target.value)}
              rows={6}
              placeholder="Enter your custom translation prompt..."
              className="font-mono text-xs"
            />
            <p className="text-muted-foreground text-xs">
              Use {"{{language}}"} as a placeholder for the target language.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type Props = {
  languages: Language[]
  onLanguagesChange: (languages: Language[]) => void
  translationPrompt: string
  onTranslationPromptChange: (prompt: string) => void
  children?: React.ReactNode
}
