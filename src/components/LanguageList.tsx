import { useState } from "react"
import { IconPlus, IconTrash, IconChevronUp, IconChevronDown } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Language } from "@/types"

export const LanguageList = ({ languages, onChange }: Props) => {
  const [newCode, setNewCode] = useState("")
  const [newName, setNewName] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleRemove = (index: number) => {
    const updated = languages.filter((_, i) => i !== index)
    onChange(updated)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const updated = [...languages]
    ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
    onChange(updated)
  }

  const handleMoveDown = (index: number) => {
    if (index === languages.length - 1) return
    const updated = [...languages]
    ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
    onChange(updated)
  }

  const handleAdd = () => {
    const trimmedCode = newCode.trim().toLowerCase()
    const trimmedName = newName.trim()

    if (!trimmedCode || !trimmedName) return

    if (languages.some(lang => lang.code === trimmedCode)) {
      setError("Language code already exists")
      return
    }

    onChange([...languages, { code: trimmedCode, name: trimmedName }])
    setNewCode("")
    setNewName("")
    setError(null)
  }

  const canAdd = newCode.trim() && newName.trim()

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {languages.length === 0 ?
          <p className="text-muted-foreground py-4 text-center text-sm">No languages configured</p>
        : languages.map((language, index) => (
            <div
              key={language.code}
              data-language={language.code}
              className="bg-muted/50 flex items-center gap-2 rounded-md p-2"
            >
              <span className="bg-muted text-muted-foreground w-10 rounded px-2 py-1 text-center text-xs font-medium">
                {language.code}
              </span>
              <span className="flex-1 text-sm">{language.name}</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  aria-label="Move up"
                >
                  <IconChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === languages.length - 1}
                  aria-label="Move down"
                >
                  <IconChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive h-7 w-7"
                  onClick={() => handleRemove(index)}
                  aria-label="Remove"
                >
                  <IconTrash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        }
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Code (e.g. ja)"
            value={newCode}
            onChange={e => {
              setNewCode(e.target.value)
              setError(null)
            }}
            className="w-24"
          />
          <Input
            placeholder="Name (e.g. Japanese)"
            value={newName}
            onChange={e => {
              setNewName(e.target.value)
              setError(null)
            }}
            className="flex-1"
          />
          <Button onClick={handleAdd} disabled={!canAdd} size="icon" aria-label="Add">
            <IconPlus className="h-4 w-4" />
          </Button>
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>
    </div>
  )
}

type Props = {
  languages: Language[]
  onChange: (languages: Language[]) => void
}
