import { useEffect, useRef, useState, useMemo } from "react"
import { IconArrowRight, IconLoader2, IconHistory } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { HistoryEntry } from "@/types"

const MIN_SEARCH_LENGTH = 3

export const TranslateInput = ({
  value,
  onChange,
  onSubmit,
  onEscape,
  onSelectSuggestion,
  suggestions = [],
  placeholder = "Enter text to translate...",
  disabled = false,
  loading = false,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const suggestionsRef = useRef<HTMLUListElement>(null)

  // Filter suggestions to show only when we have enough characters
  const visibleSuggestions = useMemo(() => {
    if (value.trim().length < MIN_SEARCH_LENGTH) return []
    return suggestions.slice(0, 5) // Limit to 5 suggestions
  }, [value, suggestions])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Show suggestions when there are matches, hide when empty
  useEffect(() => {
    setShowSuggestions(visibleSuggestions.length > 0)
    setSelectedIndex(-1)
  }, [visibleSuggestions])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleSelectSuggestion = (entry: HistoryEntry) => {
    onSelectSuggestion?.(entry)
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && visibleSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex(prev => (prev < visibleSuggestions.length - 1 ? prev + 1 : prev))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault()
        handleSelectSuggestion(visibleSuggestions[selectedIndex])
        return
      } else if (e.key === "Escape") {
        setShowSuggestions(false)
        setSelectedIndex(-1)
        return
      }
    }

    if (e.key === "Enter" && value.trim()) {
      e.preventDefault()
      setShowSuggestions(false)
      onSubmit()
    } else if (e.key === "Escape") {
      onEscape?.()
    }
  }

  const handleSubmit = () => {
    if (value.trim()) {
      setShowSuggestions(false)
      onSubmit()
    }
  }

  const handleBlur = (e: React.FocusEvent) => {
    // Check if the new focus target is within the suggestions list
    if (suggestionsRef.current?.contains(e.relatedTarget as Node)) {
      return
    }
    // Delay hiding to allow click events to fire
    setTimeout(() => setShowSuggestions(false), 150)
  }

  const handleFocus = () => {
    inputRef.current?.select()
  }

  return (
    <div className="relative flex gap-2">
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="border-white/20 bg-white font-mono text-sm focus-visible:border-white/20 focus-visible:ring-0"
        />
        {showSuggestions && (
          <ul
            ref={suggestionsRef}
            className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border bg-white shadow-lg"
            role="listbox"
          >
            {visibleSuggestions.map((entry, index) => (
              <li
                key={entry.id}
                role="option"
                aria-selected={index === selectedIndex}
                className={cn(
                  "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm",
                  index === selectedIndex ? "bg-blue-50" : "hover:bg-gray-50",
                )}
                onClick={() => handleSelectSuggestion(entry)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <IconHistory className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="truncate font-mono text-gray-700">{entry.input}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Button
        onClick={handleSubmit}
        disabled={disabled || !value.trim() || loading}
        size="icon"
        className={cn(
          "shrink-0 bg-white text-blue-600 hover:bg-blue-50",
          loading && "pointer-events-none",
        )}
      >
        {loading ?
          <IconLoader2 className="h-5 w-5 animate-spin" />
        : <IconArrowRight className="h-5 w-5" />}
      </Button>
    </div>
  )
}

type Props = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onEscape?: () => void
  onSelectSuggestion?: (entry: HistoryEntry) => void
  suggestions?: HistoryEntry[]
  placeholder?: string
  disabled?: boolean
  loading?: boolean
}
