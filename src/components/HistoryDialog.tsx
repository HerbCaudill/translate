import { useState } from "react"
import { IconHistory } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { HistoryView } from "@/components/HistoryView"
import { HistoryEntry } from "@/types"

export const HistoryDialog = ({ history, onSelectEntry, onClearHistory, className }: Props) => {
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>History</DialogTitle>
          <DialogDescription>View your past translations.</DialogDescription>
        </DialogHeader>
        <HistoryView
          history={history}
          onSelectEntry={handleSelectEntry}
          onClearHistory={onClearHistory}
        />
      </DialogContent>
    </Dialog>
  )
}

type Props = {
  history: HistoryEntry[]
  onSelectEntry: (entry: HistoryEntry) => void
  onClearHistory: () => void
  className?: string
}
