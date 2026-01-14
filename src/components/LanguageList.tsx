import { useState } from "react"
import { IconPlus, IconTrash, IconChevronUp, IconChevronDown } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { LanguageCombobox } from "@/components/LanguageCombobox"
import { Language } from "@/types"

export const LanguageList = ({ languages, onChange }: Props) => {
  const [pendingLanguage, setPendingLanguage] = useState<Language | null>(null)
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
    if (!pendingLanguage) return

    if (languages.some(lang => lang.code === pendingLanguage.code)) {
      setError("Language already added")
      return
    }

    onChange([...languages, pendingLanguage])
    setPendingLanguage(null)
    setError(null)
  }

  // Get codes of already-added languages to exclude from autocomplete
  const excludedCodes = languages.map(lang => lang.code)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {languages.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">No languages configured</p>
        ) : (
          languages.map((language, index) => (
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
        )}
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <LanguageCombobox
              value={pendingLanguage}
              onChange={lang => {
                setPendingLanguage(lang)
                setError(null)
              }}
              excludeCodes={excludedCodes}
              placeholder="Add a language..."
            />
          </div>
          <Button onClick={handleAdd} disabled={!pendingLanguage} size="icon" aria-label="Add">
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
