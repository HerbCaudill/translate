import { useState } from "react"
import { IconPlus, IconTrash, IconGripVertical } from "@tabler/icons-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { LanguageCombobox } from "@/components/LanguageCombobox"
import { Language } from "@/types"

const SortableLanguageItem = ({
  language,
  onRemove,
}: {
  language: Language
  onRemove: () => void
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: language.code,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-language={language.code}
      className={`bg-muted/50 flex items-center gap-2 rounded-md p-2 ${isDragging ? "z-50 opacity-80 shadow-lg" : ""}`}
    >
      <button
        className="text-muted-foreground hover:text-foreground cursor-grab touch-none active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <IconGripVertical className="h-4 w-4" />
      </button>
      <span className="bg-muted text-muted-foreground w-10 rounded px-2 py-1 text-center text-xs font-medium">
        {language.code}
      </span>
      <span className="flex-1 text-sm">{language.name}</span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive h-7 w-7"
          onClick={onRemove}
          aria-label="Remove"
        >
          <IconTrash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export const LanguageList = ({ languages, onChange }: Props) => {
  const [pendingLanguage, setPendingLanguage] = useState<Language | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleRemove = (index: number) => {
    const updated = languages.filter((_, i) => i !== index)
    onChange(updated)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = languages.findIndex(lang => lang.code === active.id)
      const newIndex = languages.findIndex(lang => lang.code === over.id)
      onChange(arrayMove(languages, oldIndex, newIndex))
    }
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={languages.map(l => l.code)} strategy={verticalListSortingStrategy}>
              {languages.map((language, index) => (
                <SortableLanguageItem
                  key={language.code}
                  language={language}
                  onRemove={() => handleRemove(index)}
                />
              ))}
            </SortableContext>
          </DndContext>
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
