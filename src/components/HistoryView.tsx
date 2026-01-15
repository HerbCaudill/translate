import { useState, useMemo } from "react"
import { IconSearch, IconTrash } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HistoryEntry } from "@/types"

const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return "just now"
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`

  return new Date(timestamp).toLocaleDateString()
}

export const HistoryView = ({ history, onSelectEntry, onRemoveEntry }: Props) => {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history
    const query = searchQuery.toLowerCase()
    return history.filter(entry => entry.input.toLowerCase().includes(query))
  }, [history, searchQuery])

  const hasHistory = history.length > 0
  const hasResults = filteredHistory.length > 0

  if (!hasHistory) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No history yet</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <IconSearch className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search history..."
          className="pl-9"
        />
      </div>

      {!hasResults ?
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-muted-foreground">No matching entries</p>
        </div>
      : <div className="max-h-80 overflow-y-auto">
          <ul className="flex flex-col gap-2">
            {filteredHistory.map(entry => (
              <li key={entry.id} className="group relative">
                <button
                  onClick={() => onSelectEntry(entry)}
                  className="hover:bg-muted/50 flex w-full flex-col items-start gap-1 rounded-lg border p-3 pr-10 text-left transition-colors"
                >
                  <span className="line-clamp-2">{entry.input}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatRelativeTime(entry.createdAt)}
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2"
                  onClick={e => {
                    e.stopPropagation()
                    onRemoveEntry(entry.id)
                  }}
                  aria-label={`Delete "${entry.input}"`}
                >
                  <IconTrash className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      }
    </div>
  )
}

type Props = {
  history: HistoryEntry[]
  onSelectEntry: (entry: HistoryEntry) => void
  onRemoveEntry: (id: string) => void
}
