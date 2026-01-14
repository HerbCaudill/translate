import { useState } from "react"
import { IconSettings } from "@tabler/icons-react"
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
import { LanguageList } from "@/components/LanguageList"
import { Language } from "@/types"

export const SettingsDialog = ({ languages, onLanguagesChange, children }: Props) => {
  const [open, setOpen] = useState(false)

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
        </div>
      </DialogContent>
    </Dialog>
  )
}

type Props = {
  languages: Language[]
  onLanguagesChange: (languages: Language[]) => void
  children?: React.ReactNode
}
