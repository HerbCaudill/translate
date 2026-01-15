import { useState } from "react"
import { IconHistory } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { HistoryView } from "@/components/HistoryView"
import { HistoryEntry } from "@/types"

export const HistoryDialog = ({
  history,
  onSelectEntry,
  onRemoveEntry,
  className,
}: Props) => {
  const [open, setOpen] = useState(false)

  const handleSelectEntry = (entry: HistoryEntry) => {
    onSelectEntry(entry)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="History" className={className}>
          <IconHistory className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>History</DialogTitle>
        </DialogHeader>
        <HistoryView
          history={history}
          onSelectEntry={handleSelectEntry}
          onRemoveEntry={onRemoveEntry}
        />
      </DialogContent>
    </Dialog>
  )
}

type Props = {
  history: HistoryEntry[]
  onSelectEntry: (entry: HistoryEntry) => void
  onRemoveEntry: (id: string) => void
  className?: string
}
