import { IconDownload } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export function InstallPrompt({ canInstall, onInstall }: Props) {
  if (!canInstall) {
    return null
  }

  return (
    <Button variant="ghost" size="icon" onClick={onInstall} title="Install app">
      <IconDownload className="h-5 w-5" />
    </Button>
  )
}

type Props = {
  canInstall: boolean
  onInstall: () => void
}
